// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { AuthProvider } from "../../context/AuthContext";
import { useAuth } from "../../context/useAuth";
import { ROLES } from "../../services/roleAdapter";
import RequireAuth from "./RequireAuth";
import RequireRole from "./RequireRole";

const SESSION_KEY = "traveladmin.session";
const ADMIN_ROLES = [ROLES.ADMIN, ROLES.TOUR_MANAGER, ROLES.TOUR_GUIDE];

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

function renderWithGuard(initialEntry, guard) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <AuthProvider>
        <Routes>
          <Route element={guard}>
            <Route path="/dashboard" element={<div>dashboard-content</div>} />
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
});

describe("RequireAuth", () => {
  it("redirects guests to login and remembers the target page", () => {
    renderWithGuard("/dashboard", <RequireAuth />);

    expect(screen.queryByText("dashboard-content")).toBeNull();
    expect(screen.getByText(/login-page/)).toBeDefined();
    expect(screen.getByText("from:/dashboard")).toBeDefined();
  });

  it("renders the guarded route for authenticated users", async () => {
    seedSession({ email: "admin@traveladmin.com", role: "admin" });

    renderWithGuard("/dashboard", <RequireAuth />);

    expect(await screen.findByText("dashboard-content")).toBeDefined();
  });
});

describe("RequireRole", () => {
  it("blocks a customer from an admin route with a 403 page", async () => {
    seedSession({ email: "customer@example.com", role: "customer" });

    renderWithGuard("/dashboard", <RequireRole roles={ADMIN_ROLES} />);

    expect(await screen.findByText("Access denied")).toBeDefined();
    expect(screen.queryByText("dashboard-content")).toBeNull();
    expect(screen.queryByText(/login-page/)).toBeNull();
  });

  it("allows an admin onto an admin route", async () => {
    seedSession({ email: "admin@traveladmin.com", role: "admin" });

    renderWithGuard("/dashboard", <RequireRole roles={ADMIN_ROLES} />);

    expect(await screen.findByText("dashboard-content")).toBeDefined();
  });
});

describe("logout", () => {
  function LogoutHarness() {
    const { user, logout } = useAuth();
    return (
      <div>
        <span>{user ? `user:${user.email}` : "user:none"}</span>
        <button type="button" onClick={logout}>
          sign-out
        </button>
      </div>
    );
  }

  it("clears the stored session and the auth state", async () => {
    seedSession({ email: "admin@traveladmin.com", role: "admin" });

    render(
      <MemoryRouter>
        <AuthProvider>
          <LogoutHarness />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("user:admin@traveladmin.com")).toBeDefined();
    expect(localStorage.getItem(SESSION_KEY)).not.toBeNull();

    fireEvent.click(screen.getByText("sign-out"));

    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
    expect(screen.getByText("user:none")).toBeDefined();
  });
});
