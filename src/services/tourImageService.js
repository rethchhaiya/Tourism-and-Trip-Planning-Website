import { http } from "./httpClient";

const TOUR_IMAGES_PATH = "/tour-images";
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function trim(value) {
  return typeof value === "string" ? value.trim() : "";
}

function toBoolean(value) {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value === 1;
  }
  const text = String(value ?? "").trim().toLowerCase();
  return text === "1" || text === "true";
}

function normalizeStatus(value) {
  const status = trim(String(value ?? "")).toUpperCase();
  return status === "ACTIVE" || status === "INACTIVE" ? status : null;
}

export function normalizeTourImage(raw) {
  const item = raw && typeof raw === "object" ? raw : {};
  return {
    id: item.id ?? null,
    tourId: item.tour_id ?? item.tourId ?? null,
    imageUrl: item.image_url ?? item.imageUrl ?? "",
    fullImageUrl: item.full_image_url ?? item.fullImageUrl ?? "",
    isPrimary: toBoolean(item.is_primary ?? item.isPrimary),
    status: normalizeStatus(item.status),
    createdAt: item.created_at ?? item.createdAt ?? null,
  };
}

function extractImage(payload) {
  if (Array.isArray(payload)) {
    return payload[0] ?? null;
  }
  if (payload && typeof payload === "object") {
    if (Array.isArray(payload.data)) {
      return payload.data[0] ?? null;
    }
    if (payload.data && typeof payload.data === "object") {
      return payload.data;
    }
    return payload;
  }
  return null;
}

function extractList(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload?.data)) {
    return payload.data;
  }
  return [];
}

function buildImageFormData({ tourId, file, isPrimary, status, method } = {}) {
  const formData = new FormData();

  if (tourId !== undefined && tourId !== null) {
    formData.append("tour_id", String(tourId));
  }
  if (file) {
    formData.append("image", file);
  }
  if (isPrimary !== undefined) {
    formData.append("is_primary", isPrimary ? "1" : "0");
  }
  if (status) {
    formData.append("status", status);
  }
  if (method) {
    formData.append("_method", method);
  }

  return formData;
}

export async function listTourImages(tourId) {
  const query = `tour_id=${encodeURIComponent(String(tourId))}`;
  const payload = await http.get(`${TOUR_IMAGES_PATH}?${query}`, {
    noAuthRedirect: true,
  });
  return extractList(payload).map(normalizeTourImage);
}

export async function uploadTourImage({ tourId, file, isPrimary, status } = {}) {
  const formData = buildImageFormData({ tourId, file, isPrimary, status });
  const payload = await http.upload(TOUR_IMAGES_PATH, formData);
  const image = extractImage(payload);
  return image ? normalizeTourImage(image) : null;
}

export async function setPrimaryImage(id) {
  await http.patch(
    `${TOUR_IMAGES_PATH}/${encodeURIComponent(String(id))}/primary`,
  );
  return { id };
}

export async function updateTourImage(id, { file, status } = {}) {
  // TODO(verify-live): the document lists PUT /tour-images/{id}, but PHP does
  // not parse multipart bodies on a real PUT. Send POST with _method=PUT.
  const formData = buildImageFormData({ file, status, method: "PUT" });
  const payload = await http.upload(
    `${TOUR_IMAGES_PATH}/${encodeURIComponent(String(id))}`,
    formData,
    { method: "POST" },
  );
  const image = extractImage(payload);
  return image ? normalizeTourImage(image) : null;
}

export async function deleteTourImage(id) {
  await http.delete(`${TOUR_IMAGES_PATH}/${encodeURIComponent(String(id))}`);
  return { id };
}

function parseHttpUrl(value) {
  const text = trim(value);
  if (!text) {
    return null;
  }
  let url;
  try {
    url = new URL(text);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return null;
  }
  return url;
}

function isLocalHost(hostname) {
  const host = String(hostname ?? "")
    .toLowerCase()
    .replace(/^\[|\]$/g, "");
  return LOCAL_HOSTS.has(host);
}

function getStorageOrigin() {
  const base = import.meta.env?.VITE_API_BASE_URL ?? "";
  const url = parseHttpUrl(base);
  return url ? url.origin : null;
}

function hasScheme(value) {
  return /^[a-z][a-z0-9+.-]*:/i.test(value);
}

function storageUrlFromPath(value) {
  const origin = getStorageOrigin();
  if (!origin) {
    return null;
  }

  const clean = trim(value).replace(/^\/+/, "");
  if (!clean) {
    return null;
  }

  // TODO(verify-live): confirm the storage URL pattern. The document uses
  // /storage/<path>, but the live server may serve images from a CDN or return
  // a path that already contains "storage/".
  const storageMatch = /(?:^|\/)(storage\/.*)$/i.exec(clean);
  if (storageMatch) {
    return `${origin}/${storageMatch[1]}`;
  }

  return `${origin}/storage/${clean}`;
}

export function resolveImageCandidates(image) {
  if (!image || typeof image !== "object") {
    return [];
  }

  const candidates = [];
  const add = (url) => {
    if (url && !candidates.includes(url)) {
      candidates.push(url);
    }
  };

  const full = parseHttpUrl(image.fullImageUrl ?? image.full_image_url);
  const raw = image.imageUrl ?? image.image_url;
  const direct = parseHttpUrl(raw);

  if (full && !isLocalHost(full.hostname)) {
    add(full.toString());
  }
  if (direct && !isLocalHost(direct.hostname)) {
    add(direct.toString());
  }
  if (direct && isLocalHost(direct.hostname)) {
    add(storageUrlFromPath(direct.pathname));
  }

  const path = trim(raw);
  if (path && !path.startsWith("//") && !hasScheme(path)) {
    add(storageUrlFromPath(path));
  }

  if (full && isLocalHost(full.hostname)) {
    add(storageUrlFromPath(full.pathname));
  }

  return candidates;
}

export function resolveImageUrl(image) {
  return resolveImageCandidates(image)[0] ?? null;
}
