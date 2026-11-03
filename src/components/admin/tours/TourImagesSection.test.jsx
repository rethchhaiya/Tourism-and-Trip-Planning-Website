// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../../../context/AuthContext";
import { useAuth } from "../../../context/useAuth";
import {
  deleteTourImage,
  listTourImages,
  setPrimaryImage,
  updateTourImage,
  uploadTourImage,
} from "../../../services/tourImageService";
import TourImagesSection from "./TourImagesSection";
import {
  DELETE_CONFIRM_MESSAGE,
  MAX_BATCH_FILES,
  MAX_IMAGE_BYTES,
  prepareUploadFiles,
  validateImageFile,
} from "./tourImageFiles";

vi.mock("../../../services/tourImageService", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    listTourImages: vi.fn(),
    uploadTourImage: vi.fn(),
    setPrimaryImage: vi.fn(),
    updateTourImage: vi.fn(),
    deleteTourImage: vi.fn(),
  };
});

const IMAGES = [
  {
    id: 1,
    tourId: 7,
    imageUrl: "TourImages/one.jpg",
    fullImageUrl: "https://cdn.test/one.jpg",
    isPrimary: true,
    status: "ACTIVE",
    createdAt: null,
  },
  {
    id: 2,
    tourId: 7,
    imageUrl: "TourImages/two.jpg",
    fullImageUrl: "https://cdn.test/two.jpg",
    isPrimary: false,
    status: "INACTIVE",
    createdAt: null,
  },
];

function makeFile(name = "photo.jpg", { type = "image/jpeg", size = 1024 } = {}) {
  const file = new File(["x"], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
}

let objectUrlCounter = 0;

function renderSection({ canManage = true, tourId = 7 } = {}) {
  return render(<TourImagesSection tourId={tourId} canManage={canManage} />);
}

function RoleHarness() {
  const { isAdmin } = useAuth();
  return <TourImagesSection tourId={7} canManage={isAdmin} />;
}

function renderAs(role) {
  localStorage.setItem(
    "traveladmin.session",
    JSON.stringify({ token: "test-token", user: { roles: [{ name: role }] } }),
  );
  return render(
    <MemoryRouter>
      <AuthProvider>
        <RoleHarness />
      </AuthProvider>
    </MemoryRouter>,
  );
}

async function waitForGallery() {
  await screen.findByTestId("tour-image-1");
}

beforeEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
  objectUrlCounter = 0;

  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    writable: true,
    value: vi.fn(() => `blob:preview-${objectUrlCounter++}`),
  });
  Object.defineProperty(URL, "revokeObjectURL", {
    configurable: true,
    writable: true,
    value: vi.fn(),
  });

  listTourImages.mockResolvedValue(IMAGES);
  uploadTourImage.mockResolvedValue({});
  setPrimaryImage.mockResolvedValue({});
  updateTourImage.mockResolvedValue({});
  deleteTourImage.mockResolvedValue({});
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.unstubAllEnvs();
  delete URL.createObjectURL;
  delete URL.revokeObjectURL;
});

describe("file validation", () => {
  it("rejects a wrong MIME type", () => {
    expect(validateImageFile(makeFile("photo.gif", { type: "image/gif" }))).toBe(
      "Only JPEG, PNG or WebP images are allowed.",
    );
  });

  it("rejects a wrong extension even with an allowed MIME type", () => {
    expect(
      validateImageFile(makeFile("photo.txt", { type: "image/jpeg" })),
    ).toBe("The file extension must be .jpg, .jpeg, .png or .webp.");
  });

  it("accepts the 5120 KB boundary and rejects one byte over", () => {
    expect(
      validateImageFile(
        makeFile("photo.jpg", { type: "image/jpeg", size: MAX_IMAGE_BYTES }),
      ),
    ).toBeNull();
    expect(
      validateImageFile(
        makeFile("photo.jpg", {
          type: "image/jpeg",
          size: MAX_IMAGE_BYTES + 1,
        }),
      ),
    ).toBe("The file is larger than 5120 KB.");
  });

  it("limits a batch to ten files", () => {
    const files = Array.from({ length: MAX_BATCH_FILES + 1 }, (_, index) =>
      makeFile(`photo-${index}.jpg`),
    );

    const prepared = prepareUploadFiles(files);

    expect(prepared).toHaveLength(MAX_BATCH_FILES + 1);
    expect(prepared.slice(0, MAX_BATCH_FILES).every((item) => !item.reason)).toBe(
      true,
    );
    expect(prepared[MAX_BATCH_FILES].reason).toBe(
      "Up to 10 files can be uploaded at a time.",
    );
  });
});

