// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AuthProvider } from "../../context/AuthContext";
import { ROLES } from "../../services/roleAdapter";
import RequireAuth from "./RequireAuth";
import RequireRole from "./RequireRole";

const SESSION_KEY = "traveladmin.session";
const ADMIN_ROLES = [ROLES.ADMIN, ROLES.TOUR_MANAGER, ROLES.TOUR_GUIDE];

const CUSTOMER_USER = {
  id: 7,
  name: "Customer",
  email: "customer@example.com",
  roles: [{ id: 5, name: "customer", type: "user" }],
};

const ADMIN_USER = {
  ...CUSTOMER_USER,
  id: 2,
  roles: [
    { id: 2, name: "admin", type: "admin" },
    { id: 5, name: "customer", type: "user" },
  ],
};

function seedSession(user) {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ token: "test-token", user }),
  );
}

function LoginPageStub() {
  const location = useLocation();
  return (
    <div>
      <span>login-page</span>
      <span>
        {location.state?.from ? `from:${location.state.from}` : "from:none"}
      </span>
    </div>
  );
}

function renderGuarded(initialEntry) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AuthProvider>
        <Routes>
          <Route element={<RequireAuth />}>
            <Route element={<RequireRole roles={ADMIN_ROLES} />}>
              <Route path="/dashboard" element={<div>dashboard-content</div>} />
            </Route>
            <Route element={<RequireRole roles={[ROLES.CUSTOMER]} />}>
              <Route path="/profile" element={<div>profile-content</div>} />
            </Route>
          </Route>
          <Route path="/login" element={<LoginPageStub />} />
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

describe("route guards", () => {
  it("redirects a guest to login and remembers the target page", () => {
    renderGuarded("/dashboard");

    expect(screen.queryByText("dashboard-content")).toBeNull();
    expect(screen.getByText("login-page")).toBeDefined();
    expect(screen.getByText("from:/dashboard")).toBeDefined();
  });

  it("blocks a customer-only user from an admin route with a 403 page", async () => {
    seedSession(CUSTOMER_USER);

    renderGuarded("/dashboard");

    expect(await screen.findByText("Access denied")).toBeDefined();
    expect(screen.queryByText("dashboard-content")).toBeNull();
    expect(screen.queryByText("login-page")).toBeNull();
  });

  it("allows an admin+customer user on an admin route", async () => {
    seedSession(ADMIN_USER);

    renderGuarded("/dashboard");

    expect(await screen.findByText("dashboard-content")).toBeDefined();
  });

  it("allows an admin+customer user on a customer-only route", async () => {
    seedSession(ADMIN_USER);

    renderGuarded("/profile");

    expect(await screen.findByText("profile-content")).toBeDefined();
  });

  it("allows a tour_manager on an admin route", async () => {
    seedSession({
      ...CUSTOMER_USER,
      roles: [{ id: 3, name: "tour_manager", type: "admin" }],
    });

    renderGuarded("/dashboard");

    expect(await screen.findByText("dashboard-content")).toBeDefined();
  });

  it("allows a tour_guide on an admin route", async () => {
    seedSession({
      ...CUSTOMER_USER,
      roles: [{ id: 4, name: "tour_guide", type: "admin" }],
    });

    renderGuarded("/dashboard");

    expect(await screen.findByText("dashboard-content")).toBeDefined();
  });
});
