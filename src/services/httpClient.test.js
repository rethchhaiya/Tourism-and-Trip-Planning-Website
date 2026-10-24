import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { http } from "./httpClient";

const BASE_URL = "http://test.local/api";
const SESSION_KEY = "traveladmin.session";

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  vi.stubEnv("VITE_API_BASE_URL", BASE_URL);
  vi.stubGlobal("fetch", vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  localStorage.clear();
});

describe(" httpClient header handling", () => {
  it("injects Accept/Content-Type and the stored Bearer token", async () => {
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ token: "tok-1", user: null }),
    );
    fetch.mockResolvedValue(jsonResponse(200, { success: true, data: { ok: 1 } }));

    const data = await http.get("/jobs");

    expect(data).toEqual({ ok: 1 });
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe(`${BASE_URL}/jobs`);
    expect(init.method).toBe("GET");
    expect(init.headers.Accept).toBe("application/json");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(init.headers.Authorization).toBe("Bearer tok-1");
  });

  it("omits Authorization when no session exists", async () => {
    fetch.mockResolvedValue(jsonResponse(200, { success: true, data: {} }));
    await http.get("/jobs");
    const init = fetch.mock.calls[0][1];
    expect(init.headers.Authorization).toBeUndefined();
  });

  it("drops Content-Type when the body is FormData", async () => {
    fetch.mockResolvedValue(jsonResponse(200, { success: true, data: { id: 7 } }));
    const formData = new FormData();
    formData.append("file", new Blob(["x"], { type: "text/plain" }), "f.txt");

    await http.upload("/tours/1/photos", formData);

    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe(`${BASE_URL}/tours/1/photos`);
    expect(init.body).toBe(formData);
    expect(init.headers["Content-Type"]).toBeUndefined();
  });
});

describe("httpClient error normalization", () => {
  it("maps server payloads into { status, message, errors }", async () => {
    fetch.mockResolvedValue(
      jsonResponse(422, {
        message: "Validation failed.",
        errors: { email: ["Not valid."] },
      }),
    );

    await expect(http.post("/things", { a: 1 })).rejects.toMatchObject({
      name: "ApiError",
      status: 422,
      message: "Validation failed.",
      errors: { email: ["Not valid."] },
    });
  });

  it("treats success:false bodies as errors even with HTTP 200", async () => {
    fetch.mockResolvedValue(
      jsonResponse(200, { success: false, message: "Invalid or expired OTP." }),
    );

    await expect(http.post("/x", {})).rejects.toMatchObject({
      status: 200,
      message: "Invalid or expired OTP.",
    });
  });

  it("falls back to the generic message for opaque errors", async () => {
    fetch.mockResolvedValue(new Response("oops", { status: 500 }));

    await expect(http.get("/x")).rejects.toMatchObject({
      status: 500,
      message: "Something went wrong. Please try again.",
    });
  });
});

describe("httpClient 401 handling", () => {
  it("clears the stored session when the API answers 401", async () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ token: "tok", user: null }));
    fetch.mockResolvedValue(jsonResponse(401, { message: "Unauthenticated." }));

    await expect(http.get("/me")).rejects.toMatchObject({ status: 401 });
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it("does not clear anything nor redirect when noAuthRedirect is set", async () => {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ token: "tok", user: null }));
    fetch.mockResolvedValue(jsonResponse(401, { message: "Unauthenticated." }));

    await expect(
      http.post("/auth/reset-password-with-otp", {}, { noAuthRedirect: true }),
    ).rejects.toMatchObject({ status: 401 });
    expect(localStorage.getItem(SESSION_KEY)).not.toBeNull();
  });
});