describe("TourImagesSection gallery", () => {
  it("shows the primary first with badges and hides controls from non-admins", async () => {
    listTourImages.mockResolvedValueOnce([IMAGES[1], IMAGES[0]]);
    renderSection({ canManage: false });

    await waitForGallery();

    const cards = screen.getAllByTestId(/^tour-image-/);
    expect(cards[0].getAttribute("data-testid")).toBe("tour-image-1");
    expect(within(cards[0]).getByText("Primary")).toBeDefined();
    expect(within(cards[0]).getByText("ACTIVE")).toBeDefined();
    expect(within(cards[1]).getByText("INACTIVE")).toBeDefined();

    expect(screen.queryByRole("button", { name: "Set primary" })).toBeNull();
    expect(screen.queryByLabelText("Choose images")).toBeNull();
    expect(
      screen.getByText(
        "You can view these images but only administrators can change them.",
      ),
    ).toBeDefined();
  });

  it("shows admin controls and hides them for managers and guides", async () => {
    const admin = renderAs("admin");
    await waitForGallery();
    expect(
      screen.getAllByRole("button", { name: "Set primary" }).length,
    ).toBeGreaterThan(0);
    expect(screen.getByLabelText("Choose images")).toBeDefined();
    admin.unmount();
    cleanup();
    localStorage.clear();

    const manager = renderAs("tour_manager");
    await waitForGallery();
    expect(screen.queryByRole("button", { name: "Set primary" })).toBeNull();
    expect(screen.queryByLabelText("Choose images")).toBeNull();
    expect(
      screen.getByText(
        "You can view these images but only administrators can change them.",
      ),
    ).toBeDefined();
    manager.unmount();
    cleanup();
    localStorage.clear();

    renderAs("tour_guide");
    await waitForGallery();
    expect(screen.queryByRole("button", { name: "Set primary" })).toBeNull();
    expect(screen.queryByLabelText("Choose images")).toBeNull();
  });

  it("falls back to the storage path when the full image URL fails", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://api.test.local/v1");
    renderSection();
    await waitForGallery();

    const image = screen.getByRole("img", { name: "Tour image 1" });
    expect(image.getAttribute("src")).toBe("https://cdn.test/one.jpg");

    fireEvent.error(image);

    expect(image.getAttribute("src")).toBe(
      "https://api.test.local/storage/TourImages/one.jpg",
    );
  });

  it("shows the image again after a refetch once every candidate failed", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://api.test.local/v1");
    renderSection();
    await waitForGallery();

    fireEvent.error(screen.getByRole("img", { name: "Tour image 1" }));
    fireEvent.error(screen.getByRole("img", { name: "Tour image 1" }));

    expect(
      screen.getByRole("img", { name: "Tour image 1" }).tagName,
    ).not.toBe("IMG");

    fireEvent.click(
      within(screen.getByTestId("tour-image-1")).getByRole("button", {
        name: "Set inactive",
      }),
    );

    await waitFor(() => {
      expect(listTourImages).toHaveBeenCalledTimes(2);
    });

    const image = screen.getByRole("img", { name: "Tour image 1" });
    expect(image.tagName).toBe("IMG");
    expect(image.getAttribute("src")).toBe("https://cdn.test/one.jpg");
  });

  it("resets the fallback when a refetch returns different sources", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "https://api.test.local/v1");
    listTourImages
      .mockResolvedValueOnce(IMAGES)
      .mockResolvedValueOnce([
        {
          ...IMAGES[0],
          imageUrl: "TourImages/one-new.jpg",
          fullImageUrl: "https://cdn.test/one-new.jpg",
        },
        IMAGES[1],
      ]);

    renderSection();
    await waitForGallery();

    fireEvent.error(screen.getByRole("img", { name: "Tour image 1" }));
    fireEvent.error(screen.getByRole("img", { name: "Tour image 1" }));

    expect(
      screen.getByRole("img", { name: "Tour image 1" }).tagName,
    ).not.toBe("IMG");

    fireEvent.click(
      within(screen.getByTestId("tour-image-1")).getByRole("button", {
        name: "Set inactive",
      }),
    );

    await waitFor(() => {
      expect(listTourImages).toHaveBeenCalledTimes(2);
    });

    const image = screen.getByRole("img", { name: "Tour image 1" });
    expect(image.tagName).toBe("IMG");
    expect(image.getAttribute("src")).toBe("https://cdn.test/one-new.jpg");
  });

  it("renders images without a referrer and without crossOrigin", async () => {
    renderSection();
    await waitForGallery();

    const image = screen.getByRole("img", { name: "Tour image 1" });
    expect(image.tagName).toBe("IMG");
    expect(image.getAttribute("referrerpolicy")).toBe("no-referrer");
    expect(image.hasAttribute("crossorigin")).toBe(false);
  });

  it("keeps rows unique when ids are missing and sources match", async () => {
    const shared = {
      id: null,
      tourId: 7,
      imageUrl: "https://cdn.test/shared.jpg",
      fullImageUrl: "",
      isPrimary: false,
      status: "ACTIVE",
      createdAt: null,
    };
    listTourImages.mockResolvedValueOnce([shared, { ...shared }]);

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      renderSection();
      await screen.findAllByTestId("tour-image-null");

      expect(screen.getAllByRole("img", { name: "Tour image" })).toHaveLength(2);

      const messages = errorSpy.mock.calls
        .map(([message]) => String(message))
        .join(" ");
      expect(messages).not.toContain("same key");
    } finally {
      errorSpy.mockRestore();
    }
  });

  it("warns about a failed candidate in development without the query string", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      listTourImages.mockResolvedValueOnce([
        {
          id: 9,
          tourId: 7,
          imageUrl:
            "https://cdn.test/path/photo.jpg?token=secret&signature=abc",
          fullImageUrl: "",
          isPrimary: true,
          status: "ACTIVE",
          createdAt: null,
        },
      ]);

      renderSection();
      await screen.findByTestId("tour-image-9");

      fireEvent.error(screen.getByRole("img", { name: "Tour image 9" }));

      const warnings = warnSpy.mock.calls
        .map(([message]) => String(message))
        .filter((message) => message.includes("[TourImagesSection]"));
      expect(warnings).toHaveLength(1);
      expect(warnings[0]).toContain("cdn.test");
      expect(warnings[0]).toContain("/path/photo.jpg");
      expect(warnings[0]).toContain("candidate 0");
      expect(warnings[0]).not.toContain("secret");
      expect(warnings[0]).not.toContain("?");
    } finally {
      warnSpy.mockRestore();
    }
  });

  it("shows loading, empty and error states with retry", async () => {
    listTourImages.mockRejectedValueOnce({ status: 500 }).mockResolvedValueOnce([]);
    renderSection();

    expect(await screen.findByText("Could not load images.")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByText("No images yet.")).toBeDefined();
  });
});

