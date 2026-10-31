import { http } from "./httpClient";

export const REFERENCE_KEYS = Object.freeze([
  "booking_statuses",
  "booking_types",
  "participant_sex",
  "payment_method",
  "payment_statuses",
  "user_statuses",
  "tour_statuses",
]);

const cache = new Map();
let inFlightPromise = null;
let generation = 0;

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function normalizeReferenceKeys(keys) {
  const source =
    keys == null
      ? REFERENCE_KEYS
      : Array.isArray(keys)
        ? keys
        : String(keys).split(",");

  const result = [];
  const seen = new Set();

  for (const raw of source) {
    if (typeof raw !== "string") {
      continue;
    }
    const key = raw.trim();
    if (!key || !REFERENCE_KEYS.includes(key) || seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(key);
  }

  return result;
}

// The API may answer with the lists at the top level or inside a
// { success, message, data } envelope. httpClient already unwraps the latter
// when `success` is present; this keeps both shapes working in one place.
function extractLists(payload) {
  if (!isPlainObject(payload)) {
    return {};
  }

  const nested = isPlainObject(payload.data) ? payload.data : null;
  const hasKnownList = REFERENCE_KEYS.some((key) => key in payload);

  if (nested && (payload.success !== undefined || !hasKnownList)) {
    return nested;
  }

  return payload;
}

function buildUrl(keys) {
  if (keys.length === REFERENCE_KEYS.length) {
    return "/reference-data";
  }
  return `/reference-data?keys=${keys.join(",")}`;
}

function startFetch(keys) {
  const startedGeneration = generation;
  const promise = (async () => {
    const payload = await http.get(buildUrl(keys), { noAuthRedirect: true });
    if (startedGeneration !== generation) {
      return;
    }
    const lists = extractLists(payload);
    for (const key of keys) {
      cache.set(key, Array.isArray(lists[key]) ? lists[key] : []);
    }
  })();

  const tracked = promise.finally(() => {
    if (inFlightPromise === tracked) {
      inFlightPromise = null;
    }
  });

  inFlightPromise = tracked;
  return tracked;
}

function pick(keys) {
  const result = {};
  for (const key of keys) {
    result[key] = cache.get(key) ?? [];
  }
  return result;
}

export async function fetchReferenceData(keys) {
  const requested = normalizeReferenceKeys(keys);

  while (requested.length > 0) {
    if (requested.every((key) => cache.has(key))) {
      break;
    }

    if (inFlightPromise) {
      await inFlightPromise;
      continue;
    }

    const missing = requested.filter((key) => !cache.has(key));
    await startFetch(missing);
  }

  return pick(requested);
}

export function clearReferenceCache() {
  cache.clear();
  generation += 1;
  inFlightPromise = null;
}
