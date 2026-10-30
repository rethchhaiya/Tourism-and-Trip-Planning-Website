// Roles come from user.roles in the login and register responses; user.role
// remains a legacy fallback for the mock login and Google callback.

export const ROLES = {
  ADMIN: "admin",
  TOUR_MANAGER: "tour_manager",
  TOUR_GUIDE: "tour_guide",
  CUSTOMER: "customer",
};

const ROLE_ORDER = [
  ROLES.ADMIN,
  ROLES.TOUR_MANAGER,
  ROLES.TOUR_GUIDE,
  ROLES.CUSTOMER,
];

const ROLE_ALIASES = {
  admin: ROLES.ADMIN,
  administrator: ROLES.ADMIN,
  tour_manager: ROLES.TOUR_MANAGER,
  manager: ROLES.TOUR_MANAGER,
  tour_guide: ROLES.TOUR_GUIDE,
  guide: ROLES.TOUR_GUIDE,
  customer: ROLES.CUSTOMER,
};

function normalizeRoleName(value) {
  if (typeof value !== "string") {
    return null;
  }
  const normalized = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  return ROLE_ALIASES[normalized] ?? null;
}

function collectRoleNames(user) {
  const names = [];

  if (Array.isArray(user.roles)) {
    for (const entry of user.roles) {
      if (typeof entry === "string") {
        names.push(entry);
      } else if (
        entry &&
        typeof entry === "object" &&
        typeof entry.name === "string"
      ) {
        names.push(entry.name);
      }
    }
  }

  if (typeof user.role === "string") {
    names.push(user.role);
  }

  return names;
}

export function getRoles(user) {
  if (user === null || user === undefined) {
    return [];
  }

  const recognised = new Set();

  for (const rawName of collectRoleNames(user)) {
    const name = rawName.trim();
    if (!name) {
      continue;
    }

    const role = normalizeRoleName(name);
    if (role) {
      recognised.add(role);
    } else if (import.meta.env.DEV) {
      console.warn(`[roleAdapter] Unrecognised role name: ${name}`);
    }
  }

  if (recognised.size === 0) {
    return [ROLES.CUSTOMER];
  }

  return ROLE_ORDER.filter((role) => recognised.has(role));
}

export function resolveRole(user) {
  if (user === null || user === undefined) {
    return null;
  }
  return getRoles(user)[0] ?? null;
}

export function hasRole(user, role) {
  const target = normalizeRoleName(role);
  return target !== null && getRoles(user).includes(target);
}

export function hasAnyRole(user, roles) {
  if (!Array.isArray(roles)) {
    return false;
  }
  const userRoles = getRoles(user);
  return roles.some((role) => {
    const target = normalizeRoleName(role);
    return target !== null && userRoles.includes(target);
  });
}

export function isAdmin(user) {
  return hasRole(user, ROLES.ADMIN);
}

export function isTourManager(user) {
  return hasRole(user, ROLES.TOUR_MANAGER);
}

export function isTourGuide(user) {
  return hasRole(user, ROLES.TOUR_GUIDE);
}

export function isCustomer(user) {
  return hasRole(user, ROLES.CUSTOMER);
}

export async function fetchCurrentUser(session) {
  return session?.user ?? null;
}
