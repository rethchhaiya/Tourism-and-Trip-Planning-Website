import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";

const SESSION_KEY = "traveladmin.session";

function Home() {
  return <p data-testid="home-page">home</p>;
}

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, "", "/");
});

afterEach(() => {
  localStorage.clear();
});

describe("Google callback hand-off (homepage + ?token=)", () => {
  it("stores the token in the session and scrubs it from the URL", async () => {
    window.history.replaceState(
      null,
      "",
      "/?token=tok-google-1&email=x%40example.com",
    );

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/?token=tok-google-1&email=x%40example.com"]}>
          <Routes>
            <Route path="/" element={<Home />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    );

    await waitFor(() => {
      const session = JSON.parse(localStorage.getItem(SESSION_KEY));
      expect(session.token).toBe("tok-google-1");
      expect(session.user.email).toBe("x@example.com");
    });

    await waitFor(() => {
      expect(window.location.search).toBe("");
    });
  });

  it("does nothing on a normal visit without token parameters", async () => {
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route path="/" element={<Home />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("home-page")).toBeTruthy());
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });
});
