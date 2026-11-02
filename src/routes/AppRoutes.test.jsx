// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../context/AuthContext";
import AppRoutes from "./AppRoutes";

vi.mock("../services/adminCategoryService", () => ({
  listCategories: vi.fn().mockResolvedValue([]),
  getCategory: vi.fn().mockResolvedValue(null),
  createCategory: vi.fn().mockResolvedValue({}),
  updateCategory: vi.fn().mockResolvedValue({}),
  deleteCategory: vi.fn().mockResolvedValue({}),
}));

vi.mock("../services/adminTourService", () => ({
  listAdminTours: vi.fn().mockResolvedValue({
    tours: [],
    meta: null,
    links: null,
  }),
  getAdminTour: vi.fn().mockResolvedValue(null),
  createTour: vi.fn().mockResolvedValue({}),
  updateTour: vi.fn().mockResolvedValue({}),
  deleteTour: vi.fn().mockResolvedValue({}),
  restoreTour: vi.fn().mockResolvedValue({}),
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

const ROUTE_MATRIX = [
  ["/dashboard", ["admin", "tour_manager", "tour_guide", "customer"]],
  ["/sidebar", ["admin", "tour_manager", "tour_guide", "customer"]],
  ["/overview", ["admin"]],
  ["/bookings", ["admin", "tour_manager", "tour_guide", "customer"]],
  ["/listbooking", ["admin", "tour_manager", "tour_guide", "customer"]],
  ["/table_destinations", ["admin", "tour_manager", "tour_guide", "customer"]],
  ["/guides", ["admin", "customer"]],
  ["/admin/tours", ["admin", "tour_manager", "tour_guide"]],
  ["/admin/tours/new", ["admin", "tour_manager"]],
  ["/admin/tours/5/edit", ["admin", "tour_manager", "tour_guide"]],
  ["/admin/categories", ["admin", "tour_manager"]],
  ["/customers", ["admin"]],
  ["/customer", ["admin"]],
  ["/createcustomer", ["admin"]],
  ["/users", ["admin"]],
  ["/create-user", ["admin"]],
  ["/settings", ["admin", "tour_manager", "tour_guide", "customer"]],
];

function renderApp(path, user) {
  if (user) {
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ token: "test-token", user }),
    );
  }

  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
  window.scrollTo = () => {};
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("AppRoutes permission wiring", () => {
  for (const [path, allowedRoles] of ROUTE_MATRIX) {
    for (const role of Object.keys(USERS)) {
      const allowed = allowedRoles.includes(role);

      it(`${role} ${allowed ? "can" : "cannot"} open ${path}`, async () => {
        renderApp(path, USERS[role]);

        if (allowed) {
          expect(await screen.findByText("TravelAdmin")).toBeDefined();
          expect(screen.queryByText("Access denied")).toBeNull();
        } else {
          expect(await screen.findByText("Access denied")).toBeDefined();
          expect(screen.queryByText("TravelAdmin")).toBeNull();
        }
      });
    }
  }

  it("redirects a guest to login", async () => {
    renderApp("/dashboard");

    expect(await screen.findByText("Admin Login")).toBeDefined();
    expect(screen.queryByText("Access denied")).toBeNull();
  });

  it("redirects a guest away from the admin tours screen", async () => {
    renderApp("/admin/tours");

    expect(await screen.findByText("Admin Login")).toBeDefined();
    expect(screen.queryByText("Access denied")).toBeNull();
  });
});
