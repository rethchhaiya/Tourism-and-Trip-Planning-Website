import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ToursCatalogPage from "./ToursCatalogPage";
import CategoriesPage from "./CategoriesPage";
import { fetchCategories, fetchTours } from "../../services/catalogService";
import { normalizeTour } from "../../utils/catalog";
import { http } from "../../services/httpClient";

vi.mock("../../services/catalogService", () => ({
  fetchTours: vi.fn(),
  fetchCategories: vi.fn(),
}));

vi.mock("../../services/httpClient", () => ({
  http: { get: vi.fn() },
}));

vi.mock("../../components/Header", () => ({
  default: () => <header data-testid="header" />,
}));

const REAL_RESPONSE = {
  data: [
    {
      id: 1,
      title: "3-Day Exotic Bali Getaway",
      slug: "3-day-exotic-bali-getaway",
      base_price: "499.00",
      price_override: null,
      duration_day: 3,
      duration_night: 2,
      status: "published",
      tourImages: [
        {
          tour_id: 1,
          image_url: "https://img.test/bali.jpg",
          is_primary: true,
          status: "ACTIVE",
        },
      ],
    },
    {
      id: 3,
      title: "5-Day Kyoto Heritage Tour",
      slug: "5-day-kyoto-heritage-tour",
      base_price: "850.00",
      price_override: "799.00",
      duration_day: 5,
      duration_night: 4,
      status: "published",
      tourImages: [],
    },
  ],
  links: {
    first: "http://localhost/api/tours?page=1",
    last: "http://localhost/api/tours?page=1",
    prev: null,
    next: null,
  },
  meta: {
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 2,
  },
  message: "Tours retrieved successfully",
};

const DRAFT_TOUR = {
  id: 2,
  title: "Unreleased Secret Tour",
  slug: "unreleased-secret-tour",
  base_price: "120.00",
  price_override: null,
  duration_day: 1,
  duration_night: 0,
  status: "draft",
  tourImages: [],
};

function flush() {
  return act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

function mockToursPage({
  data = REAL_RESPONSE.data,
  meta = REAL_RESPONSE.meta,
} = {}) {
  fetchTours.mockResolvedValue({
    tours: data,
    meta,
    links: REAL_RESPONSE.links,
  });
}

beforeEach(() => {
  vi.useFakeTimers();
  fetchCategories.mockResolvedValue([]);
});

afterEach(() => {
  vi.useRealTimers();
  vi.resetAllMocks();
});

describe("ToursCatalogPage", () => {
  it("renders published tours from the real response shape with mapped fields", async () => {
    mockToursPage();

    render(
      <MemoryRouter>
        <ToursCatalogPage />
      </MemoryRouter>,
    );
    await flush();

    expect(screen.getByTestId("header")).toBeTruthy();
    expect(screen.getByText("3-Day Exotic Bali Getaway")).toBeTruthy();
    expect(screen.getByAltText("3-Day Exotic Bali Getaway").src).toBe(
      "https://img.test/bali.jpg",
    );
    expect(screen.getByText("$499.00")).toBeTruthy();
    expect(screen.getByText("5-Day Kyoto Heritage Tour")).toBeTruthy();
    expect(screen.getByText("$799.00")).toBeTruthy();
    expect(screen.getByText("5 days / 4 nights")).toBeTruthy();
    expect(screen.queryByAltText("5-Day Kyoto Heritage Tour")).toBeNull();
  });

  it("falls back to a placeholder when a tour image fails to load", async () => {
    mockToursPage({ data: [REAL_RESPONSE.data[0]] });

    render(
      <MemoryRouter>
        <ToursCatalogPage />
      </MemoryRouter>,
    );
    await flush();

    const image = screen.getByAltText("3-Day Exotic Bali Getaway");
    fireEvent.error(image);

    expect(screen.queryByAltText("3-Day Exotic Bali Getaway")).toBeNull();
    expect(screen.getAllByTestId("tour-image-fallback").length).toBe(1);
  });

  it("filters loaded tours by title case-insensitively and still sends search", async () => {
    mockToursPage();

    render(
      <MemoryRouter>
        <ToursCatalogPage />
      </MemoryRouter>,
    );
    await flush();
    expect(screen.getByText("3-Day Exotic Bali Getaway")).toBeTruthy();
    expect(screen.getByText("5-Day Kyoto Heritage Tour")).toBeTruthy();

    fireEvent.change(screen.getByPlaceholderText("Search tours by title..."), {
      target: { value: "KYOTO" },
    });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });
    await flush();

    expect(fetchTours).toHaveBeenLastCalledWith({
      page: 1,
      search: "KYOTO",
      categoryId: "",
    });
    expect(screen.getByText("5-Day Kyoto Heritage Tour")).toBeTruthy();
    expect(screen.queryByText("3-Day Exotic Bali Getaway")).toBeNull();
  });

  it("uses meta.current_page and meta.last_page from the server", async () => {
    mockToursPage({
      data: [REAL_RESPONSE.data[0]],
      meta: {
        current_page: 2,
        last_page: 3,
        per_page: 10,
        total: 25,
      },
    });

    render(
      <MemoryRouter>
        <ToursCatalogPage />
      </MemoryRouter>,
    );
    await flush();

    const currentPage = screen.getByRole("button", { name: "2" });
    expect(currentPage.getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("button", { name: "Previous" }).disabled).toBe(
      false,
    );
    expect(screen.getByRole("button", { name: "Next" }).disabled).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    await flush();

    expect(fetchTours).toHaveBeenLastCalledWith({
      page: 3,
      search: "",
      categoryId: "",
    });
  });

  it("hides the category filter while it is disabled", async () => {
    mockToursPage();

    render(
      <MemoryRouter>
        <ToursCatalogPage />
      </MemoryRouter>,
    );
    await flush();

    expect(
      screen.queryByRole("button", { name: "All categories" }),
    ).toBeNull();
    expect(fetchCategories).not.toHaveBeenCalled();
  });

  it("shows the empty state when there are no results", async () => {
    mockToursPage({ data: [], meta: { ...REAL_RESPONSE.meta, total: 0 } });

    render(
      <MemoryRouter>
        <ToursCatalogPage />
      </MemoryRouter>,
    );
    await flush();

    expect(screen.getByText("No tours found")).toBeTruthy();
  });

  it("shows the error state with a retry button", async () => {
    fetchTours.mockRejectedValueOnce(new Error("Unable to reach the server."));

    render(
      <MemoryRouter>
        <ToursCatalogPage />
      </MemoryRouter>,
    );
    await flush();

    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("Unable to reach the server.");

    mockToursPage();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Retry" }));
      await vi.runAllTimersAsync();
    });
    await flush();

    expect(screen.getByText("3-Day Exotic Bali Getaway")).toBeTruthy();
  });

  it("never shows draft tours", async () => {
    mockToursPage({ data: [DRAFT_TOUR, ...REAL_RESPONSE.data] });

    render(
      <MemoryRouter>
        <ToursCatalogPage />
      </MemoryRouter>,
    );
    await flush();

    expect(screen.queryByText("Unreleased Secret Tour")).toBeNull();
    expect(screen.getByText("3-Day Exotic Bali Getaway")).toBeTruthy();
  });
});

