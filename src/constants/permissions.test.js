import { describe, expect, it } from "vitest";
import {
  ALL_PERMISSIONS,
  PERMISSIONS,
  ROLE_PERMISSIONS,
} from "./permissions";

const TABLE = {
  admin: [
    PERMISSIONS.APPROVE_BOOKINGS,
    PERMISSIONS.CANCEL_BOOKINGS,
    PERMISSIONS.STORE_BOOKINGS,
    PERMISSIONS.STORE_CATEGORIES,
    PERMISSIONS.STORE_LOCATIONS,
    PERMISSIONS.STORE_TOURS,
    PERMISSIONS.UPDATE_BOOKINGS,
    PERMISSIONS.UPDATE_CATEGORIES,
    PERMISSIONS.UPDATE_LOCATIONS,
    PERMISSIONS.UPDATE_TOURS,
    PERMISSIONS.VIEW_BOOKINGS,
    PERMISSIONS.VIEW_CATEGORIES,
    PERMISSIONS.VIEW_GUIDES,
    PERMISSIONS.VIEW_LOCATIONS,
    PERMISSIONS.VIEW_TOURS,
  ],
  tour_manager: [
    PERMISSIONS.APPROVE_BOOKINGS,
    PERMISSIONS.CANCEL_BOOKINGS,
    PERMISSIONS.STORE_CATEGORIES,
    PERMISSIONS.STORE_LOCATIONS,
    PERMISSIONS.STORE_TOURS,
    PERMISSIONS.UPDATE_BOOKINGS,
    PERMISSIONS.UPDATE_CATEGORIES,
    PERMISSIONS.UPDATE_LOCATIONS,
    PERMISSIONS.UPDATE_TOURS,
    PERMISSIONS.VIEW_BOOKINGS,
    PERMISSIONS.VIEW_CATEGORIES,
    PERMISSIONS.VIEW_LOCATIONS,
    PERMISSIONS.VIEW_TOURS,
  ],
  tour_guide: [
    PERMISSIONS.VIEW_BOOKINGS,
    PERMISSIONS.VIEW_LOCATIONS,
    PERMISSIONS.VIEW_TOURS,
  ],
  customer: [
    PERMISSIONS.CANCEL_BOOKINGS,
    PERMISSIONS.STORE_BOOKINGS,
    PERMISSIONS.VIEW_BOOKINGS,
    PERMISSIONS.VIEW_CATEGORIES,
    PERMISSIONS.VIEW_GUIDES,
    PERMISSIONS.VIEW_LOCATIONS,
    PERMISSIONS.VIEW_TOURS,
  ],
};

const sorted = (values) => [...values].sort();

describe("ROLE_PERMISSIONS", () => {
  it("matches the documented table exactly for each role", () => {
    for (const role of Object.keys(TABLE)) {
      expect(sorted(ROLE_PERMISSIONS[role])).toEqual(sorted(TABLE[role]));
    }
  });

  it("represents admin as all permissions", () => {
    expect(sorted(ALL_PERMISSIONS)).toEqual(sorted(TABLE.admin));
    expect(sorted(ROLE_PERMISSIONS.admin)).toEqual(sorted(ALL_PERMISSIONS));
  });

  it("does not add permissions outside the table", () => {
    const documented = new Set(ALL_PERMISSIONS);
    for (const permissions of Object.values(ROLE_PERMISSIONS)) {
      for (const permission of permissions) {
        expect(documented.has(permission)).toBe(true);
      }
    }
  });
});
