import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { http } from "./httpClient";
import {
  deleteTourImage,
  listTourImages,
  normalizeTourImage,
  resolveImageUrl,
  setPrimaryImage,
  updateTourImage,
  uploadTourImage,
} from "./tourImageService";

vi.mock("./httpClient", () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    upload: vi.fn(),
  },
}));

const RAW_IMAGE = {
  id: 3,
  tour_id: 7,
  image_url: "TourImages/kyoto.jpg",
  full_image_url: "https://cdn.test/kyoto.jpg",
  is_primary: 1,
  status: "ACTIVE",
  created_at: "2026-01-01T00:00:00Z",
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("VITE_API_BASE_URL", "https://api.test.local/v1");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("normalizeTourImage", () => {
  it("maps the documented fields to camelCase", () => {
    expect(normalizeTourImage(RAW_IMAGE)).toEqual({
      id: 3,
      tourId: 7,
      imageUrl: "TourImages/kyoto.jpg",
      fullImageUrl: "https://cdn.test/kyoto.jpg",
      isPrimary: true,
      status: "ACTIVE",
      createdAt: "2026-01-01T00:00:00Z",
    });
  });

  it("tolerates missing fields", () => {
    expect(normalizeTourImage({})).toEqual({
      id: null,
      tourId: null,
      imageUrl: "",
      fullImageUrl: "",
      isPrimary: false,
      status: null,
      createdAt: null,
    });
    expect(normalizeTourImage(null).id).toBeNull();
  });
});

describe("listTourImages", () => {
  it("requests every status for the tour and normalizes the list", async () => {
    http.get.mockResolvedValueOnce({ data: [RAW_IMAGE] });

    const images = await listTourImages(7);

    expect(http.get).toHaveBeenCalledWith("/tour-images?tour_id=7", {
      noAuthRedirect: true,
    });
    expect(images).toEqual([normalizeTourImage(RAW_IMAGE)]);
    expect(http.get.mock.calls[0][0]).not.toContain("status=");
  });

  it("accepts a bare array response", async () => {
    http.get.mockResolvedValueOnce([RAW_IMAGE]);

    await expect(listTourImages(7)).resolves.toHaveLength(1);
  });
});

describe("uploadTourImage", () => {
  it("builds one single-image FormData with no manual headers", async () => {
    http.upload.mockResolvedValueOnce(RAW_IMAGE);
    const file = new File(["x"], "kyoto.jpg", { type: "image/jpeg" });

    const result = await uploadTourImage({
      tourId: 7,
      file,
      isPrimary: true,
      status: "ACTIVE",
    });

    expect(http.upload).toHaveBeenCalledTimes(1);
    const [path, formData] = http.upload.mock.calls[0];
    expect(path).toBe("/tour-images");
    expect(http.upload.mock.calls[0]).toHaveLength(2);
    expect(formData.get("tour_id")).toBe("7");
    expect(formData.get("image")).toBe(file);
    expect(formData.get("is_primary")).toBe("1");
    expect(formData.get("status")).toBe("ACTIVE");
    expect(formData.get("_method")).toBeNull();
    expect(result).toMatchObject({ id: 3, tourId: 7, isPrimary: true });
  });

  it("sends is_primary=0 for a non-primary image", async () => {
    http.upload.mockResolvedValueOnce(RAW_IMAGE);
    const file = new File(["x"], "kyoto.jpg", { type: "image/jpeg" });

    await uploadTourImage({ tourId: 7, file, isPrimary: false, status: "INACTIVE" });

    const formData = http.upload.mock.calls[0][1];
    expect(formData.get("is_primary")).toBe("0");
    expect(formData.get("status")).toBe("INACTIVE");
  });
});

describe("setPrimaryImage", () => {
  it("calls the primary endpoint", async () => {
    http.patch.mockResolvedValueOnce(undefined);

    await expect(setPrimaryImage(5)).resolves.toEqual({ id: 5 });
    expect(http.patch).toHaveBeenCalledWith("/tour-images/5/primary");
  });
});

describe("updateTourImage", () => {
  it("spoofs PUT with a POST FormData carrying _method", async () => {
    http.upload.mockResolvedValueOnce(RAW_IMAGE);
    const file = new File(["x"], "new.png", { type: "image/png" });

    await updateTourImage(5, { file, status: "INACTIVE" });

    const [path, formData, options] = http.upload.mock.calls[0];
    expect(path).toBe("/tour-images/5");
    expect(formData.get("_method")).toBe("PUT");
    expect(formData.get("image")).toBe(file);
    expect(formData.get("status")).toBe("INACTIVE");
    expect(formData.get("tour_id")).toBeNull();
    expect(options).toEqual({ method: "POST" });
    expect(options.headers).toBeUndefined();
  });

  it("can update only the status", async () => {
    http.upload.mockResolvedValueOnce(RAW_IMAGE);

    await updateTourImage(5, { status: "ACTIVE" });

    const formData = http.upload.mock.calls[0][1];
    expect(formData.get("image")).toBeNull();
    expect(formData.get("status")).toBe("ACTIVE");
    expect(formData.get("_method")).toBe("PUT");
  });
});

describe("deleteTourImage", () => {
  it("deletes the image by id", async () => {
    http.delete.mockResolvedValueOnce(undefined);

    await expect(deleteTourImage(5)).resolves.toEqual({ id: 5 });
    expect(http.delete).toHaveBeenCalledWith("/tour-images/5");
  });
});

describe("resolveImageUrl", () => {
  it("prefers a non-local full_image_url", () => {
    expect(
      resolveImageUrl({
        fullImageUrl: "https://cdn.test/full.jpg",
        imageUrl: "https://cdn.test/image.jpg",
      }),
    ).toBe("https://cdn.test/full.jpg");
  });

  it("skips a localhost full_image_url and falls back to an absolute image_url", () => {
    for (const host of [
      "http://localhost:8000",
      "http://127.0.0.1:8000",
      "http://[::1]:8000",
    ]) {
      expect(
        resolveImageUrl({
          fullImageUrl: `${host}/storage/x.jpg`,
          imageUrl: "https://example.com/x.jpg",
        }),
      ).toBe("https://example.com/x.jpg");
    }
  });

  it("uses an absolute image_url", () => {
    expect(resolveImageUrl({ imageUrl: "https://example.com/a.jpg" })).toBe(
      "https://example.com/a.jpg",
    );
  });

  it("builds a storage URL from a relative path", () => {
    expect(resolveImageUrl({ imageUrl: "TourImages/a.jpg" })).toBe(
      "https://api.test.local/storage/TourImages/a.jpg",
    );
    expect(resolveImageUrl({ imageUrl: "/TourImages/a.jpg" })).toBe(
      "https://api.test.local/storage/TourImages/a.jpg",
    );
    expect(
      resolveImageUrl({
        fullImageUrl: "http://127.0.0.1:8000/storage/x.jpg",
        imageUrl: "TourImages/a.jpg",
      }),
    ).toBe("https://api.test.local/storage/TourImages/a.jpg");
  });

  it("treats a localhost absolute image_url as a storage path", () => {
    expect(
      resolveImageUrl({
        imageUrl: "http://127.0.0.1:8000/storage/TourImages/a.jpg",
      }),
    ).toBe("https://api.test.local/storage/TourImages/a.jpg");
  });

  it("does not duplicate the storage segment", () => {
    expect(resolveImageUrl({ imageUrl: "storage/TourImages/a.jpg" })).toBe(
      "https://api.test.local/storage/TourImages/a.jpg",
    );
    expect(resolveImageUrl({ imageUrl: "/storage/TourImages/a.jpg" })).toBe(
      "https://api.test.local/storage/TourImages/a.jpg",
    );
  });

  it("uses a localhost full_image_url pathname when image_url is empty", () => {
    expect(
      resolveImageUrl({
        fullImageUrl: "http://localhost:8000/storage/TourImages/a.jpg",
      }),
    ).toBe("https://api.test.local/storage/TourImages/a.jpg");
  });

  it("never returns javascript: or data: URLs", () => {
    expect(resolveImageUrl({ imageUrl: "javascript:alert(1)" })).toBeNull();
    expect(
      resolveImageUrl({
        fullImageUrl: "javascript:alert(1)",
        imageUrl: "data:image/png;base64,abc",
      }),
    ).toBeNull();
  });

  it("returns null for empty values or when no base URL is configured", () => {
    expect(resolveImageUrl(null)).toBeNull();
    expect(resolveImageUrl({})).toBeNull();
    expect(resolveImageUrl({ imageUrl: "   " })).toBeNull();

    vi.stubEnv("VITE_API_BASE_URL", "");
    expect(resolveImageUrl({ imageUrl: "TourImages/a.jpg" })).toBeNull();
  });
});