describe("normalizeTour", () => {
  it("maps the real API shape to camelCase numbers and a primary image", () => {
    expect(normalizeTour(REAL_RESPONSE.data[0])).toEqual({
      id: 1,
      title: "3-Day Exotic Bali Getaway",
      slug: "3-day-exotic-bali-getaway",
      basePrice: 499,
      priceOverride: null,
      displayPrice: 499,
      durationDays: 3,
      durationNights: 2,
      status: "published",
      images: [
        {
          url: "https://img.test/bali.jpg",
          isPrimary: true,
          status: "ACTIVE",
        },
      ],
      primaryImage: "https://img.test/bali.jpg",
    });
  });

  it("uses the override price and tolerates empty or missing tourImages", () => {
    const empty = normalizeTour(REAL_RESPONSE.data[1]);
    expect(empty.basePrice).toBe(850);
    expect(empty.priceOverride).toBe(799);
    expect(empty.displayPrice).toBe(799);
    expect(empty.images).toEqual([]);
    expect(empty.primaryImage).toBe("");

    const missing = normalizeTour({
      ...REAL_RESPONSE.data[1],
      tourImages: undefined,
    });
    expect(missing.images).toEqual([]);
    expect(missing.primaryImage).toBe("");
  });
});

describe("catalogService.fetchTours", () => {
  it("keeps items, pagination meta, and links from the real envelope", async () => {
    const { fetchTours: realFetchTours } = await vi.importActual(
      "../../services/catalogService",
    );
    http.get.mockResolvedValue(REAL_RESPONSE);

    const result = await realFetchTours({ page: 1 });

    expect(result.tours).toEqual(REAL_RESPONSE.data);
    expect(result.meta).toEqual(REAL_RESPONSE.meta);
    expect(result.links).toEqual(REAL_RESPONSE.links);
    expect(http.get).toHaveBeenCalledWith("/tours?page=1");
  });
});

describe("CategoriesPage", () => {
  it("renders only active categories", async () => {
    fetchCategories.mockResolvedValue([
      { id: 1, name: "Adventure & Outdoors", description: "Trips", status: 1 },
      { id: 2, name: "Hidden Draft Category", description: "x", status: 0 },
    ]);

    render(
      <MemoryRouter>
        <CategoriesPage />
      </MemoryRouter>,
    );
    await flush();

    expect(screen.getByTestId("header")).toBeTruthy();
    expect(screen.getByText("Adventure & Outdoors")).toBeTruthy();
    expect(screen.queryByText("Hidden Draft Category")).toBeNull();
  });

  it("filters categories by the debounced search term", async () => {
    fetchCategories.mockResolvedValue([
      { id: 1, name: "Adventure & Outdoors", description: "Trips", status: 1 },
      { id: 2, name: "Beach Getaways", description: "Trips", status: 1 },
    ]);

    render(
      <MemoryRouter>
        <CategoriesPage />
      </MemoryRouter>,
    );
    await flush();
    expect(screen.getByText("Adventure & Outdoors")).toBeTruthy();

    fireEvent.change(screen.getByPlaceholderText("Search categories..."), {
      target: { value: "beach" },
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });

    expect(screen.queryByText("Adventure & Outdoors")).toBeNull();
    expect(screen.getByText("Beach Getaways")).toBeTruthy();
  });

  it("shows the empty state when nothing matches", async () => {
    fetchCategories.mockResolvedValue([]);

    render(
      <MemoryRouter>
        <CategoriesPage />
      </MemoryRouter>,
    );
    await flush();

    expect(screen.getByText("No categories found")).toBeTruthy();
  });

  it("shows the error state", async () => {
    fetchCategories.mockRejectedValue(new Error("No connection"));

    render(
      <MemoryRouter>
        <CategoriesPage />
      </MemoryRouter>,
    );
    await flush();

    expect(screen.getByRole("alert").textContent).toContain("No connection");
    expect(screen.getByRole("button", { name: "Retry" })).toBeTruthy();
  });
});
