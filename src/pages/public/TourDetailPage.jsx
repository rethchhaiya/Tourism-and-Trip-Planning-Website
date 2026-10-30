import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { fetchTourById } from "../../services/catalogService";
import {
  formatDuration,
  isPublishedStatus,
  isScheduleClosed,
  normalizeTourDetail,
} from "../../utils/catalog";
import { formatCurrency } from "../../utils/currency";

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

function formatDate(value) {
  const time = Date.parse(value ?? "");
  return Number.isFinite(time)
    ? DATE_FORMATTER.format(new Date(time))
    : "Date to be announced";
}

function ImageWithFallback({ src, alt }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        data-testid="tour-detail-image-fallback"
        className="flex h-full w-full items-center justify-center bg-gradient-to-br from-indigo-200 to-indigo-300"
      >
        <span className="text-4xl font-bold text-white/80">
          {(alt?.trim()?.[0] ?? "T").toUpperCase()}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className="h-full w-full object-cover"
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}

function TourPhotoGallery({ images, title }) {
  const [mainImage, ...otherImages] = images;

  return (
    <section
      aria-label="Tour photos"
      className="grid gap-4 lg:grid-cols-[1.65fr_1fr]"
    >
      <div className="h-[320px] overflow-hidden rounded-[28px] bg-slate-100">
        <ImageWithFallback
          src={mainImage?.url}
          alt={`${title} photo 1`}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {otherImages.slice(0, 4).map((image, index) => (
          <div
            key={`${image.url}-${index}`}
            className="h-[152px] overflow-hidden rounded-[22px] bg-slate-100"
          >
            <ImageWithFallback
              src={image.url}
              alt={`${title} photo ${index + 2}`}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function DetailSkeleton() {
  return (
    <div
      data-testid="tour-detail-loading"
      className="mx-auto max-w-6xl px-4 py-10 md:px-8"
    >
      <div className="h-6 w-40 animate-pulse rounded bg-slate-200" />
      <div className="mt-4 h-10 w-2/3 animate-pulse rounded bg-slate-200" />
      <div className="mt-8 grid gap-4 lg:grid-cols-[1.65fr_1fr]">
        <div className="h-[320px] animate-pulse rounded-[28px] bg-slate-200" />
        <div className="grid grid-cols-2 gap-4">
          {[0, 1, 2, 3].map((key) => (
            <div
              key={key}
              className="h-[152px] animate-pulse rounded-[22px] bg-slate-200"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function TourNotFound() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-24 text-center">
      <p className="text-5xl" aria-hidden="true">
        🧭
      </p>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">Tour not found</h1>
      <p className="mt-2 text-sm text-slate-500">
        This tour is unavailable or is no longer published.
      </p>
      <Link
        to="/tours/catalog"
        className="mt-6 inline-block rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
      >
        Browse tours
      </Link>
    </div>
  );
}

function DetailError({ onRetry }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-24">
      <div
        role="alert"
        className="rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center"
      >
        <p className="font-medium text-red-600">
          We couldn't load this tour. Please try again.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

function TourDetailContent({ tour }) {
  const duration = formatDuration(tour);
  const price = tour.displayPrice;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 md:px-8">
      <nav
        aria-label="Breadcrumb"
        className="mb-5 flex flex-wrap items-center gap-2 text-sm text-slate-500"
      >
        <Link to="/" className="transition hover:text-slate-800">
          Home
        </Link>
        <span aria-hidden="true">&gt;</span>
        <Link to="/tours/catalog" className="transition hover:text-slate-800">
          Tours
        </Link>
        <span aria-hidden="true">&gt;</span>
        <span className="font-medium text-slate-800">{tour.title}</span>
      </nav>

      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">
            {tour.title}
          </h1>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-500">
            {tour.destination?.name && <span>{tour.destination.name}</span>}
            {tour.category?.name && <span>{tour.category.name}</span>}
            {duration && <span>{duration}</span>}
          </div>
        </div>
        <p className="text-2xl font-bold text-slate-900">
          {price != null ? formatCurrency(price) : "Price on request"}
          {price != null && (
            <span className="ml-1 text-xs font-normal text-slate-400">
              / person
            </span>
          )}
        </p>
      </header>

      <div className="mt-8">
        <TourPhotoGallery images={tour.images} title={tour.title} />
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.65fr_1fr]">
        <div className="space-y-10">
          {tour.destination?.description && (
            <section>
              <h2 className="text-xl font-bold text-slate-900">
                About {tour.destination.name}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {tour.destination.description}
              </p>
            </section>
          )}

          <section className="grid gap-6 sm:grid-cols-2">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                What's included
              </h2>
              {tour.inclusions.length > 0 ? (
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  {tour.inclusions.map((item, index) => (
                    <li
                      key={`${item.description}-${index}`}
                      className="flex gap-2"
                    >
                      <span aria-hidden="true" className="text-emerald-500">
                        ✓
                      </span>
                      <span>{item.description}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-slate-400">
                  No inclusions listed.
                </p>
              )}
            </div>

            <div>
              <h2 className="text-lg font-bold text-slate-900">Not included</h2>
              {tour.exclusions.length > 0 ? (
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  {tour.exclusions.map((item, index) => (
                    <li
                      key={`${item.description}-${index}`}
                      className="flex gap-2"
                    >
                      <span aria-hidden="true" className="text-rose-400">
                        ✕
                      </span>
                      <span>{item.description}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-slate-400">
                  No exclusions listed.
                </p>
              )}
            </div>
          </section>

          {tour.itinerary.length > 0 && (
            <section>
              {/* TODO(undocumented): tourItinerary is not in the API document; rendered read-only. */}
              <h2 className="text-xl font-bold text-slate-900">Itinerary</h2>
              <ol className="mt-4 space-y-4">
                {tour.itinerary.map((day, index) => (
                  <li
                    key={`${day.dayNumber ?? "day"}-${index}`}
                    className="rounded-xl border border-slate-200 bg-white p-4"
                  >
                    <p className="font-semibold text-slate-900">
                      Day {day.dayNumber ?? index + 1}
                      {day.title ? `: ${day.title}` : ""}
                    </p>
                    {day.description && (
                      <p className="mt-1 text-sm leading-relaxed text-slate-600">
                        {day.description}
                      </p>
                    )}
                    {day.mealsIncluded && (
                      <p className="mt-1 text-xs font-medium text-slate-500">
                        Meals: {day.mealsIncluded}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            </section>
          )}

          <section>
            <h2 className="text-xl font-bold text-slate-900">
              Departure dates
            </h2>
            {tour.schedules.length === 0 ? (
              <p className="mt-3 text-sm text-slate-400">
                No departure dates available.
              </p>
            ) : (
              <ul className="mt-4 space-y-3">
                {tour.schedules.map((schedule, index) => {
                  const closed = isScheduleClosed(schedule);
                  const soldOut =
                    schedule.seatsLeft != null && schedule.seatsLeft <= 0;

                  return (
                    <li
                      key={schedule.id ?? index}
                      className="rounded-xl border border-slate-200 bg-white p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {formatDate(schedule.startDateTime)} —{" "}
                            {formatDate(schedule.endDateTime)}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {soldOut
                              ? "Sold out"
                              : schedule.seatsLeft != null
                                ? `${schedule.seatsLeft} seats left`
                                : "Seats unavailable"}
                          </p>
                          {schedule.priceOverride != null && (
                            <p className="mt-1 text-sm font-medium text-slate-700">
                              Departure price:{" "}
                              {formatCurrency(schedule.priceOverride)}
                            </p>
                          )}
                          {schedule.notes && (
                            <p className="mt-1 text-xs text-slate-500">
                              {schedule.notes}
                            </p>
                          )}
                        </div>
                        {closed && (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                            Closed
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          {tour.category && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Category
              </h2>
              <p className="mt-2 text-base font-semibold text-slate-900">
                {tour.category.name}
              </p>
              {tour.category.description && (
                <p className="mt-1 text-sm text-slate-500">
                  {tour.category.description}
                </p>
              )}
            </div>
          )}

          {tour.destination && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Destination
              </h2>
              <p className="mt-2 text-base font-semibold text-slate-900">
                {tour.destination.name}
              </p>
              {tour.destination.description && (
                <p className="mt-1 text-sm text-slate-500">
                  {tour.destination.description}
                </p>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export default function TourDetailPage() {
  const { id } = useParams();
  const [status, setStatus] = useState("loading");
  const [tour, setTour] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [completedRequestKey, setCompletedRequestKey] = useState("");
  const requestKey = `${id}|${reloadKey}`;
  const isLoading = completedRequestKey !== requestKey;

  useEffect(() => {
    let cancelled = false;

    fetchTourById(id)
      .then((raw) => {
        if (cancelled) {
          return;
        }
        if (!raw) {
          setStatus("not-found");
          setCompletedRequestKey(requestKey);
          return;
        }
        const detail = normalizeTourDetail(raw);
        if (!isPublishedStatus(detail.status)) {
          setStatus("not-found");
          setCompletedRequestKey(requestKey);
          return;
        }
        setTour(detail);
        setStatus("ready");
        setCompletedRequestKey(requestKey);
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        // Never surface the API message: a 404 body leaks backend internals.
        setStatus(error?.status === 404 ? "not-found" : "error");
        setCompletedRequestKey(requestKey);
      });

    return () => {
      cancelled = true;
    };
  }, [id, reloadKey, requestKey]);

  return (
    <>
      <Header />
      <main className="min-h-[60vh] bg-slate-50">
        {isLoading ? (
          <DetailSkeleton />
        ) : status === "not-found" ? (
          <TourNotFound />
        ) : status === "error" ? (
          <DetailError onRetry={() => setReloadKey((key) => key + 1)} />
        ) : tour ? (
          <TourDetailContent tour={tour} />
        ) : null}
      </main>
      <Footer />
    </>
  );
}
