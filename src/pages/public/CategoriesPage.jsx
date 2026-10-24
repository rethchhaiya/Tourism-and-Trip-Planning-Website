import { useEffect, useState } from "react";
import { fetchCategories } from "../../services/catalogService";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { isActiveCategory, matchesSearchTerm } from "../../utils/catalog";
import Header from "../../components/Header";

const SEARCH_DEBOUNCE_MS = 400;

function CategoryCard({ category, index }) {
  const gradients = [
    "from-indigo-500 to-indigo-600",
    "from-emerald-500 to-emerald-600",
    "from-amber-500 to-amber-600",
    "from-rose-500 to-rose-600",
  ];

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <div
        className={`relative h-40 w-full bg-gradient-to-br ${gradients[index % gradients.length]}`}
      >
        {category.image ? (
          <img
            src={category.image}
            alt={category.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-3xl font-bold text-white/80">
            {category.name?.trim()?.[0] ?? "C"}
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-base font-semibold text-slate-900">
          {category.name}
        </h3>
        {category.description && (
          <p className="mt-1 line-clamp-2 text-sm text-slate-500">
            {category.description}
          </p>
        )}
      </div>
    </article>
  );
}

function CategorySkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="h-40 w-full animate-pulse bg-slate-200" />
      <div className="space-y-3 p-4">
        <div className="h-5 w-2/3 animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
      </div>
    </div>
  );
}

export default function CategoriesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebouncedValue(searchTerm, SEARCH_DEBOUNCE_MS);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError("");
    fetchCategories()
      .then((data) => {
        if (!cancelled) {
          setCategories(data ?? []);
        }
      })
      .catch((caught) => {
        if (!cancelled) {
          setCategories([]);
          setError(
            caught?.message ||
              "Unable to load categories. Please check your connection and try again.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const visible = categories.filter(isActiveCategory).filter((category) =>
    matchesSearchTerm(category.name, debouncedSearch),
  );

  return (
    <>
      <Header />
      <div className="px-4 py-10 md:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            Tour Categories
          </h1>
          <p className="mt-2 text-sm text-slate-500 md:text-base">
            Browse our trips by the kind of experience you are after.
          </p>
        </header>

        <div className="mx-auto mt-8 max-w-xl">
          <input
            type="search"
            id="categories-search"
            name="search"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="h-10 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        {error ? (
          <div className="mt-10 rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center">
            <p role="alert" className="font-medium text-red-600">
              {error}
            </p>
            <button
              type="button"
              onClick={() => setReloadKey((key) => key + 1)}
              className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              Retry
            </button>
          </div>
        ) : isLoading ? (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((key) => (
              <CategorySkeleton key={key} />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
            <p className="text-2xl" aria-hidden="true">
              🗂️
            </p>
            <h2 className="mt-3 text-lg font-semibold text-slate-900">
              No categories found
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {categories.length > 0
                ? "Try a different search term."
                : "There are no active categories yet. Please check back soon."}
            </p>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((category, index) => (
              <CategoryCard
                key={category.id}
                category={category}
                index={index}
              />
            ))}
          </div>
        )}
      </div>
      </div>
    </>
  );
}
