export const FALLBACK_TOUR_STATUS_OPTIONS = Object.freeze([
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
]);

export const EMPTY_TOUR_FORM = Object.freeze({
  title: "",
  categoryId: "",
  destinationId: "",
  durationDays: "",
  durationNights: "",
  basePrice: "",
  priceOverride: "",
  status: "draft",
});

function trim(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isWholeNumber(value, minimum) {
  const text = trim(String(value ?? ""));
  return /^\d+$/.test(text) && Number(text) >= minimum;
}

function isMoney(value, optional = false) {
  const text = trim(String(value ?? ""));
  if (optional && !text) {
    return true;
  }
  return /^\d+(\.\d{1,2})?$/.test(text) && Number(text) >= 0;
}

export function buildTourStatusOptions(list) {
  if (!Array.isArray(list)) {
    return FALLBACK_TOUR_STATUS_OPTIONS;
  }

  const options = [];
  for (const item of list) {
    if (!item || typeof item !== "object" || item.value == null) {
      continue;
    }
    const value = String(item.value).trim().toLowerCase();
    if (!value) {
      continue;
    }
    const label =
      typeof item.label === "string" && item.label.trim()
        ? item.label.trim()
        : value.charAt(0).toUpperCase() + value.slice(1);
    if (!options.some((option) => option.value === value)) {
      options.push({ value, label });
    }
  }

  return options.length > 0 ? options : FALLBACK_TOUR_STATUS_OPTIONS;
}

export function validateTourForm(form) {
  const errors = {};

  if (!trim(form?.title)) {
    errors.title = "Title is required.";
  }

  if (!isWholeNumber(form?.categoryId, 1)) {
    errors.categoryId = "Select a category.";
  }

  if (!isWholeNumber(form?.destinationId, 1)) {
    errors.destinationId = "Enter a valid destination ID.";
  }

  if (!isWholeNumber(form?.durationDays, 1)) {
    errors.durationDays =
      "Duration days must be a whole number of at least 1.";
  }

  if (!isWholeNumber(form?.durationNights, 0)) {
    errors.durationNights =
      "Duration nights must be a whole number of at least 0.";
  }

  if (!isMoney(form?.basePrice)) {
    errors.basePrice =
      "Base price must be a number of at least 0 with up to 2 decimals.";
  }

  if (!isMoney(form?.priceOverride, true)) {
    errors.priceOverride =
      "Price override must be a number of at least 0 with up to 2 decimals.";
  }

  if (!trim(form?.status)) {
    errors.status = "Select a status.";
  }

  return errors;
}
