// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AuthProvider } from "../../context/AuthContext";
import Customers from "../../components/admin/customers/Customers";
import BookingList from "./bookings/BookingList";
import DestinationsList from "./destinations/DestinationsList";
import GuidesList from "./guides/GuidesList";
import TourListPage from "./tours/TourListPage";
import PageListUser from "./users/PageListUser";

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

  return render(<AuthProvider>{element}</AuthProvider>);
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("admin action buttons", () => {
  it("shows add and delete to an admin on the tours list", () => {
    renderAs("admin", <TourListPage />);

    expect(screen.getByText("Add Tour")).toBeDefined();
    expect(screen.getAllByTitle("Delete").length).toBeGreaterThan(0);
    expect(screen.getAllByTitle("Edit").length).toBeGreaterThan(0);
  });

  it("hides delete from a tour manager but keeps add and edit", () => {
    renderAs("tour_manager", <TourListPage />);

    expect(screen.getByText("Add Tour")).toBeDefined();
    expect(screen.getAllByTitle("Edit").length).toBeGreaterThan(0);
    expect(screen.queryAllByTitle("Delete")).toHaveLength(0);
  });

  it("hides add, edit and delete from a tour guide on the tours list", () => {
    renderAs("tour_guide", <TourListPage />);

    expect(screen.queryByText("Add Tour")).toBeNull();
    expect(screen.queryAllByTitle("Edit")).toHaveLength(0);
    expect(screen.queryAllByTitle("Delete")).toHaveLength(0);
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
