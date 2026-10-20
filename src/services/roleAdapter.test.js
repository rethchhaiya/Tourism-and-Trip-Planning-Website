import { describe, expect, it } from "vitest";
import {
  extractRole,
  hasAnyRole,
  isAdmin,
  isCustomer,
  isTourGuide,
  isTourManager,
  ROLES,
} from "./roleAdapter";

describe("extractRole", () => {
  it("reads the placeholder role field (user.role)", () => {
    expect(extractRole({ role: "admin" })).toBe(ROLES.ADMIN);
  });

  it("normalizes casing, spaces and dashes", () => {
    expect(extractRole({ role: "Tour Manager" })).toBe(ROLES.TOUR_MANAGER);
    expect(extractRole({ role: "tour-guide" })).toBe(ROLES.TOUR_GUIDE);
  });

  it("supports the roles array fallback", () => {
    expect(extractRole({ roles: ["customer"] })).toBe(ROLES.CUSTOMER);
  });

  it("returns null for missing or unknown roles (fail closed)", () => {
    expect(extractRole(null)).toBeNull();
    expect(extractRole({})).toBeNull();
    expect(extractRole({ role: "superuser" })).toBeNull();
  });
});

describe("role helpers", () => {
  it("maps each role to its helper", () => {
    expect(isAdmin({ role: "admin" })).toBe(true);
    expect(isTourManager({ role: "manager" })).toBe(true);
    expect(isTourGuide({ role: "guide" })).toBe(true);
    expect(isCustomer({ role: "customer" })).toBe(true);
    expect(isAdmin({ role: "customer" })).toBe(false);
  });

  it("hasAnyRole checks membership and fails closed on unknown roles", () => {
    expect(hasAnyRole({ role: "admin" }, [ROLES.ADMIN])).toBe(true);
    expect(hasAnyRole({ role: "customer" }, [ROLES.ADMIN])).toBe(false);
    expect(hasAnyRole({}, [ROLES.ADMIN])).toBe(false);
  });
});
