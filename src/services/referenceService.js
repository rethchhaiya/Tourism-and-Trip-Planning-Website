import { http } from "./httpClient";

export const REFERENCE_KEYS = Object.freeze([
  "booking_statuses",
  "booking_types",
  "participant_sex",
  "payment_methods",
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
      if (Array.isArray(lists[key])) {
        cache.set(key, lists[key]);
      }
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

async function loadReferenceData(keys) {
  const requested = normalizeReferenceKeys(keys);

  if (requested.length > 0) {
    let missing = requested.filter((key) => !cache.has(key));

    if (missing.length > 0 && inFlightPromise) {
      await inFlightPromise;
      missing = requested.filter((key) => !cache.has(key));
    }

    if (missing.length > 0) {
      await startFetch(missing);
    }
  }

  return {
    data: pick(requested),
    missingKeys: requested.filter((key) => !cache.has(key)),
  };
}

// Lists that are absent from the response are returned as empty arrays for the
// UI and reported in missingKeys so a caller can offer a retry.
export async function fetchReferenceDataResult(keys) {
  return loadReferenceData(keys);
}

export async function fetchReferenceData(keys) {
  const { data } = await loadReferenceData(keys);
  return data;
}

export function clearReferenceCache() {
  cache.clear();
  generation += 1;
  inFlightPromise = null;
}
