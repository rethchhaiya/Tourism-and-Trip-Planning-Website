import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import TourDetailPage from "./TourDetailPage";
import { fetchTourById } from "../../services/catalogService";
import { http } from "../../services/httpClient";

vi.mock("../../services/catalogService", () => ({
  fetchTourById: vi.fn(),
}));

vi.mock("../../services/httpClient", () => ({
  http: { get: vi.fn() },
}));

vi.mock("../../components/Header", () => ({
  default: () => <header data-testid="header" />,
}));

const DETAIL_RESPONSE = {
  message: "Tour retrieved successfully",
  data: {
    id: 1,
    title: "3-Day Angkor Discovery",
    slug: "3-day-angkor-discovery",
    base_price: "499.00",
    price_override: null,
    duration_day: 3,
    duration_night: 2,
    status: "published",
    category: {
      id: 3,
      name: "Cultural Tours",
      description: "Temples and heritage.",
      image: "https://example.com/category.jpg",
      status: 1,
    },
    destination: {
      id: 1,
      name: "Siem Reap",
      description: "Gateway to Angkor.",
      image: "https://example.com/destination.jpg",
      status: 1,
    },
    tourImages: [
      {
        tour_id: 1,
        image_url: "https://example.com/secondary.jpg",
        is_primary: false,
        status: "ACTIVE",
      },
      {
        tour_id: 1,
        image_url: "https://example.com/primary.jpg",
        is_primary: true,
        status: "ACTIVE",
      },
      {
        tour_id: 1,
        image_url: "https://example.com/inactive.jpg",
        is_primary: false,
        status: "INACTIVE",
      },
    ],
    includeExclude: [
      {
        tour_id: 1,
        type: "INCLUDED",
        description: "Hotel pickup",
        status: "ACTIVE",
      },
      {
        tour_id: 1,
        type: "EXCLUDED",
        description: "Travel insurance",
        status: "ACTIVE",
      },
      {
        tour_id: 1,
        type: "INCLUDED",
        description: "Inactive perk",
        status: "INACTIVE",
      },
      {
        tour_id: 1,
        type: "INCLUDED",
        description: "Breakfast",
        status: "ACTIVE",
      },
    ],
    tourItinerary: [
      {
        tour_id: 1,
        day_number: 2,
        title: "Temples",
        description: "Bayon and Ta Prohm.",
        meals_included: "Lunch",
        status: "ACTIVE",
      },
      {
        tour_id: 1,
        day_number: 1,
        title: "Arrival",
        description: "Check in and sunset.",
        meals_included: "Dinner",
        status: "ACTIVE",
      },
      {
        tour_id: 1,
        day_number: 3,
        title: "Inactive day",
        description: "Should not render.",
        meals_included: "",
        status: "INACTIVE",
      },
    ],
    tourSchedule: [
      {
        id: 1,
        start_datetime: "2099-12-01T08:00:00Z",
        end_datetime: "2099-12-03T18:00:00Z",
        booking_cutoff_datetime: "2099-11-20T00:00:00Z",
        min_capacity: 5,
        max_capacity: 25,
        current_booked: 1,
        price_override: "0.99",
        status: "published",
        notes: "Meet at the hotel lobby.",
      },
      {
        id: 2,
        start_datetime: "2000-11-01T08:00:00Z",
        end_datetime: "2000-11-03T18:00:00Z",
        booking_cutoff_datetime: "2000-10-01T00:00:00Z",
        min_capacity: 5,
        max_capacity: 5,
        current_booked: 5,
        price_override: null,
        status: "published",
        notes: "",
      },
    ],
  },
};

