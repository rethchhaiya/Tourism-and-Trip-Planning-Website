import { http } from "./httpClient";

// /api/tours uses the raw Laravel paginate envelope ({ data, links, meta })
// with no success field. httpClient keeps that envelope intact; fall back to
// a bare array in case an endpoint ever unwraps it.
export async function fetchTours({ page = 1, search = "", categoryId = "" } = {}) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  if (search.trim()) {
    params.set("search", search.trim());
  }
  if (categoryId) {
    params.set("category_id", String(categoryId));
  }

  const payload = await http.get(`/tours?${params.toString()}`);
  if (Array.isArray(payload)) {
    return { tours: payload, meta: null, links: null };
  }
  return {
    tours: Array.isArray(payload?.data) ? payload.data : [],
    meta: payload?.meta ?? null,
    links: payload?.links ?? null,
  };
}

// GET /tours/{id} returns the flat { message, data } envelope (no success
// field). Detail is public, so a 401 must not redirect to the login page.
export async function fetchTourById(id) {
  const payload = await http.get(`/tours/${encodeURIComponent(String(id))}`, {
    noAuthRedirect: true,
  });
  if (payload && typeof payload === "object" && "data" in payload) {
    return payload.data ?? null;
  }
  return payload ?? null;
}

export async function fetchCategories() {
  return http.get("/categories");
}
