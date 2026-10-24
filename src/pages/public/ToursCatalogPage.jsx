import { useEffect, useState } from "react";
import {
  fetchCategories,
  fetchTours,
} from "../../services/catalogService";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import {
  formatCurrency,
} from "../../utils/currency";
import {
  formatDuration,
  isActiveCategory,
  isPublishedTour,
  matchesSearchTerm,
  primaryTourImage,
  tourCategoryIds,
} from "../../utils/catalog";
import Header from "../../components/Header";

const SEARCH_DEBOUNCE_MS = 400;

function placeholderGradient(index) {
  const gradients = [
    "from-indigo-200 to-indigo-300",
    "from-emerald-200 to-emerald-300",
    "from-amber-200 to-amber-300",
    "from-rose-200 to-rose-300",
  ];
  return gradients[index % gradients.length];
}

function TourCard({ tour, index }) {
  const image = primaryTourImage(tour);
  const price = tour.price_override ?? tour.base_price;
  const duration = formatDuration(tour);

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="relative h-44 w-full overflow-hidden bg-slate-100">
        {image ? (
          <img
            src={image}
            alt={tour.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div
            className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${placeholderGradient(index)}`}
          >
            <span className="text-4xl font-bold text-white/80">
              {(tour.title?.trim()?.[0] ?? "T").toUpperCase()}
            </span>
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="line-clamp-2 text-base font-semibold text-slate-900">
          {tour.title}
        </h3>
        {duration && (
          <p className="flex items-center gap-1.5 text-sm text-slate-500">
            <span aria-hidden="true">🕓</span>
            {duration}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between pt-2">
          {price ? (
            <span className="text-lg font-bold text-slate-900">
              {formatCurrency(price)}
            </span>
          ) : (
            <span className="text-sm text-slate-400">Price on request</span>
          )}
        </div>
      </div>
    </article>
  );
}

function TourCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="h-44 w-full animate-pulse bg-slate-200" />
      <div className="space-y-3 p-4">
        <div className="h-5 w-3/4 animate-pulse rounded bg-slate-200" />
        <div className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
        <div className="h-6 w-1/3 animate-pulse rounded bg-slate-200" />
      </div>
    </div>
  );
}

function emptyMeta(lastPage) {
  return { current_page: 1, last_page: Math.max(1, Number(lastPage) || 1) };
}

function Pagination({ meta, page, onPageChange }) {
  const info = meta ?? emptyMeta(1);
  const lastPage = Math.max(1, Number(info.last_page) || 1);
  if (lastPage <= 1) {
    return null;
  }

  const windowStart = Math.max(1, page - 2);
  const windowEnd = Math.min(lastPage, windowStart + 4);
  const pages = [];
  for (let number = windowStart; number <= windowEnd; number += 1) {
    pages.push(number);
  }

  const buttonClass = (active) =>
    `rounded-lg px-3 py-1.5 text-sm font-medium transition ${
      active
        ? "bg-indigo-600 text-white shadow-sm"
        : "bg-white text-slate-600 hover:bg-slate-100"
    }`;

  return (
    <nav
      aria-label="Tours pagination"
      className="mt-8 flex flex-wrap items-center justify-center gap-2"
    >
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Previous
      </button>
      {pages.map((number) => (
        <button
          key={number}
          type="button"
          onClick={() => onPageChange(number)}
          aria-current={number === page ? "page" : undefined}
          className={buttonClass(number === page)}
        >
          {number}
        </button>
      ))}
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= lastPage}
        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next
      </button>
    </nav>
  );
}

export default function ToursCatalogPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebouncedValue(searchTerm, SEARCH_DEBOUNCE_MS);
  const [categoryId, setCategoryId] = useState("");
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState([]);
  const [tours, setTours] = useState([]);
  const [meta, setMeta] = useState(null);
  const [total, setTotal] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setIsCategoriesLoading(true);
    fetchCategories()
      .then((data) => {
        if (!cancelled) {
          setCategories((data ?? []).filter(isActiveCategory));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCategories([]);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsCategoriesLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError("");
    fetchTours({ page, search: debouncedSearch, categoryId })
      .then(({ tours: rows, meta: nextMeta }) => {
        if (cancelled) {
          return;
        }
        const visible = rows.filter(isPublishedTour).filter((tour) => {
          if (!matchesSearchTerm(tour.title, debouncedSearch)) {
            return false;
          }
          const categoryIds = tourCategoryIds(tour);
          if (categoryId && categoryIds.length > 0) {
            return categoryIds.includes(Number(categoryId));
          }
          return true;
        });
        setTours(visible);
        setMeta(nextMeta);
        setTotal(nextMeta?.total ?? null);
      })
      .catch((caught) => {
        if (!cancelled) {
          setTours([]);
          setMeta(null);
          setTotal(null);
          setError(
            caught?.message ||
              "Unable to load tours. Please check your connection and try again.",
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
  }, [page, debouncedSearch, categoryId, reloadKey]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, categoryId]);

  function handleRetry() {
    setReloadKey((key) => key + 1);
  }

  const css = {
    input:
      "h-10 w-full rounded-lg border border-slate-300 bg-white px-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20",
    chip: (active) =>
      `rounded-full border px-4 py-1.5 text-sm font-medium transition ${
        active
          ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
          : "border-slate-300 bg-white text-slate-600 hover:border-indigo-300 hover:text-indigo-600"
      }`,
  };

  return (
    <>
      <Header />
      <div className="px-4 py-10 md:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            Discover Our Tours
          </h1>
          <p className="mt-2 text-sm text-slate-500 md:text-base">
            Handpicked experiences, from cultural trips to outdoor adventures.
          </p>
        </header>

        <div className="mt-8 space-y-4">
          <input
            type="search"
            id="tours-search"
            name="search"
            placeholder="Search tours by title..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className={css.input}
          />

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCategoryId("")}
              className={css.chip(categoryId === "")}
            >
              All categories
            </button>
            {isCategoriesLoading
              ? null
              : categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() =>
                      setCategoryId((current) =>
                        current === String(category.id)
                          ? ""
                          : String(category.id),
                      )
                    }
                    className={css.chip(categoryId === String(category.id))}
                  >
                    {category.name}
                  </button>
                ))}
          </div>
        </div>

        {error ? (
          <div className="mt-10 rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center">
            <p role="alert" className="font-medium text-red-600">
              {error}
            </p>
            <button
              type="button"
              onClick={handleRetry}
              className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              Retry
            </button>
          </div>
        ) : isLoading ? (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((key) => (
              <TourCardSkeleton key={key} />
            ))}
          </div>
        ) : tours.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
            <p className="text-2xl" aria-hidden="true">
              🧭
            </p>
            <h2 className="mt-3 text-lg font-semibold text-slate-900">
              No tours found
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Try a different search term or clear the category filter.
            </p>
            {(searchTerm || categoryId) && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setCategoryId("");
                }}
                className="mt-5 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="mt-8 text-sm text-slate-500">
              {total != null ? `${total} tours` : `${tours.length} tours`}
            </p>
            <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {tours.map((tour, index) => (
                <TourCard key={tour.id} tour={tour} index={index} />
              ))}
            </div>
            <Pagination meta={meta} page={page} onPageChange={setPage} />
          </>
        )}
      </div>
      </div>
    </>
  );
}
