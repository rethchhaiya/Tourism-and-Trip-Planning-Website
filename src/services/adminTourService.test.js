import { beforeEach, describe, expect, it, vi } from "vitest";
import { http } from "./httpClient";
import {
  TOUR_STATUS_CASING,
  buildTourPayload,
  createTour,
  deleteTour,
  getAdminTour,
  listAdminTours,
  restoreTour,
  toTourForm,
  updateTour,
} from "./adminTourService";

vi.mock("./httpClient", () => ({
  http: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const FORM = {
  title: "  Kyoto Discovery  ",
  categoryId: "3",
  destinationId: "9",
  durationDays: "4",
  durationNights: "3",
  basePrice: "1200.00",
  priceOverride: "",
  status: "PUBLISHED",
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("buildTourPayload", () => {
  it("uses request field names, numeric values, lowercase status and null override", () => {
    expect(TOUR_STATUS_CASING).toBe("lower");
    expect(buildTourPayload(FORM)).toEqual({
      category_id: 3,
      destination_id: 9,
      title: "Kyoto Discovery",
      duration_days: 4,
      duration_nights: 3,
      base_price: 1200,
      price_override: null,
      status: "published",
    });
  });

  it("returns only changed fields for PATCH", () => {
    const original = {
      ...FORM,
      title: "Kyoto Discovery",
      status: "draft",
      durationDays: "3",
    };

    expect(
      buildTourPayload(
        { ...FORM, durationDays: "5", priceOverride: "999.50" },
        original,
      ),
    ).toEqual({
      duration_days: 5,
      price_override: 999.5,
      status: "published",
    });
  });

  it("treats a cleared override as an explicit null change", () => {
    expect(
      buildTourPayload(
        { ...FORM, priceOverride: "" },
        { ...FORM, priceOverride: "100.00" },
      ),
    ).toEqual({ price_override: null });
  });
});

describe("toTourForm", () => {
  it("prefills from the detail response shape", () => {
    expect(
      toTourForm({
        title: "Kyoto Discovery",
        slug: "kyoto-discovery",
        category: { id: 3, name: "Cultural" },
        destination: { id: 9, name: "Kyoto" },
        duration_day: 4,
        duration_night: 3,
        base_price: "1200.00",
        price_override: null,
        status: "PUBLISHED",
      }),
    ).toEqual({
      title: "Kyoto Discovery",
      categoryId: 3,
      destinationId: 9,
      durationDays: 4,
      durationNights: 3,
      basePrice: "1200.00",
      priceOverride: "",
      status: "published",
    });
  });
});

describe("admin tour requests", () => {
  it("lists a server page and keeps pagination meta", async () => {
    http.get.mockResolvedValueOnce({
      data: [
        {
          id: 1,
          title: "Kyoto",
          slug: "kyoto",
          base_price: "100.00",
          price_override: null,
          duration_day: 3,
          duration_night: 2,
          status: "published",
          tourImages: [],
        },
      ],
      links: { next: "..." },
      meta: { current_page: 2, last_page: 4, per_page: 10, total: 35 },
    });

    const result = await listAdminTours({ page: 2 });

    expect(http.get).toHaveBeenCalledWith("/tours?page=2", {
      noAuthRedirect: true,
    });
    expect(result.meta).toEqual({
      current_page: 2,
      last_page: 4,
      per_page: 10,
      total: 35,
    });
    expect(result.tours[0]).toMatchObject({
      id: 1,
      title: "Kyoto",
      durationDays: 3,
      durationNights: 2,
    });
  });

  it("loads and normalizes a tour detail", async () => {
    http.get.mockResolvedValueOnce({
      data: {
        id: 7,
        title: "Kyoto",
        category: { id: 3, name: "Cultural" },
        destination: { id: 9, name: "Kyoto" },
        duration_day: 4,
        duration_night: 3,
        base_price: "1200.00",
        status: "published",
      },
    });

    const tour = await getAdminTour(7);

    expect(http.get).toHaveBeenCalledWith("/tours/7", {
      noAuthRedirect: true,
    });
    expect(tour).toMatchObject({
      id: 7,
      title: "Kyoto",
      category: { id: 3, name: "Cultural" },
      destination: { id: 9, name: "Kyoto" },
    });
  });

  it("uses PATCH, DELETE and the restore endpoint", async () => {
    http.patch.mockResolvedValueOnce({ data: { id: 7 } });
    await updateTour(7, { title: "Updated" });
    expect(http.patch).toHaveBeenCalledWith("/tours/7", {
      title: "Updated",
    });

    http.post.mockResolvedValueOnce({ data: { id: 5 } });
    await createTour({ title: "New" });
    expect(http.post).toHaveBeenCalledWith("/tours", { title: "New" });

    await deleteTour(7);
    expect(http.delete).toHaveBeenCalledWith("/tours/7");

    await restoreTour(7);
    expect(http.post).toHaveBeenCalledWith("/tours/7/restore");
  });
});
