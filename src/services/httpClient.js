import { getSession, logout } from "./authService";

const LOGIN_PATH = "/login";
const NETWORK_ERROR_MESSAGE =
  "Unable to reach the server. Please check your connection and try again.";
const GENERIC_ERROR_MESSAGE = "Something went wrong. Please try again.";

function getBaseUrl() {
  return (import.meta.env.VITE_API_BASE_URL ?? "").replace(/\/+$/, "");
}

export class ApiError extends Error {
  constructor(message, { status = 0, errors = null } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

function extractErrors(body) {
  if (body?.errors && typeof body.errors === "object") {
    return body.errors;
  }
  if (body?.error && typeof body.error === "object") {
    return body.error;
  }
  return null;
}

function extractMessage(body) {
  if (typeof body?.message === "string" && body.message) {
    return body.message;
  }
  if (typeof body?.error === "string" && body.error) {
    return body.error;
  }
  return null;
}

function normalizeError(status, body) {
  const error = new ApiError(extractMessage(body) ?? GENERIC_ERROR_MESSAGE, {
    status,
    errors: extractErrors(body),
  });
  if (body && typeof body === "object") {
    error.body = body;
  }
  return error;
}

function unwrap(body) {
  if (
    body &&
    typeof body === "object" &&
    !Array.isArray(body) &&
    "data" in body
  ) {
    // Paginated envelopes carry the page items plus meta/links. Keep the
    // envelope intact so callers can read pagination; only unwrap the plain
    // { success, data } shape used by auth and categories.
    if (body.meta != null || body.links != null) {
      return body;
    }
    if ("success" in body) {
      return body.data ?? null;
    }
  }
  return body;
}

function handleUnauthorized() {
  logout({ callServer: false });
  if (
    typeof window !== "undefined" &&
    window.location &&
    window.location.pathname !== LOGIN_PATH
  ) {
    window.location.assign(LOGIN_PATH);
  }
}

function buildHeaders(customHeaders, hasFormData) {
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...customHeaders,
  };
  if (hasFormData) {
    delete headers["Content-Type"];
  }
  const token = getSession()?.token;
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function request(
  path,
  {
    method = "GET",
    body,
    headers: customHeaders,
    noAuthRedirect = false,
    unwrap: shouldUnwrap = true,
    ...fetchOptions
  } = {},
) {
  const baseUrl = getBaseUrl();
  if (!baseUrl) {
    throw new ApiError(
      "API base URL is not configured. Set VITE_API_BASE_URL in .env",
      { status: 0 },
    );
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const hasFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const init = {
    method,
    headers: buildHeaders(customHeaders, hasFormData),
    ...fetchOptions,
  };

  if (hasFormData) {
    init.body = body;
  } else if (body !== undefined && body !== null) {
    init.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(`${baseUrl}${normalizedPath}`, init);
  } catch {
    throw new ApiError(NETWORK_ERROR_MESSAGE, { status: 0 });
  }

  if (response.status === 401 && !noAuthRedirect) {
    handleUnauthorized();
  }

  if (response.status === 204) {
    return null;
  }

  const data = await response.json().catch(() => null);

  if (!response.ok || data?.success === false) {
    throw normalizeError(response.status, data);
  }

  return shouldUnwrap ? unwrap(data) : data;
}

export const http = {
  get: (path, options) => request(path, { ...options, method: "GET" }),
  post: (path, body, options) =>
    request(path, { ...options, method: "POST", body }),
  put: (path, body, options) =>
    request(path, { ...options, method: "PUT", body }),
  patch: (path, body, options) =>
    request(path, { ...options, method: "PATCH", body }),
  delete: (path, options) => request(path, { ...options, method: "DELETE" }),
  upload: (path, formData, { method = "POST", ...options } = {}) =>
    request(path, { ...options, method, body: formData }),
};
