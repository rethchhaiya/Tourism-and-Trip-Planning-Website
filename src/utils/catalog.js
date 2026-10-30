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

export function isPublishedStatus(status) {
  return (
    String(status ?? "").trim().toLowerCase() === PUBLISHED_TOUR_STATUS
  );
}

function isActiveRecord(record) {
  return String(record?.status ?? "").trim().toUpperCase() === "ACTIVE";
}

function toTimestamp(value) {
  const time = Date.parse(value ?? "");
  return Number.isFinite(time) ? time : null;
}

export function isScheduleClosed(schedule, now = Date.now()) {
  const cutoff = toTimestamp(schedule?.bookingCutoffDateTime);
  if (cutoff == null) {
    return false;
  }
  const nowMs = now instanceof Date ? now.getTime() : Number(now);
  return Number.isFinite(nowMs) && cutoff <= nowMs;
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

function normalizeRelatedRecord(raw) {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  return {
    id: raw.id ?? null,
    name: raw.name ?? "",
    description: raw.description ?? "",
    image: raw.image ?? "",
    status: raw.status ?? null,
  };
}

// Extends normalizeTour with the fields only GET /tours/{id} returns. Keeps the
// list mapper as the single source for the shared tour fields.
export function normalizeTourDetail(raw) {
  const base = normalizeTour(raw);

  const activeImages = Array.isArray(raw?.tourImages)
    ? raw.tourImages
        .filter(
          (image) =>
            isActiveRecord(image) &&
            typeof image?.image_url === "string" &&
            image.image_url.length > 0,
        )
        .map((image) => ({
          url: image.image_url,
          isPrimary: Boolean(image.is_primary),
          status: image.status ?? null,
        }))
    : [];
  const images = [
    ...activeImages.filter((image) => image.isPrimary),
    ...activeImages.filter((image) => !image.isPrimary),
  ];

  const inclusions = [];
  const exclusions = [];
  if (Array.isArray(raw?.includeExclude)) {
    for (const item of raw.includeExclude) {
      if (!isActiveRecord(item)) {
        continue;
      }
      const type = String(item?.type ?? "").trim().toUpperCase();
      const entry = { description: item?.description ?? "" };
      if (type === "INCLUDED") {
        inclusions.push(entry);
      } else if (type === "EXCLUDED") {
        exclusions.push(entry);
      }
    }
  }

  // TODO(undocumented): tourItinerary is not in the API document. Kept
  // read-only until the backend contract covers it.
  const itinerary = (Array.isArray(raw?.tourItinerary) ? raw.tourItinerary : [])
    .filter(isActiveRecord)
    .map((day) => ({
      dayNumber: toNumberOrNull(day?.day_number),
      title: day?.title ?? "",
      description: day?.description ?? "",
      mealsIncluded: day?.meals_included ?? "",
      status: day?.status ?? null,
    }))
    .sort(
      (a, b) => (a.dayNumber ?? Infinity) - (b.dayNumber ?? Infinity),
    );

  const schedules = (
    Array.isArray(raw?.tourSchedule) ? raw.tourSchedule : []
  )
    .map((schedule) => {
      const maxCapacity = toNumberOrNull(schedule?.max_capacity);
      const currentBooked = toNumberOrNull(schedule?.current_booked);
      return {
        id: schedule?.id ?? null,
        startDateTime: schedule?.start_datetime ?? "",
        endDateTime: schedule?.end_datetime ?? "",
        bookingCutoffDateTime: schedule?.booking_cutoff_datetime ?? "",
        minCapacity: toNumberOrNull(schedule?.min_capacity),
        maxCapacity,
        currentBooked,
        priceOverride: toNumberOrNull(schedule?.price_override),
        status: schedule?.status ?? "",
        notes: schedule?.notes ?? "",
        seatsLeft:
          maxCapacity != null && currentBooked != null
            ? maxCapacity - currentBooked
            : null,
      };
    })
    .sort(
      (a, b) =>
        (toTimestamp(a.startDateTime) ?? Infinity) -
        (toTimestamp(b.startDateTime) ?? Infinity),
    );

  return {
    ...base,
    images,
    primaryImage: images[0]?.url ?? "",
    category: normalizeRelatedRecord(raw?.category),
    destination: normalizeRelatedRecord(raw?.destination),
    inclusions,
    exclusions,
    itinerary,
    schedules,
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
