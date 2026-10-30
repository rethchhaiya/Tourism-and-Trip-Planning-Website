export const ACTIVE_CATEGORY_STATUS = 1;
export const PUBLISHED_TOUR_STATUS = "published";

export function isActiveCategory(category) {
  return (
    category?.status === ACTIVE_CATEGORY_STATUS ||
    category?.status === "active"
  );
}

export function isPublishedTour(tour) {
  return tour?.status === PUBLISHED_TOUR_STATUS;
}

function toNumberOrNull(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const number =
    typeof value === "number" ? value : Number.parseFloat(String(value));
  return Number.isFinite(number) ? number : null;
}

export function normalizeTour(raw) {
  const basePrice = toNumberOrNull(raw?.base_price);
  const priceOverride = toNumberOrNull(raw?.price_override);
  const images = Array.isArray(raw?.tourImages)
    ? raw.tourImages
        .filter(
          (image) =>
            typeof image?.image_url === "string" && image.image_url.length > 0,
        )
        .map((image) => ({
          url: image.image_url,
          isPrimary: Boolean(image.is_primary),
          status: image.status ?? null,
        }))
    : [];
  const primary = images.find((image) => image.isPrimary) ?? images[0] ?? null;

  return {
    id: raw?.id ?? null,
    title: raw?.title ?? "",
    slug: raw?.slug ?? "",
    basePrice,
    priceOverride,
    displayPrice: priceOverride ?? basePrice,
    durationDays: toNumberOrNull(raw?.duration_day),
    durationNights: toNumberOrNull(raw?.duration_night),
    status: raw?.status ?? "",
    images,
    primaryImage: primary?.url ?? "",
  };
}

export function primaryTourImage(tour) {
  return tour?.primaryImage ?? "";
}

export function tourCategoryIds(tour) {
  const ids = [];
  if (tour?.category_id != null) {
    ids.push(Number(tour.category_id));
  }
  if (tour?.category?.id != null) {
    ids.push(Number(tour.category.id));
  }
  return [...new Set(ids)];
}

export function matchesSearchTerm(text, rawTerm) {
  const term = rawTerm.trim().toLowerCase();
  if (!term) {
    return true;
  }
  return (text ?? "").toLowerCase().includes(term);
}

export function formatDuration(tour) {
  const days = tour?.durationDays;
  const nights = tour?.durationNights;
  if (days == null && nights == null) {
    return "";
  }
  const dayText =
    days == null
      ? null
      : `${days} ${days === 1 ? "day" : "days"}`;
  const nightText =
    nights == null
      ? null
      : `${nights} ${nights === 1 ? "night" : "nights"}`;
  return [dayText, nightText].filter(Boolean).join(" / ");
}
