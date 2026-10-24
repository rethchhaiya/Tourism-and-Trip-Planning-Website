import { http } from "./httpClient";

// /api/tours uses nothing but the raw Laravel paginate envelope
// ({ data, links, meta }); /api/categories uses the standard
// { success, message, data } wrapper which httpClient unwraps.
export async function fetchTours({ page = 1, search = "", categoryId = "" } = {}) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  if (search.trim()) {
    params.set("search", search.trim());
  }
  if (categoryId) {
    params.set("category_id", String(categoryId));
  }

  const body = await http.get(`/tours?${params.toString()}`);
  return { tours: body?.data ?? [], meta: body?.meta ?? null };
}

export async function fetchCategories() {
  return http.get("/categories");
}
