function hasUnsafeKeys(error, depth = 0) {
  if (!error || typeof error !== "object" || depth > 2) {
    return false;
  }
  return (
    ["exception", "file"].some((key) => key in error) ||
    ["body", "response", "raw", "original"].some(
      (key) =>
        error[key] &&
        typeof error[key] === "object" &&
        hasUnsafeKeys(error[key], depth + 1),
    )
  );
}

export function resolveApiErrorMessage(error, fallback) {
  if (!error || typeof error !== "object" || hasUnsafeKeys(error)) {
    return fallback;
  }
  const message = error.message;
  if (typeof message === "string" && message.trim() && message.length < 200) {
    return message.trim();
  }
  return fallback;
}
