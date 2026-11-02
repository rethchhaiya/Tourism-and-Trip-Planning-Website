import { useEffect, useMemo, useState } from "react";
import { ImageOff, Pencil, Plus, Search, Trash2 } from "lucide-react";
import StatusBadge from "../../../components/admin/customers/StatusBadge";
import { useAuth } from "../../../context/useAuth";
import { PERMISSIONS } from "../../../constants/permissions";
import {
  deleteCategory,
  listCategories,
} from "../../../services/adminCategoryService";
import CategoryFormModal from "./CategoryFormModal";

const DELETE_FALLBACK =
  "Could not delete this category. It may still be used by tours.";
const EMPTY_ITEMS = [];

function formatDate(value) {
  const time = Date.parse(value ?? "");
  if (!Number.isFinite(time)) {
    return "—";
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(time));
}

function hasUnsafeKeys(error, depth = 0) {
  if (!error || typeof error !== "object" || depth > 2) {
    return false;
  }
  return (
    ["exception", "file"].some((key) => key in error) ||
    ["body", "response", "raw", "original"].some(
      (key) =>
        error[key] &&
        typeof error[key] === "object" &&
        hasUnsafeKeys(error[key], depth + 1),
    )
  );
}

function resolveDeleteError(error) {
  if (!error || typeof error !== "object" || hasUnsafeKeys(error)) {
    return DELETE_FALLBACK;
  }
  const message = error.message;
  if (
    typeof message === "string" &&
    message.trim() &&
    message.length < 200
  ) {
    return message.trim();
  }
  return DELETE_FALLBACK;
}

function CategoryThumb({ src, alt }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-400">
        <ImageOff size={18} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className="h-11 w-11 shrink-0 rounded-lg border border-slate-200 object-cover"
    />
  );
}

export default function CategoriesAdminPage() {
  const { can, isAdmin } = useAuth();
  const canCreate = can(PERMISSIONS.STORE_CATEGORIES);
  const canEdit = can(PERMISSIONS.UPDATE_CATEGORIES);
  const canDelete = isAdmin;

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [result, setResult] = useState({
    key: null,
    status: "loading",
    items: [],
  });
  const [reloadKey, setReloadKey] = useState(0);

  const requestKey = `${search}\u0000${status}\u0000${reloadKey}`;
  const categories = result.key === requestKey ? result.items : EMPTY_ITEMS;
  const loadState = result.key === requestKey ? result.status : "loading";

  const [formState, setFormState] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    const key = `${search}\u0000${status}\u0000${reloadKey}`;

    listCategories({ search, status })
      .then((items) => {
        if (!cancelled) {
          setResult({ key, status: "ready", items });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setResult({ key, status: "error", items: [] });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [search, status, reloadKey]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return categories.filter((category) => {
      const haystack =
        `${category.name} ${category.slug} ${category.description}`.toLowerCase();
      const matchesSearch = !term || haystack.includes(term);
      const matchesStatus =
        status === "" || String(category.status) === String(status);
      return matchesSearch && matchesStatus;
    });
  }, [categories, search, status]);

  function refresh() {
    setReloadKey((key) => key + 1);
  }

  function openCreate() {
    setFormState({ mode: "create", category: null });
  }

  function openEdit(category) {
    setFormState({ mode: "edit", category });
  }

  function openDelete(category) {
    setDeleteError("");
    setDeleteTarget(category);
  }

  function closeDelete() {
    if (deleting) {
      return;
    }
    setDeleteTarget(null);
    setDeleteError("");
  }

  async function confirmDelete() {
    if (deleting || !deleteTarget) {
      return;
    }
    setDeleting(true);
    setDeleteError("");
    try {
      await deleteCategory(deleteTarget.id);
      setDeleteTarget(null);
      refresh();
    } catch (error) {
      setDeleteError(resolveDeleteError(error));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Categories
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage the categories used to organise tours.
            </p>
          </div>

          {canCreate && (
            <button
              type="button"
              onClick={openCreate}
              className="flex items-center gap-2 self-start rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-500 sm:self-auto"
            >
              <Plus size={16} />
              Add category
            </button>
          )}
        </div>

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center">
            <div className="relative w-full lg:max-w-[420px]">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Search categories by name, slug, or description..."
                aria-label="Search categories"
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
            </div>

            <label className="flex h-10 items-center rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600">
              <span className="mr-2 text-xs font-semibold uppercase text-slate-400">
                Status:
              </span>
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
                aria-label="Filter by status"
                className="bg-transparent text-sm text-slate-700 outline-none"
              >
                <option value="">All</option>
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>
            </label>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left">
              <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Slug</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Updated</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {loadState === "loading" &&
                  Array.from({ length: 4 }).map((_, index) => (
                    <tr key={`skeleton-${index}`}>
                      <td colSpan={5} className="px-5 py-4">
                        <div className="h-10 animate-pulse rounded-lg bg-slate-100" />
                      </td>
                    </tr>
                  ))}

                {loadState === "error" && (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center">
                      <p role="alert" className="text-sm text-red-600">
                        Could not load categories.
                      </p>
                      <button
                        type="button"
                        onClick={refresh}
                        className="mt-3 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        Try again
                      </button>
                    </td>
                  </tr>
                )}

                {loadState === "ready" && filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-12 text-center text-sm text-slate-500"
                    >
                      No categories found.
                    </td>
                  </tr>
                )}

                {loadState === "ready" &&
                  filtered.map((category) => (
                    <tr
                      key={category.id}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <CategoryThumb
                            key={category.image}
                            src={category.image}
                            alt={category.name || "Category"}
                          />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900">
                              {category.name || "Untitled category"}
                            </p>
                            {category.description && (
                              <p className="truncate text-xs text-slate-400">
                                {category.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-slate-500">
                        {category.slug || "—"}
                      </td>
                      <td className="px-5 py-3">
                        <StatusBadge
                          status={category.status === 1 ? "ACTIVE" : "INACTIVE"}
                        />
                      </td>
                      <td className="px-5 py-3 text-slate-500">
                        {formatDate(category.updatedAt)}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => openEdit(category)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                            >
                              <Pencil size={13} />
                              Edit
                            </button>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => openDelete(category)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                            >
                              <Trash2 size={13} />
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {formState && (
        <CategoryFormModal
          mode={formState.mode}
          category={formState.category}
          onClose={() => setFormState(null)}
          onSaved={refresh}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-category-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <h2
              id="delete-category-title"
              className="text-lg font-bold text-slate-900"
            >
              Delete category?
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              &ldquo;{deleteTarget.name || "This category"}&rdquo; will be
              removed. Tours that use this category may be affected.
            </p>

            {deleteError && (
              <p
                role="alert"
                className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
              >
                {deleteError}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeDelete}
                disabled={deleting}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
