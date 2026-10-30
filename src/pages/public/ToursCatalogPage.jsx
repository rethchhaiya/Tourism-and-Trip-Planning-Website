import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
  normalizeTour,
} from "../../utils/catalog";
import Header from "../../components/Header";

const SEARCH_DEBOUNCE_MS = 400;
// List responses do not include category data, so client-side category
// filtering is not possible. Flip this on once the API supports it.
const CATEGORY_FILTER_ENABLED = false;

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
  const [imageFailed, setImageFailed] = useState(false);
  const image = tour.primaryImage;
  const price = tour.displayPrice;
  const duration = formatDuration(tour);
  const showImage = Boolean(image) && !imageFailed;
  const href = tour.id != null ? `/tours/${tour.id}` : "/tours/catalog";

  return (
    <Link
      to={href}
      className="block rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
    >
      <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
        <div className="relative h-44 w-full overflow-hidden bg-slate-100">
          {showImage ? (
            <img
              src={image}
              alt={tour.title}
              className="h-full w-full object-cover"
              loading="lazy"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div
              data-testid="tour-image-fallback"
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
            {price != null ? (
              <span className="text-lg font-bold text-slate-900">
                {formatCurrency(price)}
              </span>
            ) : (
              <span className="text-sm text-slate-400">Price on request</span>
            )}
          </div>
        </div>
      </article>
    </Link>
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
  const currentPage = Math.min(
    lastPage,
    Math.max(1, Number(info.current_page) || page),
  );
  if (lastPage <= 1) {
    return null;
  }

  const windowStart = Math.max(1, currentPage - 2);
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
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Previous
      </button>
      {pages.map((number) => (
        <button
          key={number}
          type="button"
          onClick={() => onPageChange(number)}
          aria-current={number === currentPage ? "page" : undefined}
          className={buttonClass(number === currentPage)}
        >
          {number}
        </button>
      ))}
      <button
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= lastPage}
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
  const [isCategoriesLoading, setIsCategoriesLoading] = useState(
    CATEGORY_FILTER_ENABLED,
  );
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [completedRequestKey, setCompletedRequestKey] = useState("");
  const requestKey = `${page}|${debouncedSearch}|${categoryId}|${reloadKey}`;
  const isLoading = completedRequestKey !== requestKey;

  useEffect(() => {
    if (!CATEGORY_FILTER_ENABLED) {
      return undefined;
    }
    let cancelled = false;
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
    fetchTours({
      page,
      search: debouncedSearch,
      categoryId: CATEGORY_FILTER_ENABLED ? categoryId : "",
    })
      .then(({ tours: rows, meta: nextMeta }) => {
        if (cancelled) {
          return;
        }
        const visible = rows
          .map(normalizeTour)
          .filter(isPublishedTour)
          .filter((tour) => matchesSearchTerm(tour.title, debouncedSearch));
        setError("");
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
          setCompletedRequestKey(requestKey);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [page, debouncedSearch, categoryId, reloadKey, requestKey]);

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
            onChange={(event) => {
              setSearchTerm(event.target.value);
              setPage(1);
            }}
            className={css.input}
          />

          {CATEGORY_FILTER_ENABLED && (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setCategoryId("");
                  setPage(1);
                }}
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
                      onClick={() => {
                        setCategoryId((current) =>
                          current === String(category.id)
                            ? ""
                            : String(category.id),
                        );
                        setPage(1);
                      }}
                      className={css.chip(categoryId === String(category.id))}
                    >
                      {category.name}
                    </button>
                  ))}
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((key) => (
              <TourCardSkeleton key={key} />
            ))}
          </div>
        ) : error ? (
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
        ) : tours.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
            <p className="text-2xl" aria-hidden="true">
              🧭
            </p>
            <h2 className="mt-3 text-lg font-semibold text-slate-900">
              No tours found
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Try a different search term.
            </p>
            {(searchTerm || (CATEGORY_FILTER_ENABLED && categoryId)) && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm("");
                  setCategoryId("");
                  setPage(1);
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
