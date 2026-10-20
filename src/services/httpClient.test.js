import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, http } from "./httpClient";
import { getSession, logout } from "./authService";

vi.mock("./authService", () => ({
  getSession: vi.fn(),
  logout: vi.fn(),
}));

const BASE_URL = "http://api.test";

function jsonResponse(body, { status = 200 } = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function lastFetchCall() {
  const calls = fetchMock.mock.calls;
  return calls[calls.length - 1];
}

function stubWindow(pathname = "/dashboard") {
  const assign = vi.fn();
  globalThis.window = { location: { pathname, assign } };
  return assign;
}

let fetchMock;

beforeEach(() => {
  vi.stubEnv("VITE_API_BASE_URL", BASE_URL);
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  getSession.mockReset();
  logout.mockReset();
  getSession.mockReturnValue(null);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  delete globalThis.window;
});

describe("header injection", () => {
  it("sends Accept and Content-Type application/json by default", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));

    await http.get("/tours");

    const [url, init] = lastFetchCall();
    expect(url).toBe(`${BASE_URL}/tours`);
    expect(init.method).toBe("GET");
    expect(init.headers.Accept).toBe("application/json");
    expect(init.headers["Content-Type"]).toBe("application/json");
  });

  it("injects Authorization Bearer token when a session exists", async () => {
    getSession.mockReturnValue({ token: "test-token" });
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));

    await http.get("/me");

    const [, init] = lastFetchCall();
    expect(init.headers.Authorization).toBe("Bearer test-token");
  });

  it("omits Authorization when no session exists", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));

    await http.get("/reference/destinations");

    const [, init] = lastFetchCall();
    expect(init.headers.Authorization).toBeUndefined();
  });
});

describe("response unwrapping", () => {
  it("unwraps { success, message, data } responses to data", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse({ success: true, message: "OK", data: { id: 7 } }),
    );

    await expect(http.get("/tours/7")).resolves.toEqual({ id: 7 });
  });

  it("passes raw responses through unchanged (login / reference data)", async () => {
    const rawBody = { token: "abc", user: { email: "a@b.c" } };
    fetchMock.mockResolvedValue(jsonResponse(rawBody));

    await expect(http.post("/auth/login", { email: "a@b.c" })).resolves.toEqual(
      rawBody,
    );
  });

  it("returns null for 204 No Content", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await expect(http.delete("/bookings/1")).resolves.toBeNull();
  });
});

describe("error normalization", () => {
  it("normalizes validation errors into { status, message, errors }", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(
        {
          message: "The given data was invalid.",
          errors: { email: ["Email is required."] },
        },
        { status: 422 },
      ),
    );

    const error = await http.post("/register", { email: "" }).catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(422);
    expect(error.message).toBe("The given data was invalid.");
    expect(error.errors).toEqual({ email: ["Email is required."] });
  });

  it("falls back to a generic message when the body has none", async () => {
    fetchMock.mockResolvedValue(new Response("boom", { status: 500 }));

    const error = await http.get("/tours").catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(500);
    expect(error.message).toBe("Something went wrong. Please try again.");
    expect(error.errors).toBeNull();
  });

  it("normalizes network failures to status 0", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    const error = await http.get("/tours").catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(0);
  });

  it("throws a configuration error when the base URL is missing", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "");

    const error = await http.get("/tours").catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("401 handling", () => {
  it("clears the session and redirects to /login, then throws", async () => {
    const assign = stubWindow("/dashboard");
    fetchMock.mockResolvedValue(
      jsonResponse({ message: "Unauthenticated." }, { status: 401 }),
    );

    const error = await http.get("/dashboard/stats").catch((e) => e);

    expect(logout).toHaveBeenCalledTimes(1);
    expect(assign).toHaveBeenCalledWith("/login");
    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(401);
    expect(error.message).toBe("Unauthenticated.");
  });

  it("does not redirect when already on the login page", async () => {
    const assign = stubWindow("/login");
    fetchMock.mockResolvedValue(
      jsonResponse({ message: "Invalid credentials." }, { status: 401 }),
    );

    const error = await http.post("/auth/login", {}).catch((e) => e);

    expect(logout).toHaveBeenCalledTimes(1);
    expect(assign).not.toHaveBeenCalled();
    expect(error.status).toBe(401);
    expect(error.message).toBe("Invalid credentials.");
  });
});

describe("FormData handling", () => {
  it("sends FormData without a Content-Type header so the browser sets the boundary", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: true, data: null }));
    const formData = new FormData();
    formData.append("image", new Blob(["x"]), "photo.png");

    await http.upload("/tours/1/images", formData);

    const [url, init] = lastFetchCall();
    expect(url).toBe(`${BASE_URL}/tours/1/images`);
    expect(init.method).toBe("POST");
    expect(init.body).toBe(formData);
    expect(init.headers["Content-Type"]).toBeUndefined();
    expect(init.headers.Accept).toBe("application/json");
  });

  it("defaults upload to POST but allows overriding the method", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: true, data: null }));
    const formData = new FormData();

    await http.upload("/tours/1/images", formData, { method: "PUT" });

    const [, init] = lastFetchCall();
    expect(init.method).toBe("PUT");
  });

  it("still JSON-encodes plain object bodies", async () => {
    fetchMock.mockResolvedValue(jsonResponse({ success: true, data: { id: 1 } }));

    await http.post("/tours", { name: "Angkor" });

    const [, init] = lastFetchCall();
    expect(init.body).toBe(JSON.stringify({ name: "Angkor" }));
    expect(init.headers["Content-Type"]).toBe("application/json");
  });
});
