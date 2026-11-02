import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Footer from "../../components/Footer";
import Header from "../../components/Header";
import BookingStatusBadge from "../../components/booking/BookingStatusBadge";
import { useAuth } from "../../context/useAuth";
import { PERMISSIONS } from "../../constants/permissions";
import { useReferenceData } from "../../hooks/useReferenceData";
import { isAdmin, isTourManager } from "../../services/roleAdapter";
import {
  cancelBooking,
  listBookings,
} from "../../services/bookingService";
import { formatCurrency } from "../../utils/currency";
import {
  CANCEL_CONFIRM_MESSAGE,
  isCancellableStatus,
  resolveCancelErrorMessage,
} from "../../utils/bookingDisplay";

const REFERENCE_LISTS = ["booking_statuses", "booking_types"];
const PER_PAGE = 10;

function toOptions(list) {
  if (!Array.isArray(list)) {
    return [];
  }

  return list
    .map((item) => {
      if (typeof item === "string") {
        return { value: item, label: item };
      }
      if (!item || typeof item !== "object") {
        return null;
      }
      const value = item.value ?? item.name ?? item.id;
      if (value === null || value === undefined || value === "") {
        return null;
      }
      return {
        value: String(value),
        label: String(item.label ?? item.name ?? value),
      };
    })
    .filter(Boolean);
}

