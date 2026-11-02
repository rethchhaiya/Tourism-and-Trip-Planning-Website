export const CANCELLABLE_STATUSES = Object.freeze([
  "pending",
  "confirmed",
]);

export const CANCEL_CONFIRM_MESSAGE =
  "Cancel this booking? The seats will be released.";

export const GENERIC_CANCEL_ERROR =
  "Could not cancel this booking. Please try again.";

export function isCancellableStatus(status) {
  return CANCELLABLE_STATUSES.includes(
    String(status ?? "").trim().toLowerCase(),
  );
}

function hasUnsafeKeys(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      ("exception" in value || "file" in value),
  );
}

export function resolveCancelErrorMessage(error) {
  if (
    hasUnsafeKeys(error) ||
    hasUnsafeKeys(error?.body) ||
    hasUnsafeKeys(error?.response) ||
    hasUnsafeKeys(error?.raw)
  ) {
    return GENERIC_CANCEL_ERROR;
  }

  const message = error?.message;
  if (typeof message !== "string") {
    return GENERIC_CANCEL_ERROR;
  }

  const trimmed = message.trim();
  if (
    !trimmed ||
    trimmed.length >= 200 ||
    /exception|stack\s*trace|\.php\b|[a-z]:\\|\/var\/|\/app\//i.test(trimmed)
  ) {
    return GENERIC_CANCEL_ERROR;
  }

  return trimmed;
}
