import { http } from "./httpClient";
import { normalizeTour, normalizeTourDetail } from "../utils/catalog";

// TODO(verify-live): reference tour_statuses are uppercase, but live tours and
// the create example use lowercase. Flip this constant if the backend rejects
// lowercase status values.
export const TOUR_STATUS_CASING = "lower";

function trim(value) {
  return typeof value === "string" ? value.trim() : "";
}

function toNumberOrNull(value) {
  if (value === null || value === undefined || trim(String(value)) === "") {
    return null;
  }
  const number = Number(String(value).trim());
  return Number.isFinite(number) ? number : null;
}

function normalizeStatus(value) {
  const status = trim(String(value ?? ""));
  if (!status) {
    return "draft";
  }
  return TOUR_STATUS_CASING === "lower"
    ? status.toLowerCase()
    : status.toUpperCase();
}

function toPayloadValues(form) {
  return {
    category_id: toNumberOrNull(form?.categoryId),
    destination_id: toNumberOrNull(form?.destinationId),
    title: trim(form?.title),
    duration_days: toNumberOrNull(form?.durationDays),
    duration_nights: toNumberOrNull(form?.durationNights),
    base_price: toNumberOrNull(form?.basePrice),
    price_override:
      form?.priceOverride === null ||
      form?.priceOverride === undefined ||
      trim(String(form.priceOverride)) === ""
        ? null
        : toNumberOrNull(form.priceOverride),
    status: normalizeStatus(form?.status),
  };
}

export function buildTourPayload(form, original = null) {
  const current = toPayloadValues(form);

  if (!original) {
    return current;
  }

  const previous = toPayloadValues(original);
  const payload = {};
  for (const key of Object.keys(current)) {
    if (current[key] !== previous[key]) {
      payload[key] = current[key];
    }
  }
  return payload;
}

export function toTourForm(tour) {
  return {
    title: tour?.title ?? "",
    categoryId: tour?.category?.id ?? tour?.category_id ?? "",
    destinationId: tour?.destination?.id ?? tour?.destination_id ?? "",
    durationDays: tour?.durationDays ?? tour?.duration_day ?? "",
    durationNights: tour?.durationNights ?? tour?.duration_night ?? "",
    basePrice: tour?.basePrice ?? tour?.base_price ?? "",
    priceOverride: tour?.priceOverride ?? tour?.price_override ?? "",
    status: normalizeStatus(tour?.status),
  };
}

function extractData(payload) {
  if (
    payload &&
    typeof payload === "object" &&
    !Array.isArray(payload) &&
    payload.data &&
    typeof payload.data === "object"
  ) {
    return payload.data;
  }
  return payload;
}

export async function listAdminTours({ page = 1 } = {}) {
  const payload = await http.get(
    `/tours?page=${encodeURIComponent(String(page))}`,
    { noAuthRedirect: true },
  );

  if (Array.isArray(payload)) {
    return {
      tours: payload.map(normalizeTour),
      meta: null,
      links: null,
    };
  }

  return {
    tours: Array.isArray(payload?.data)
      ? payload.data.map(normalizeTour)
      : [],
    meta: payload?.meta ?? null,
    links: payload?.links ?? null,
  };
}

export async function getAdminTour(id) {
  const payload = await http.get(
    `/tours/${encodeURIComponent(String(id))}`,
    { noAuthRedirect: true },
  );
  const tour = extractData(payload);
  return tour ? normalizeTourDetail(tour) : null;
}

export async function createTour(payload) {
  const body = await http.post("/tours", payload);
  return normalizeTour(extractData(body) ?? {});
}

export async function updateTour(id, payload) {
  const body = await http.patch(
    `/tours/${encodeURIComponent(String(id))}`,
    payload,
  );
  return normalizeTour(extractData(body) ?? {});
}

export async function deleteTour(id) {
  await http.delete(`/tours/${encodeURIComponent(String(id))}`);
  return { id };
}

export async function restoreTour(id) {
  await http.post(`/tours/${encodeURIComponent(String(id))}/restore`);
  return { id };
}
