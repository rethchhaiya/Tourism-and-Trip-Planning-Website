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

export function primaryTourImage(tour) {
  if (!Array.isArray(tour?.tourImages) || tour.tourImages.length === 0) {
    return "";
  }
  const primary =
    tour.tourImages.find((image) => image.is_primary) ?? tour.tourImages[0];
  return primary?.image_url ?? "";
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
  const days = tour?.duration_day;
  const nights = tour?.duration_night;
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