function renderDetailPage(id = 1) {
  return render(
    <MemoryRouter initialEntries={[`/tours/${id}`]}>
      <Routes>
        <Route path="/tours/:id" element={<TourDetailPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  fetchTourById.mockResolvedValue(DETAIL_RESPONSE.data);
});

afterEach(() => {
  vi.resetAllMocks();
});

describe("TourDetailPage", () => {
  it("renders a published tour from the live response shape", async () => {
    renderDetailPage();

    expect(
      await screen.findByRole("heading", {
        name: "3-Day Angkor Discovery",
        level: 1,
      }),
    ).toBeTruthy();
    expect(screen.getByTestId("header")).toBeTruthy();

    expect(
      screen.getByRole("heading", { name: "About Siem Reap" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Category" }),
    ).toBeTruthy();
    expect(screen.getByText("Temples and heritage.")).toBeTruthy();
    expect(screen.getByText("3 days / 2 nights")).toBeTruthy();
    expect(screen.getByText("$499.00")).toBeTruthy();

    expect(
      screen.getByAltText("3-Day Angkor Discovery photo 1").src,
    ).toBe("https://example.com/primary.jpg");
    expect(
      screen.getByAltText("3-Day Angkor Discovery photo 2").src,
    ).toBe("https://example.com/secondary.jpg");
    expect(
      screen.queryByAltText("3-Day Angkor Discovery photo 3"),
    ).toBeNull();
  });

  it("splits active inclusions and exclusions by type", async () => {
    renderDetailPage();

    const includedSection = (
      await screen.findByRole("heading", { name: "What's included" })
    ).parentElement;
    const excludedSection = screen.getByRole("heading", {
      name: "Not included",
    }).parentElement;

    expect(within(includedSection).getByText("Hotel pickup")).toBeTruthy();
    expect(within(includedSection).getByText("Breakfast")).toBeTruthy();
    expect(
      within(includedSection).queryByText("Travel insurance"),
    ).toBeNull();
    expect(within(includedSection).queryByText("Inactive perk")).toBeNull();

    expect(
      within(excludedSection).getByText("Travel insurance"),
    ).toBeTruthy();
    expect(within(excludedSection).queryByText("Hotel pickup")).toBeNull();
  });

  it("renders the itinerary read-only and sorted by day number", async () => {
    renderDetailPage();

    const itinerarySection = (
      await screen.findByRole("heading", { name: "Itinerary" })
    ).closest("section");
    const days = within(itinerarySection)
      .getAllByRole("listitem")
      .map((item) => item.textContent);

    expect(days[0]).toContain("Day 1: Arrival");
    expect(days[1]).toContain("Day 2: Temples");
    expect(days).toHaveLength(2);
    expect(screen.queryByText("Should not render.")).toBeNull();
  });

  it("shows seats left, sold out, departure price, and closed schedules", async () => {
    renderDetailPage();

    const scheduleSection = (
      await screen.findByRole("heading", { name: "Departure dates" })
    ).closest("section");

    expect(within(scheduleSection).getByText("24 seats left")).toBeTruthy();
    expect(within(scheduleSection).getByText("Sold out")).toBeTruthy();
    expect(
      within(scheduleSection).getByText(/Departure price: \$0\.99/),
    ).toBeTruthy();
    expect(within(scheduleSection).getByText("Closed")).toBeTruthy();
    expect(
      within(scheduleSection).getByText("Meet at the hotel lobby."),
    ).toBeTruthy();
  });

  it("shows not found for a draft tour", async () => {
    fetchTourById.mockResolvedValue({
      ...DETAIL_RESPONSE.data,
      status: "draft",
    });

    renderDetailPage();

    expect(await screen.findByText("Tour not found")).toBeTruthy();
    expect(screen.queryByText("3-Day Angkor Discovery")).toBeNull();
  });

  it("treats the published status case-insensitively", async () => {
    fetchTourById.mockResolvedValue({
      ...DETAIL_RESPONSE.data,
      status: "PUBLISHED",
    });

    renderDetailPage();

    expect(
      await screen.findByRole("heading", {
        name: "3-Day Angkor Discovery",
        level: 1,
      }),
    ).toBeTruthy();
  });

  it("shows a generic not found for a 404 without leaking the API message", async () => {
    fetchTourById.mockRejectedValue(
      Object.assign(
        new Error("SQLSTATE[HY000]: internal path /var/www/secret"),
        { status: 404 },
      ),
    );

    renderDetailPage();

    expect(await screen.findByText("Tour not found")).toBeTruthy();
    expect(screen.queryByText(/SQLSTATE/)).toBeNull();
    expect(screen.queryByText(/var\/www/)).toBeNull();
  });

  it("tolerates empty detail arrays", async () => {
    fetchTourById.mockResolvedValue({
      ...DETAIL_RESPONSE.data,
      tourImages: [],
      includeExclude: [],
      tourItinerary: [],
      tourSchedule: [],
    });

    renderDetailPage();

    expect(
      await screen.findByRole("heading", {
        name: "3-Day Angkor Discovery",
        level: 1,
      }),
    ).toBeTruthy();
    expect(screen.getByText("No inclusions listed.")).toBeTruthy();
    expect(screen.getByText("No exclusions listed.")).toBeTruthy();
    expect(screen.getByText("No departure dates available.")).toBeTruthy();
    expect(screen.getAllByTestId("tour-detail-image-fallback")).toHaveLength(1);
  });

  it("falls back to a placeholder when a tour image fails to load", async () => {
    renderDetailPage();

    const image = await screen.findByAltText(
      "3-Day Angkor Discovery photo 1",
    );
    fireEvent.error(image);

    expect(
      screen.queryByAltText("3-Day Angkor Discovery photo 1"),
    ).toBeNull();
    expect(screen.getAllByTestId("tour-detail-image-fallback")).toHaveLength(1);
  });

  it("shows an error state with retry for non-404 failures", async () => {
    fetchTourById.mockRejectedValueOnce(
      Object.assign(new Error("Network down"), { status: 0 }),
    );

    renderDetailPage();

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain(
      "We couldn't load this tour. Please try again.",
    );
    expect(screen.queryByText("Network down")).toBeNull();

    await screen.findByRole("button", { name: "Retry" });
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(
      await screen.findByRole("heading", {
        name: "3-Day Angkor Discovery",
        level: 1,
      }),
    ).toBeTruthy();
  });
});

describe("catalogService.fetchTourById", () => {
  it("requests the public detail endpoint without an auth redirect and unwraps data", async () => {
    const { fetchTourById: realFetchTourById } = await vi.importActual(
      "../../services/catalogService",
    );
    http.get.mockResolvedValue(DETAIL_RESPONSE);

    const tour = await realFetchTourById(1);

    expect(tour).toEqual(DETAIL_RESPONSE.data);
    expect(http.get).toHaveBeenCalledWith("/tours/1", {
      noAuthRedirect: true,
    });
  });
});
