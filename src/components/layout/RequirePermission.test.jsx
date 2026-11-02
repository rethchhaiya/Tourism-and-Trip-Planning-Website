// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AuthProvider } from "../../context/AuthContext";
import { PERMISSIONS } from "../../constants/permissions";
import { ROUTE_ACCESS } from "../../routes/routeAccess";
import RequirePermission from "./RequirePermission";

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
  ["/customers", ["admin"]],
  ["/customer", ["admin"]],
  ["/createcustomer", ["admin"]],
  ["/users", ["admin"]],
  ["/create-user", ["admin"]],
  ["/settings", ["admin", "tour_manager", "tour_guide", "customer"]],
];

function seedSession(user) {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ token: "test-token", user }),
  );
}

function renderAccess(path, props = ROUTE_ACCESS[path]) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <Routes>
          <Route element={<RequirePermission {...props} />}>
            <Route path={path} element={<div>protected-content</div>} />
          </Route>
          <Route path="/login" element={<div>login-page</div>} />
        </Routes>
      </AuthProvider>
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

describe("RequirePermission", () => {
  it("redirects a guest to login", () => {
    renderAccess("/dashboard");

    expect(screen.getByText("login-page")).toBeDefined();
    expect(screen.queryByText("protected-content")).toBeNull();
  });

  for (const [path, allowedRoles] of ROUTE_MATRIX) {
    for (const role of Object.keys(USERS)) {
      const allowed = allowedRoles.includes(role);

      it(`${role} ${allowed ? "can" : "cannot"} open ${path}`, async () => {
        seedSession(USERS[role]);

        renderAccess(path);

        if (allowed) {
          expect(await screen.findByText("protected-content")).toBeDefined();
        } else {
          expect(await screen.findByText("Access denied")).toBeDefined();
          expect(screen.queryByText("protected-content")).toBeNull();
        }
      });
    }
  }

  it("accepts a single permission", async () => {
    seedSession(USERS.tour_guide);

    renderAccess("/x", { permission: PERMISSIONS.VIEW_BOOKINGS });

    expect(await screen.findByText("protected-content")).toBeDefined();
    cleanup();
    localStorage.clear();

    seedSession(USERS.tour_guide);
    renderAccess("/x", { permission: PERMISSIONS.VIEW_CATEGORIES });

    expect(await screen.findByText("Access denied")).toBeDefined();
  });

  it("accepts a permission list", async () => {
    seedSession(USERS.tour_guide);

    renderAccess("/x", {
      permissions: [
        PERMISSIONS.VIEW_CATEGORIES,
        PERMISSIONS.VIEW_BOOKINGS,
      ],
    });

    expect(await screen.findByText("protected-content")).toBeDefined();
  });

  it("accepts admin-only", async () => {
    seedSession(USERS.tour_manager);

    renderAccess("/guides", { adminOnly: true });

    expect(await screen.findByText("Access denied")).toBeDefined();
  });

  it("treats the admin permission sentinel as admin-only", async () => {
    seedSession(USERS.tour_manager);

    renderAccess("/guides", { permission: "admin" });

    expect(await screen.findByText("Access denied")).toBeDefined();
  });
});
