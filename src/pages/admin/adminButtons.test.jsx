// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../../context/AuthContext";
import Customers from "../../components/admin/customers/Customers";
import BookingList from "./bookings/BookingList";
import DestinationsList from "./destinations/DestinationsList";
import GuidesList from "./guides/GuidesList";
import TourListPage from "./tours/TourListPage";
import PageListUser from "./users/PageListUser";

vi.mock("../../services/adminTourService", () => ({
  listAdminTours: vi.fn().mockResolvedValue({
    tours: [
      {
        id: 4,
        title: "Kyoto Discovery",
        slug: "kyoto-discovery",
        status: "published",
        basePrice: 1200,
        priceOverride: null,
        durationDays: 3,
        durationNights: 2,
        primaryImage: "",
      },
    ],
    meta: null,
    links: null,
  }),
  deleteTour: vi.fn().mockResolvedValue({}),
  restoreTour: vi.fn().mockResolvedValue({}),
  createTour: vi.fn().mockResolvedValue({}),
  updateTour: vi.fn().mockResolvedValue({}),
  getAdminTour: vi.fn().mockResolvedValue(null),
  buildTourPayload: vi.fn(() => ({})),
  toTourForm: vi.fn(() => ({})),
  TOUR_STATUS_CASING: "lower",
}));

const SESSION_KEY = "traveladmin.session";

const USERS = {
  admin: {
    roles: [
      { id: 2, name: "admin", type: "admin" },
      { id: 5, name: "customer", type: "user" },
    ],
  },
  tour_manager: {
    roles: [{ id: 3, name: "tour_manager", type: "admin" }],
  },
  tour_guide: {
    roles: [{ id: 4, name: "tour_guide", type: "admin" }],
  },
  customer: {
    roles: [{ id: 5, name: "customer", type: "user" }],
  },
};

function renderAs(role, element) {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ token: "test-token", user: USERS[role] }),
  );

  return render(
    <MemoryRouter>
      <AuthProvider>{element}</AuthProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("admin action buttons", () => {
  it("shows add and delete to an admin on the tours list", async () => {
    renderAs("admin", <TourListPage />);

    expect(screen.getByText("Add tour")).toBeDefined();
    expect(await screen.findByRole("link", { name: "Edit" })).toBeDefined();
    expect(screen.getByRole("button", { name: "Delete" })).toBeDefined();
  });

  it("hides delete from a tour manager but keeps add and edit", async () => {
    renderAs("tour_manager", <TourListPage />);

    expect(screen.getByText("Add tour")).toBeDefined();
    expect(await screen.findByRole("link", { name: "Edit" })).toBeDefined();
    expect(screen.queryByRole("button", { name: "Delete" })).toBeNull();
  });

  it("shows a read-only view to a tour guide on the tours list", async () => {
    renderAs("tour_guide", <TourListPage />);

    expect(screen.queryByText("Add tour")).toBeNull();
    expect(await screen.findByRole("link", { name: "View" })).toBeDefined();
    expect(screen.queryByRole("link", { name: "Edit" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Delete" })).toBeNull();
  });

  it("gates Add Destination by store_locations", () => {
    renderAs("tour_manager", <DestinationsList />);
    expect(screen.getByText(/Add Destination/)).toBeDefined();
    cleanup();
    localStorage.clear();

    renderAs("tour_guide", <DestinationsList />);
    expect(screen.queryByText(/Add Destination/)).toBeNull();
  });

  it("gates New Booking by store_bookings", () => {
    renderAs("admin", <BookingList />);
    expect(screen.getByText("New Booking")).toBeDefined();
    expect(screen.getAllByText("Export").length).toBeGreaterThan(0);
    cleanup();
    localStorage.clear();

    renderAs("tour_manager", <BookingList />);
    expect(screen.queryByText("New Booking")).toBeNull();
    expect(screen.getAllByText("Export").length).toBeGreaterThan(0);
  });

  it("hides admin-only user actions from non-admins", () => {
    renderAs("admin", <PageListUser />);
    expect(screen.getByText("Add User")).toBeDefined();
    expect(screen.queryAllByTitle("Delete user").length).toBeGreaterThan(0);
    cleanup();
    localStorage.clear();

    renderAs("tour_manager", <PageListUser />);
    expect(screen.queryByText("Add User")).toBeNull();
    expect(screen.queryAllByTitle("Delete user")).toHaveLength(0);
  });

  it("hides admin-only customer actions from non-admins", () => {
    renderAs("admin", <Customers />);
    expect(screen.getByText("Add Customer")).toBeDefined();
    expect(screen.getByText("Export CSV")).toBeDefined();
    cleanup();
    localStorage.clear();

    renderAs("tour_manager", <Customers />);
    expect(screen.queryByText("Add Customer")).toBeNull();
    expect(screen.queryByText("Export CSV")).toBeNull();
  });

  it("hides guide management actions from non-admins", () => {
    renderAs("admin", <GuidesList />);
    expect(screen.getAllByText("Add").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Remove").length).toBeGreaterThan(0);
    cleanup();
    localStorage.clear();

    renderAs("tour_manager", <GuidesList />);
    expect(screen.queryByText("Add")).toBeNull();
    expect(screen.queryByText("Remove")).toBeNull();
  });
});
