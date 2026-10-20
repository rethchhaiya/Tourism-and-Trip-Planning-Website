// -----------------------------------------------------------------------------
// ROLE ADAPTER — PLACEHOLDER
// -----------------------------------------------------------------------------
// The backend has NOT yet agreed how the client obtains the user's role:
//   (a) role/roles included in the POST /auth/login response, or
//   (b) GET /auth/me (Bearer token) returning the current user incl. role.
// All places that must be revisited once the contract is fixed are marked with
// TODO(role-source). Do not remove those markers until the backend ships.
// -----------------------------------------------------------------------------

export const ROLES = {
  ADMIN: "admin",
  TOUR_MANAGER: "tour_manager",
  TOUR_GUIDE: "tour_guide",
  CUSTOMER: "customer",
};

// TODO(role-source): confirm the REAL field name with the backend team.
// Once agreed, replace the expression below, e.g.:
//   (a) option — user?.role / user?.roles?.[0] from the stored login session
//   (b) option — data?.role / data?.roles?.[0] from GET /auth/me
const ROLE_FIELD = (user) => user?.role ?? user?.roles?.[0] ?? null;

const ROLE_ALIASES = {
  admin: ROLES.ADMIN,
  administrator: ROLES.ADMIN,
  tour_manager: ROLES.TOUR_MANAGER,
  manager: ROLES.TOUR_MANAGER,
  tour_guide: ROLES.TOUR_GUIDE,
  guide: ROLES.TOUR_GUIDE,
  customer: ROLES.CUSTOMER,
};

export function extractRole(user) {
  const raw = ROLE_FIELD(user);
  if (typeof raw !== "string") {
    return null;
  }
  const normalized = raw.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return ROLE_ALIASES[normalized] ?? null;
}

export function isAdmin(user) {
  return extractRole(user) === ROLES.ADMIN;
}

export function isTourManager(user) {
  return extractRole(user) === ROLES.TOUR_MANAGER;
}

export function isTourGuide(user) {
  return extractRole(user) === ROLES.TOUR_GUIDE;
}

export function isCustomer(user) {
  return extractRole(user) === ROLES.CUSTOMER;
}

export function hasAnyRole(user, roles) {
  const role = extractRole(user);
  return role !== null && roles.includes(role);
}

// TODO(role-source): option (b) — replace the placeholder below with the real
// endpoint call once the backend ships it, e.g.:
//     import { http } from "./httpClient";
//     const data = await http.get("/auth/me");
//     return data;
// Until then (option (a)-style placeholder) we reuse the user object stored in
// the session at login time. No extra network request is made.
export async function fetchCurrentUser(session) {
  return session?.user ?? null;
}
