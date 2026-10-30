import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ALL_PERMISSIONS,
  PERMISSIONS,
} from "../constants/permissions";
import { getSession, persistSession } from "./authService";
import {
  can,
  canAny,
  getPermissions,
  getRoles,
  hasAnyRole,
  hasRole,
  isAdmin,
  isCustomer,
  isStaff,
  isTourGuide,
  isTourManager,
  ROLES,
  resolveRole,
} from "./roleAdapter";

const CUSTOMER_USER = {
  id: 7,
  name: "Customer",
  email: "customer@example.com",
  phone: "012345678",
  status: "active",
  verified_at: "2026-01-01T00:00:00Z",
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

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe("getRoles", () => {
  it("reads the real customer shape", () => {
    expect(getRoles(CUSTOMER_USER)).toEqual([ROLES.CUSTOMER]);
  });

  it("returns both roles for the real admin shape, admin first", () => {
    expect(getRoles(ADMIN_USER)).toEqual([ROLES.ADMIN, ROLES.CUSTOMER]);
  });

  it("does not depend on the order of the roles array", () => {
    const reversed = {
      ...ADMIN_USER,
      roles: [...ADMIN_USER.roles].reverse(),
    };
    expect(getRoles(reversed)).toEqual(getRoles(ADMIN_USER));
  });

  it("keeps a recognised role when another entry is unknown", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(
      getRoles({
        roles: [
          { id: 9, name: "superuser", type: "admin" },
          { id: 2, name: "admin", type: "admin" },
        ],
      }),
    ).toEqual([ROLES.ADMIN]);
  });

  it("supports plain string roles", () => {
    expect(getRoles({ roles: ["admin", "customer"] })).toEqual([
      ROLES.ADMIN,
      ROLES.CUSTOMER,
    ]);
  });

  it("normalises casing, spaces and hyphens", () => {
    expect(
      getRoles({
        roles: [{ name: "Tour Manager" }, { name: "ADMIN" }, { name: "tour-guide" }],
      }),
    ).toEqual([ROLES.ADMIN, ROLES.TOUR_MANAGER, ROLES.TOUR_GUIDE]);
  });

  it("removes duplicates across roles and the legacy field", () => {
    expect(
      getRoles({
        roles: ["admin", { name: "ADMIN" }, { name: "administrator" }],
        role: "admin",
      }),
    ).toEqual([ROLES.ADMIN]);
  });

  it("orders roles from highest to lowest privilege", () => {
    expect(getRoles({ roles: ["customer", "guide", "manager", "admin"] })).toEqual(
      [ROLES.ADMIN, ROLES.TOUR_MANAGER, ROLES.TOUR_GUIDE, ROLES.CUSTOMER],
    );
  });

  it("treats a logged-in user with only unknown roles as a customer", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(
      getRoles({ roles: [{ name: "superuser", type: "admin" }] }),
    ).toEqual([ROLES.CUSTOMER]);
    expect(getRoles({ roles: ["wizard"] })).toEqual([ROLES.CUSTOMER]);
  });

  it("treats an empty roles array as a customer", () => {
    expect(getRoles({ roles: [] })).toEqual([ROLES.CUSTOMER]);
  });

  it("returns no roles for a null or undefined user", () => {
    expect(getRoles(null)).toEqual([]);
    expect(getRoles(undefined)).toEqual([]);
  });

  it("still reads the legacy user.role field", () => {
    expect(getRoles({ role: "admin" })).toEqual([ROLES.ADMIN]);
    expect(getRoles({ role: "Guide" })).toEqual([ROLES.TOUR_GUIDE]);
  });
});

describe("resolveRole", () => {
  it("returns the highest role", () => {
    expect(resolveRole(ADMIN_USER)).toBe(ROLES.ADMIN);
    expect(resolveRole(CUSTOMER_USER)).toBe(ROLES.CUSTOMER);
  });

  it("returns null when there is no user", () => {
    expect(resolveRole(null)).toBeNull();
    expect(resolveRole(undefined)).toBeNull();
  });
});

describe("role helpers", () => {
  it("treats an admin+customer user as both admin and customer", () => {
    expect(isAdmin(ADMIN_USER)).toBe(true);
    expect(isCustomer(ADMIN_USER)).toBe(true);
    expect(isTourManager(ADMIN_USER)).toBe(false);
    expect(isTourGuide(ADMIN_USER)).toBe(false);
  });

  it("never treats a customer-only user as admin", () => {
    expect(isCustomer(CUSTOMER_USER)).toBe(true);
    expect(isAdmin(CUSTOMER_USER)).toBe(false);
    expect(isTourManager(CUSTOMER_USER)).toBe(false);
    expect(isTourGuide(CUSTOMER_USER)).toBe(false);
  });

  it("hasRole matches any of the user's roles", () => {
    expect(hasRole(ADMIN_USER, ROLES.ADMIN)).toBe(true);
    expect(hasRole(ADMIN_USER, ROLES.CUSTOMER)).toBe(true);
    expect(hasRole(CUSTOMER_USER, ROLES.ADMIN)).toBe(false);
  });

  it("hasAnyRole matches when any allowed role is present", () => {
    expect(hasAnyRole(ADMIN_USER, [ROLES.ADMIN])).toBe(true);
    expect(hasAnyRole(ADMIN_USER, [ROLES.CUSTOMER])).toBe(true);
    expect(
      hasAnyRole(ADMIN_USER, [ROLES.TOUR_MANAGER, ROLES.CUSTOMER]),
    ).toBe(true);
    expect(hasAnyRole(CUSTOMER_USER, [ROLES.ADMIN])).toBe(false);
    expect(hasAnyRole(null, [ROLES.CUSTOMER])).toBe(false);
  });
});

