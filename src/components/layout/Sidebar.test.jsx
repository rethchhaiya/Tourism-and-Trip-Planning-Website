// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AuthProvider } from "../../context/AuthContext";
import Sidebar from "./Sidebar";

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

function renderSidebar(user) {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ token: "test-token", user }),
  );

  return render(
    <MemoryRouter initialEntries={["/settings"]}>
      <AuthProvider>
        <Routes>
          <Route element={<Sidebar />}>
            <Route path="*" element={<div>page-content</div>} />
          </Route>
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

const visibleItems = () =>
  ["DashBoard", "Destinations", "Guides", "Tours", "Bookings", "Customers", "Settings"]
    .filter((label) => screen.queryByText(label) !== null);

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("Sidebar menu visibility", () => {
  it("shows every routed item to an admin", () => {
    renderSidebar(USERS.admin);

    expect(visibleItems()).toEqual([
      "DashBoard",
      "Destinations",
      "Guides",
      "Tours",
      "Bookings",
      "Customers",
      "Settings",
    ]);
  });

  it("hides admin-only items from a tour manager", () => {
    renderSidebar(USERS.tour_manager);

    expect(visibleItems()).toEqual([
      "Destinations",
      "Tours",
      "Bookings",
      "Settings",
    ]);
  });

  it("hides admin-only items from a tour guide", () => {
    renderSidebar(USERS.tour_guide);

    expect(visibleItems()).toEqual([
      "Destinations",
      "Tours",
      "Bookings",
      "Settings",
    ]);
  });

  it("shows the customer-permitted catalog and booking items", () => {
    renderSidebar(USERS.customer);

    expect(visibleItems()).toEqual([
      "Destinations",
      "Guides",
      "Tours",
      "Bookings",
      "Settings",
    ]);
  });
});
