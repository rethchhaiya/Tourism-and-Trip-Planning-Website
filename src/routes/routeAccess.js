import { PERMISSIONS } from "../constants/permissions";
import {
  can,
  canAny,
  isAdmin,
  isStaff,
} from "../services/roleAdapter";

export const ADMIN_ONLY = "admin";

const STAFF_ONLY = { staff: true };

export const ROUTE_ACCESS = {
  // The dashboard shell is available to signed-in users. Its overview page
  // is administrator-only; other roles are sent to their allowed work area.
  "/dashboard": {},
  "/sidebar": {},
  "/overview": { adminOnly: true },
  "/bookings": { permission: PERMISSIONS.VIEW_BOOKINGS },
  "/listbooking": { permission: PERMISSIONS.VIEW_BOOKINGS },
  // TODO(role-matrix): "locations" is assumed to mean destinations.
  "/table_destinations": {
    permission: PERMISSIONS.VIEW_LOCATIONS,
  },
  "/admin/destinations": {
    permission: PERMISSIONS.VIEW_LOCATIONS,
  },
  "/destination": { staff: true, permission: PERMISSIONS.STORE_LOCATIONS },
  "/guides": { permission: PERMISSIONS.VIEW_GUIDES },
  "/admin/tours": { permission: PERMISSIONS.VIEW_TOURS },
  "/customers": { adminOnly: true },
  "/customer": { adminOnly: true },
  "/createcustomer": { adminOnly: true },
  "/users": { adminOnly: true },
  "/create-user": { adminOnly: true },
  "/settings": {},
  "/popular": STAFF_ONLY,
  "/tour-light": STAFF_ONLY,
  "/authentic-khmer": STAFF_ONLY,
};

export function isAccessAllowed(user, access = {}) {
  if (access.adminOnly || access.permission === ADMIN_ONLY) {
    return isAdmin(user);
  }

  if (access.staff && !isStaff(user)) {
    return false;
  }

  if (Array.isArray(access.permissions)) {
    return canAny(user, access.permissions);
  }

  if (Array.isArray(access.permission)) {
    return canAny(user, access.permission);
  }

  if (typeof access.permission === "string") {
    return can(user, access.permission);
  }

  return true;
}

export function canAccessRoute(user, path) {
  const access = ROUTE_ACCESS[path];
  return Boolean(access) && isAccessAllowed(user, access);
}