describe("TourImagesSection uploads", () => {
  it("uploads sequentially, continues after a failure and refetches", async () => {
    const order = [];
    uploadTourImage.mockImplementation(async ({ file }) => {
      order.push(`start:${file.name}`);
      if (file.name === "b.jpg") {
        order.push("fail:b.jpg");
        throw { status: 500 };
      }
      await Promise.resolve();
      order.push(`end:${file.name}`);
      return {};
    });

    renderSection();
    await waitForGallery();

    const files = [
      makeFile("a.jpg"),
      makeFile("b.jpg"),
      makeFile("c.jpg"),
    ];
    fireEvent.change(screen.getByLabelText("Choose images"), {
      target: { files },
    });

    expect(screen.getAllByText("Waiting")).toHaveLength(3);
    fireEvent.click(screen.getByRole("button", { name: "Upload" }));

    await waitFor(() => {
      expect(uploadTourImage).toHaveBeenCalledTimes(3);
    });

    expect(order).toEqual([
      "start:a.jpg",
      "end:a.jpg",
      "start:b.jpg",
      "fail:b.jpg",
      "start:c.jpg",
      "end:c.jpg",
    ]);
    expect(screen.getAllByText("Done")).toHaveLength(2);
    expect(screen.getByText("Failed")).toBeDefined();
    expect(
      screen.getByText("Could not upload this image. Please try again."),
    ).toBeDefined();

    await waitFor(() => {
      expect(listTourImages).toHaveBeenCalledTimes(2);
    });

    expect(uploadTourImage.mock.calls.map(([payload]) => payload.file.name)).toEqual([
      "a.jpg",
      "b.jpg",
      "c.jpg",
    ]);
    expect(uploadTourImage.mock.calls[0][0]).toMatchObject({
      tourId: 7,
      isPrimary: false,
      status: "ACTIVE",
    });
  });

  it("sends the first valid file as primary when requested", async () => {
    renderSection();
    await waitForGallery();

    fireEvent.change(screen.getByLabelText("Choose images"), {
      target: { files: [makeFile("a.jpg"), makeFile("b.jpg")] },
    });
    fireEvent.click(screen.getByLabelText("Make the first one primary"));
    fireEvent.click(screen.getByRole("button", { name: "Upload" }));

    await waitFor(() => {
      expect(uploadTourImage).toHaveBeenCalledTimes(2);
    });

    expect(uploadTourImage.mock.calls[0][0]).toMatchObject({
      isPrimary: true,
    });
    expect(uploadTourImage.mock.calls[1][0]).toMatchObject({
      isPrimary: false,
    });
  });

  it("retries only the failed file", async () => {
    uploadTourImage
      .mockRejectedValueOnce({ status: 500 })
      .mockResolvedValueOnce({});

    renderSection();
    await waitForGallery();

    fireEvent.change(screen.getByLabelText("Choose images"), {
      target: { files: [makeFile("a.jpg")] },
    });
    fireEvent.click(screen.getByRole("button", { name: "Upload" }));

    expect(await screen.findByText("Failed")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    await waitFor(() => {
      expect(uploadTourImage).toHaveBeenCalledTimes(2);
    });
    expect(await screen.findByText("Done")).toBeDefined();
    await waitFor(() => {
      expect(listTourImages).toHaveBeenCalledTimes(3);
    });
  });

  it("lists rejected files with a reason and does not send them", async () => {
    renderSection();
    await waitForGallery();

    fireEvent.change(screen.getByLabelText("Choose images"), {
      target: {
        files: [
          makeFile("good.jpg"),
          makeFile("bad.gif", { type: "image/gif" }),
          makeFile("huge.jpg", { size: MAX_IMAGE_BYTES + 1 }),
        ],
      },
    });

    expect(screen.getAllByText("Rejected")).toHaveLength(2);
    expect(
      screen.getByText("Only JPEG, PNG or WebP images are allowed."),
    ).toBeDefined();
    expect(screen.getByText("The file is larger than 5120 KB.")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Upload" }));

    await waitFor(() => {
      expect(uploadTourImage).toHaveBeenCalledTimes(1);
    });
    expect(uploadTourImage.mock.calls[0][0].file.name).toBe("good.jpg");
  });

  it("maps 413 and 422 upload errors onto the file", async () => {
    uploadTourImage
      .mockRejectedValueOnce({ status: 413 })
      .mockRejectedValueOnce({
        status: 422,
        errors: { image: ["The image field is required."] },
      });

    renderSection();
    await waitForGallery();

    fireEvent.change(screen.getByLabelText("Choose images"), {
      target: { files: [makeFile("a.jpg"), makeFile("b.jpg")] },
    });
    fireEvent.click(screen.getByRole("button", { name: "Upload" }));

    expect(
      await screen.findByText("The file is too large for the server"),
    ).toBeDefined();
    expect(
      await screen.findByText("The image field is required."),
    ).toBeDefined();
  });

  it("shows the uploaded image from the server after it completes", async () => {
    uploadTourImage.mockResolvedValueOnce({
      fullImageUrl: "https://cdn.test/uploaded.jpg",
      imageUrl: "TourImages/uploaded.jpg",
    });

    renderSection();
    await waitForGallery();

    fireEvent.change(screen.getByLabelText("Choose images"), {
      target: { files: [makeFile("uploaded.jpg")] },
    });
    fireEvent.click(screen.getByRole("button", { name: "Upload" }));

    await screen.findByText("Done");

    const preview = screen.getByRole("img", { name: "uploaded.jpg" });
    expect(preview.tagName).toBe("IMG");
    expect(preview.getAttribute("src")).toBe(
      "https://cdn.test/uploaded.jpg",
    );
  });

  it("revokes object URLs when an upload finishes and on unmount", async () => {
    const view = renderSection();
    await waitForGallery();

    fireEvent.change(screen.getByLabelText("Choose images"), {
      target: { files: [makeFile("a.jpg")] },
    });
    fireEvent.click(screen.getByRole("button", { name: "Upload" }));

    await waitFor(() => {
      expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview-0");
    });

    fireEvent.change(screen.getByLabelText("Choose images"), {
      target: { files: [makeFile("b.jpg")] },
    });
    view.unmount();

    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview-1");
  });
});

describe("TourImagesSection admin actions", () => {
  it("moves the primary badge after set primary and refetches", async () => {
    listTourImages
      .mockResolvedValueOnce(IMAGES)
      .mockResolvedValueOnce([
        { ...IMAGES[0], isPrimary: false },
        { ...IMAGES[1], isPrimary: true },
      ]);

    renderSection();
    await waitForGallery();

    const secondCard = screen.getByTestId("tour-image-2");
    fireEvent.click(
      within(secondCard).getByRole("button", { name: "Set primary" }),
    );

    await waitFor(() => {
      expect(setPrimaryImage).toHaveBeenCalledWith(2);
    });
    await waitFor(() => {
      expect(
        within(screen.getByTestId("tour-image-2")).getByText("Primary"),
      ).toBeDefined();
    });
    expect(
      within(screen.getByTestId("tour-image-1")).queryByText("Primary"),
    ).toBeNull();
    expect(listTourImages).toHaveBeenCalledTimes(2);
  });

  it("toggles status through updateTourImage and refetches", async () => {
    renderSection();
    await waitForGallery();

    const firstCard = screen.getByTestId("tour-image-1");
    fireEvent.click(
      within(firstCard).getByRole("button", { name: "Set inactive" }),
    );

    await waitFor(() => {
      expect(updateTourImage).toHaveBeenCalledWith(1, { status: "INACTIVE" });
    });
    await waitFor(() => {
      expect(listTourImages).toHaveBeenCalledTimes(2);
    });
  });

  it("replaces a file through updateTourImage and refetches", async () => {
    renderSection();
    await waitForGallery();

    const replacement = makeFile("replacement.png", { type: "image/png" });
    const firstCard = screen.getByTestId("tour-image-1");
    fireEvent.change(within(firstCard).getByLabelText("Replace file"), {
      target: { files: [replacement] },
    });

    await waitFor(() => {
      expect(updateTourImage).toHaveBeenCalledWith(1, { file: replacement });
    });
    await waitFor(() => {
      expect(listTourImages).toHaveBeenCalledTimes(2);
    });
  });

  it("confirms deletion, refetches and notes the missing primary", async () => {
    renderSection();
    await waitForGallery();

    const firstCard = screen.getByTestId("tour-image-1");
    fireEvent.click(within(firstCard).getByRole("button", { name: "Delete" }));

    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText(DELETE_CONFIRM_MESSAGE)).toBeDefined();

    fireEvent.click(within(dialog).getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(deleteTourImage).toHaveBeenCalledWith(1);
    });
    await waitFor(() => {
      expect(listTourImages).toHaveBeenCalledTimes(2);
    });
    expect(
      screen.getByText("This tour now has no primary image."),
    ).toBeDefined();
  });

  it("does not delete when the confirmation is cancelled", async () => {
    renderSection();
    await waitForGallery();

    fireEvent.click(
      within(screen.getByTestId("tour-image-1")).getByRole("button", {
        name: "Delete",
      }),
    );
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Cancel",
      }),
    );

    expect(deleteTourImage).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
