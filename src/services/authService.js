import { http } from "./httpClient";

const SESSION_STORAGE_KEY = "traveladmin.session";
const REMEMBERED_EMAIL_KEY = "traveladmin.rememberedEmail";
const PENDING_OTP_EMAIL_KEY = "traveladmin.pendingOtpEmail";

export const OTP_VERIFICATION_PATH = "/verify-otp";
export const FORGOT_PASSWORD_PATH = "/forgot-password";
export const RESET_PASSWORD_PATH = "/reset-password";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function readSessionValue(key) {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeSessionValue(key, value) {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // Storage may be unavailable (private mode); the flow still works in-memory.
  }
}

function removeSessionValue(key) {
  try {
    sessionStorage.removeItem(key);
  } catch {
    // Ignore storage failures.
  }
}


function getApiBaseUrl() {
  return (
    import.meta.env.VITE_API_BASE_URL ??
    import.meta.env.base_url ??
    ""
  ).replace(/\/+$/, "");
}

async function requestLogin(credentials) {
  const data = await http.post("/auth/login", credentials);
  const token = data?.access_token ?? data?.token ?? data?.accessToken;
  if (!token) {
    throw new Error("Login response did not include an access token.");
  }
  return { token, user: data?.user ?? null };
}

async function mockLogin({ email, password }) {
  await sleep(900);
  if (email.toLowerCase() !== "admin@traveladmin.com" || password !== "admin123") {
    throw new Error("Invalid email or password.");
  }
  return {
    token: "mock-session-token",
    user: { email: "admin@traveladmin.com", name: "Administrator", role: "admin" },
  };
}

export function persistSession(session) {
  localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

export async function login(credentials) {
  const session = getApiBaseUrl()
    ? await requestLogin(credentials)
    : await mockLogin(credentials);
  persistSession(session);
  return session;
}

export async function register(values) {
  const payload = {
    name: values.name.trim(),
    email: values.email.trim(),
    password_hash: values.password,
    password_hash_confirmation: values.password_confirmation,
  };

  const channel = values.channel?.trim();
  if (channel) {
    payload.channel = channel;
  }

  const phone = values.phone?.trim();
  if (phone) {
    payload.phone = phone;
  }

  return http.post("/auth/register", payload);
}

export async function verifyOtp({ email, otp }) {
  return http.post("/auth/verify-otp", {
    email: email.trim(),
    otp: otp.trim(),
  });
}

export async function resendOtp({ email }) {
  return http.post("/auth/resend-otp", { email: email.trim() });
}

export async function forgotPassword({ email, channel }) {
  return http.post("/auth/forgot-password", {
    email: email.trim(),
    channel,
  });
}

export async function resetPassword({
  oldPassword = "",
  newPassword,
  newPasswordConfirmation,
  email = "",
  otp = "",
}) {
  if (email) {
    // Forgot-password flow: identity was proven by the OTP, so the request
    // goes unauthenticated to the dedicated OTP endpoint and needs no old
    // password. A failing reset must not kick the user out mid-flow.
    return http.post(
      "/auth/reset-password-with-otp",
      {
        email: email.trim(),
        otp,
        new_password: newPassword,
        new_password_confirmation: newPasswordConfirmation,
      },
      { noAuthRedirect: true },
    );
  }

  const session = getSession();

  if (!session?.token) {
    throw new Error("You need to sign in before you can change your password.");
  }

  return http.post("/auth/reset-password", {
    old_password: oldPassword,
    new_password: newPassword,
    new_password_confirmation: newPasswordConfirmation,
  });
}

export function setPendingOtpEmail(email) {
  writeSessionValue(PENDING_OTP_EMAIL_KEY, email);
}

export function getPendingOtpEmail() {
  return readSessionValue(PENDING_OTP_EMAIL_KEY) ?? "";
}

export function clearPendingOtpEmail() {
  removeSessionValue(PENDING_OTP_EMAIL_KEY);
}

export function getSession() {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getGoogleRedirectUrl() {
  const base = getApiBaseUrl();
  return base ? `${base}/auth/google/redirect` : "";
}

export function absorbGoogleTokenFromUrl() {
  if (typeof window === "undefined" || !window.location) {
    return null;
  }

  const params = new URLSearchParams(window.location.search);
  const token =
    params.get("token") ?? params.get("access_token") ?? params.get("google_token");

  if (!token) {
    return null;
  }

  const email = params.get("email");
  persistSession({
    token,
    user: email
      ? { email, name: email.split("@")[0] ?? "Google user", role: "customer" }
      : null,
  });

  for (const key of ["token", "access_token", "google_token", "email"]) {
    params.delete(key);
  }
  const rest = params.toString();
  window.history.replaceState(
    window.history.state,
    "",
    `${window.location.pathname}${rest ? `?${rest}` : ""}${window.location.hash}`,
  );

  return { token };
}


export async function logout({ callServer = true } = {}) {
  const session = getSession();

  localStorage.removeItem(SESSION_STORAGE_KEY);

  if (!callServer || !getApiBaseUrl() || !session?.token) {
    return;
  }

  try {
    await http.post("/auth/logout", null, {
      headers: { Authorization: `Bearer ${session.token}` },
    });
  } catch {
    // The local session is already cleared; a failed server logout must not
    // block the user from leaving the app.
  }
}

export function getRememberedEmail() {
  try {
    return localStorage.getItem(REMEMBERED_EMAIL_KEY) ?? "";
  } catch {
    return "";
  }
}

export function rememberEmail(email) {
  localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
}

export function forgetRememberedEmail() {
  localStorage.removeItem(REMEMBERED_EMAIL_KEY);
}
