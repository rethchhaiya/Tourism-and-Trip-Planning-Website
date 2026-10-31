export const BOOKING_STORAGE_PREFIX = "traveladmin.booking.";

export function bookingStorageKey(bookingId) {
  return `${BOOKING_STORAGE_PREFIX}${bookingId}`;
}

export function saveBookingResult(result) {
  const bookingId = result?.booking?.id;
  if (bookingId == null) {
    return null;
  }

  const key = bookingStorageKey(bookingId);
  try {
    sessionStorage.setItem(key, JSON.stringify(result));
    return key;
  } catch {
    return null;
  }
}

export function getBookingResult(bookingId) {
  if (bookingId == null) {
    return null;
  }

  try {
    const raw = sessionStorage.getItem(bookingStorageKey(bookingId));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearBookingResult(bookingId) {
  if (bookingId == null) {
    return;
  }
  try {
    sessionStorage.removeItem(bookingStorageKey(bookingId));
  } catch {
    // Ignore storage failures.
  }
}

export function clearAllBookingResults() {
  try {
    const keys = [];
    for (let index = 0; index < sessionStorage.length; index += 1) {
      const key = sessionStorage.key(index);
      if (key?.startsWith(BOOKING_STORAGE_PREFIX)) {
        keys.push(key);
      }
    }
    for (const key of keys) {
      sessionStorage.removeItem(key);
    }
  } catch {
    // Ignore storage failures.
  }
}