function readPage(searchParams) {
  const parsed = Number.parseInt(searchParams.get("page") ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function membersLabel(count) {
  if (count === null || count === undefined) {
    return "Members unavailable";
  }
  return `${count} ${count === 1 ? "member" : "members"}`;
}

function priceLabel(value) {
  return formatCurrency(value) || "Price unavailable";
}

function LoadingState() {
  return (
    <div data-testid="bookings-loading" className="space-y-3">
      {[0, 1, 2].map((row) => (
        <div
          key={row}
          className="h-24 animate-pulse rounded-2xl bg-slate-200"
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

function ErrorState({ onRetry }) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center"
    >
      <p className="font-medium text-red-700">
        We couldn&apos;t load your bookings. Please try again.
      </p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
      >
        Retry
      </button>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center">
      <h2 className="text-lg font-bold text-slate-900">No bookings yet</h2>
      <p className="mt-2 text-sm text-slate-500">
        When you book a tour it will show up here.
      </p>
      <Link
        to="/tours"
        className="mt-6 inline-block rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
      >
        Browse tours
      </Link>
    </div>
  );
}

export default function MyBookingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, can } = useAuth();
  const reference = useReferenceData(REFERENCE_LISTS);

  const page = readPage(searchParams);
  const status = searchParams.get("status") ?? "";
  const type = searchParams.get("type") ?? "";

  const [result, setResult] = useState(null);
  const [loadState, setLoadState] = useState("loading");
  const [reloadKey, setReloadKey] = useState(0);
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelError, setCancelError] = useState("");
  const [cancelNotice, setCancelNotice] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoadState("loading");
    setResult(null);

    listBookings({ page, perPage: PER_PAGE, status, type })
      .then((next) => {
        if (cancelled) {
          return;
        }
        setResult(next);
        setLoadState("ready");
      })
      .catch(() => {
        if (cancelled) {
          return;
        }
        setResult(null);
        setLoadState("error");
      });

    return () => {
      cancelled = true;
    };
  }, [page, status, type, reloadKey]);

  const statusOptions = toOptions(reference.data.booking_statuses);
  const typeOptions = toOptions(reference.data.booking_types);

  const canCancel = can(PERMISSIONS.CANCEL_BOOKINGS);
  const staffViewer = isAdmin(user) || isTourManager(user);

  const bookings = result?.bookings ?? [];
  const hasKnownOwners = bookings.some(
    (booking) => booking.userId !== null && booking.userId !== undefined,
  );
  const ownershipFiltered =
    staffViewer &&
    hasKnownOwners &&
    user?.id !== null &&
    user?.id !== undefined;

  const visibleBookings = ownershipFiltered
    ? bookings.filter(
        (booking) =>
          booking.userId !== null &&
          booking.userId !== undefined &&
          String(booking.userId) === String(user.id),
      )
    : bookings;

  const lastPage = result?.lastPage ?? 1;
  const currentPage = result?.currentPage ?? page;

  function updateFilter(key, value) {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    next.delete("page");
    setSearchParams(next);
  }

  function goToPage(nextPage) {
    const next = new URLSearchParams(searchParams);
    if (nextPage <= 1) {
      next.delete("page");
    } else {
      next.set("page", String(nextPage));
    }
    setSearchParams(next);
  }

  async function handleCancel(booking) {
    if (!isCancellableStatus(booking.status)) {
      setCancelError(
        booking.status === "cancelled"
          ? "This booking is already cancelled."
          : "This booking is completed and can no longer be cancelled.",
      );
      return;
    }

    if (!window.confirm(CANCEL_CONFIRM_MESSAGE)) {
      return;
    }

    // TODO(refund-policy): the backend does not expose a refund policy or
    // refund amount, so the UI only confirms the cancellation for now.
    setCancelError("");
    setCancelNotice("");
    setCancellingId(booking.id);

    try {
      const updated = await cancelBooking(booking.id);
      setResult((previous) => {
        if (!previous) {
          return previous;
        }
        return {
          ...previous,
          bookings: previous.bookings.map((item) =>
            String(item.id) === String(booking.id)
              ? { ...item, status: updated.status || "cancelled" }
              : item,
          ),
        };
      });
      setCancelNotice(
        "This booking has been cancelled. Any refund depends on the tour policy.",
      );
    } catch (error) {
      setCancelError(resolveCancelErrorMessage(error));
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-[60vh] bg-slate-50">
        <div className="mx-auto max-w-5xl px-4 py-10 md:px-8">
          <header className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">My bookings</h1>
            <p className="mt-1 text-sm text-slate-500">
              Review your bookings, continue a pending payment, or cancel a
              booking.
            </p>
          </header>

          <div className="mb-5 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-600">
              Status
              <select
                aria-label="Filter by status"
                value={status}
                onChange={(event) =>
                  updateFilter("status", event.target.value)
                }
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">All statuses</option>
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-medium text-slate-600">
              Type
              <select
                aria-label="Filter by type"
                value={type}
                onChange={(event) => updateFilter("type", event.target.value)}
                className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="">All types</option>
                {typeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {cancelError && (
            <p
              role="alert"
              className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
            >
              {cancelError}
            </p>
          )}

          {cancelNotice && (
            <p
              role="status"
              className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
            >
              {cancelNotice}
            </p>
          )}

          {loadState === "loading" && <LoadingState />}

          {loadState === "error" && (
            <ErrorState onRetry={() => setReloadKey((key) => key + 1)} />
          )}

          {loadState === "ready" && visibleBookings.length === 0 && (
            <EmptyState />
          )}

          {loadState === "ready" && visibleBookings.length > 0 && (
            <div className="space-y-3">
              {visibleBookings.map((booking) => {
                const detailPath =
                  booking.id !== null && booking.id !== undefined
                    ? `/my-bookings/${encodeURIComponent(booking.id)}`
                    : null;

                return (
                  <article
                    key={booking.id ?? `${booking.title}-${booking.scheduleId}`}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        {detailPath ? (
                          <Link
                            to={detailPath}
                            className="text-lg font-bold text-slate-900 transition hover:text-indigo-700"
                          >
                            {booking.title}
                          </Link>
                        ) : (
                          <span className="text-lg font-bold text-slate-900">
                            {booking.title}
                          </span>
                        )}
                        <p className="mt-1 text-sm text-slate-500">
                          {booking.scheduleLabel}
                        </p>
                      </div>
                      <BookingStatusBadge status={booking.status} />
                    </div>

                    <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Type
                        </dt>
                        <dd className="mt-0.5 font-medium text-slate-700">
                          {booking.type || "Type unavailable"}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Members
                        </dt>
                        <dd className="mt-0.5 font-medium text-slate-700">
                          {membersLabel(booking.membersCount)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                          Total
                        </dt>
                        <dd className="mt-0.5 font-semibold text-slate-900">
                          {priceLabel(booking.totalPrice)}
                        </dd>
                      </div>
                    </dl>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      {detailPath && (
                        <Link
                          to={detailPath}
                          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                        >
                          View details
                        </Link>
                      )}

                      {booking.status === "pending" && detailPath && (
                        <Link
                          to={`/payment/${encodeURIComponent(booking.id)}`}
                          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
                        >
                          Continue payment
                        </Link>
                      )}

                      {canCancel && isCancellableStatus(booking.status) && (
                        <button
                          type="button"
                          onClick={() => handleCancel(booking)}
                          disabled={String(cancellingId) === String(booking.id)}
                          className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {String(cancellingId) === String(booking.id)
                            ? "Cancelling..."
                            : "Cancel booking"}
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {loadState === "ready" && result && result.total > 0 && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-500">
                Page {currentPage} of {lastPage}
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage >= lastPage}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