describe("stored session", () => {
  it("gives the same roles when loaded back from localStorage", () => {
    persistSession({ token: "test-token", user: ADMIN_USER });

    const loaded = getSession();

    expect(getRoles(loaded.user)).toEqual(getRoles(ADMIN_USER));
    expect(hasAnyRole(loaded.user, [ROLES.ADMIN])).toBe(true);
    expect(hasAnyRole(loaded.user, [ROLES.CUSTOMER])).toBe(true);
  });
});

describe("permissions", () => {
  const TOUR_MANAGER_USER = {
    roles: [{ id: 3, name: "tour_manager", type: "admin" }],
  };
  const TOUR_GUIDE_USER = {
    roles: [{ id: 4, name: "tour_guide", type: "admin" }],
  };

  it("unions the permissions of every role", () => {
    expect(getPermissions(ADMIN_USER)).toEqual(ALL_PERMISSIONS);
    expect(getPermissions(CUSTOMER_USER)).toEqual([
      PERMISSIONS.CANCEL_BOOKINGS,
      PERMISSIONS.STORE_BOOKINGS,
      PERMISSIONS.VIEW_BOOKINGS,
      PERMISSIONS.VIEW_CATEGORIES,
      PERMISSIONS.VIEW_GUIDES,
      PERMISSIONS.VIEW_LOCATIONS,
      PERMISSIONS.VIEW_TOURS,
    ]);
  });

  it("allows and denies each role on a sample of permissions", () => {
    expect(can(ADMIN_USER, PERMISSIONS.APPROVE_BOOKINGS)).toBe(true);
    expect(can(ADMIN_USER, PERMISSIONS.STORE_BOOKINGS)).toBe(true);

    expect(can(TOUR_MANAGER_USER, PERMISSIONS.APPROVE_BOOKINGS)).toBe(true);
    expect(can(TOUR_MANAGER_USER, PERMISSIONS.UPDATE_TOURS)).toBe(true);
    expect(can(TOUR_MANAGER_USER, PERMISSIONS.STORE_BOOKINGS)).toBe(false);
    expect(can(TOUR_MANAGER_USER, PERMISSIONS.VIEW_GUIDES)).toBe(false);

    expect(can(TOUR_GUIDE_USER, PERMISSIONS.VIEW_BOOKINGS)).toBe(true);
    expect(can(TOUR_GUIDE_USER, PERMISSIONS.VIEW_CATEGORIES)).toBe(false);
    expect(can(TOUR_GUIDE_USER, PERMISSIONS.CANCEL_BOOKINGS)).toBe(false);

    expect(can(CUSTOMER_USER, PERMISSIONS.STORE_BOOKINGS)).toBe(true);
    expect(can(CUSTOMER_USER, PERMISSIONS.APPROVE_BOOKINGS)).toBe(false);
  });

  it("gives an admin+customer user every permission", () => {
    for (const permission of ALL_PERMISSIONS) {
      expect(can(ADMIN_USER, permission)).toBe(true);
    }
  });

  it("treats missing users as having no permissions", () => {
    expect(getPermissions(null)).toEqual([]);
    expect(can(null, PERMISSIONS.VIEW_BOOKINGS)).toBe(false);
    expect(canAny(null, [PERMISSIONS.VIEW_BOOKINGS])).toBe(false);
  });

  it("canAny matches when at least one permission is granted", () => {
    expect(
      canAny(TOUR_GUIDE_USER, [
        PERMISSIONS.VIEW_CATEGORIES,
        PERMISSIONS.VIEW_BOOKINGS,
      ]),
    ).toBe(true);
    expect(
      canAny(TOUR_GUIDE_USER, [
        PERMISSIONS.VIEW_CATEGORIES,
        PERMISSIONS.CANCEL_BOOKINGS,
      ]),
    ).toBe(false);
  });

  it("identifies staff roles only", () => {
    expect(isStaff(ADMIN_USER)).toBe(true);
    expect(isStaff(TOUR_MANAGER_USER)).toBe(true);
    expect(isStaff(TOUR_GUIDE_USER)).toBe(true);
    expect(isStaff(CUSTOMER_USER)).toBe(false);
    expect(isStaff(null)).toBe(false);
  });
});
