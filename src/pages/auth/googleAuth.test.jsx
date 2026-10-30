import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import LoginPage from "../../pages/auth/LoginPage";
import { AuthProvider } from "../../context/AuthContext";

const BASE_URL = "http://test.local/api";

function renderLogin() {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<p data-testid="other">other</p>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllEnvs();
  localStorage.clear();
});

describe("Continue with Google (login page)", () => {
  it("full-page navigates to the backend redirect endpoint", () => {
    vi.stubEnv("VITE_API_BASE_URL", BASE_URL);
    renderLogin();

    const link = screen.getByText("Continue with Google").closest("a");
    expect(link.getAttribute("href")).toBe(
      `${BASE_URL}/auth/google/redirect`,
    );
  });

  it("only appears when the API base URL is configured", () => {
    vi.stubEnv("VITE_API_BASE_URL", "");
    renderLogin();

    expect(screen.queryByText("Continue with Google")).toBeNull();
  });
});
