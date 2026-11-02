import { http } from "./httpClient";

export function normalizeCategory(raw) {
  const source = raw && typeof raw === "object" ? raw : {};

  return {
    id: source.id ?? null,
    name: typeof source.name === "string" ? source.name : "",
    slug: typeof source.slug === "string" ? source.slug : "",
    description:
      typeof source.description === "string" ? source.description : "",
    image: typeof source.image === "string" ? source.image : "",
    status: Number(source.status) === 0 ? 0 : 1,
    createdAt: source.created_at ?? null,
    updatedAt: source.updated_at ?? null,
  };
}

function extractCategory(payload) {
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

function extractItems(payload) {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload?.data)) {
    return payload.data;
  }
  if (Array.isArray(payload?.data?.data)) {
    return payload.data.data;
  }
  return [];
}

export async function listCategories({ search = "", status = "" } = {}) {
  const params = new URLSearchParams();
  const term = String(search ?? "").trim();
  if (term) {
    params.set("search", term);
  }
  if (status !== "" && status !== null && status !== undefined) {
    params.set("status", String(status));
  }

  const query = params.toString();
  const payload = await http.get(`/categories${query ? `?${query}` : ""}`);
  return extractItems(payload).map(normalizeCategory);
}

export async function getCategory(id) {
  const payload = await http.get(
    `/categories/${encodeURIComponent(String(id))}`,
    { noAuthRedirect: true },
  );
  const data = extractCategory(payload);
  return data ? normalizeCategory(data) : null;
}

export async function createCategory(payload) {
  const body = await http.post("/categories", payload);
  return normalizeCategory(extractCategory(body) ?? {});
}

export async function updateCategory(id, payload) {
  const body = await http.put(
    `/categories/${encodeURIComponent(String(id))}`,
    payload,
  );
  return normalizeCategory(extractCategory(body) ?? {});
}

export async function deleteCategory(id) {
  await http.delete(`/categories/${encodeURIComponent(String(id))}`);
  return { id };
}
