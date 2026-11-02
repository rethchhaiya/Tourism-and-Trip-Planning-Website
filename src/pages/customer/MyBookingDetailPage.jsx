import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Footer from "../../components/Footer";
import Header from "../../components/Header";
import BookingStatusBadge from "../../components/booking/BookingStatusBadge";
import { useAuth } from "../../context/useAuth";
import { PERMISSIONS } from "../../constants/permissions";
import { cancelBooking, getBooking } from "../../services/bookingService";
import { isStaff } from "../../services/roleAdapter";
import { formatCurrency } from "../../utils/currency";
import {
  CANCEL_CONFIRM_MESSAGE,
  isCancellableStatus,
  resolveCancelErrorMessage,
} from "../../utils/bookingDisplay";

function membersLabel(count) {
  if (count === null || count === undefined) {
    return "Members unavailable";
  }
  return `${count} ${count === 1 ? "member" : "members"}`;
}

function priceLabel(value) {
  return formatCurrency(value) || "Price unavailable";
}

function statusLabel(value) {
  const key = String(value ?? "").trim().toLowerCase();
  return key ? key.charAt(0).toUpperCase() + key.slice(1) : "";
}

function LoadingState() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12" data-testid="booking-loading">
      <div className="h-8 w-1/2 animate-pulse rounded bg-slate-200" />
      <div className="mt-4 h-32 animate-pulse rounded-2xl bg-slate-200" />
      <div className="mt-6 h-56 animate-pulse rounded-2xl bg-slate-200" />
    </div>
  );
}

function NotFoundState() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <h1 className="text-xl font-bold text-slate-900">Booking not found</h1>
        <p className="mt-2 text-sm text-slate-500">
          This booking does not exist or is not available to your account.
        </p>
        <Link
          to="/my-bookings"
          className="mt-6 inline-block rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          Back to my bookings
        </Link>
      </div>
    </div>
  );
}

function ErrorState({ onRetry }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div
        role="alert"
        className="rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center"
      >
        <p className="font-medium text-red-700">
          We couldn&apos;t load this booking. Please try again.
        </p>
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

function DetailRow({ label, children }) {
  if (children === null || children === undefined || children === "") {
    return null;
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 py-3 last:border-b-0">
      <dt className="text-sm font-medium text-slate-500">{label}</dt>
      <dd className="text-sm font-semibold text-slate-900">{children}</dd>
    </div>
  );
}

export default function MyBookingDetailPage() {
  const { id } = useParams();
  const { user, can } = useAuth();

  const [state, setState] = useState({
    status: "loading",
    booking: null,
  });
  const [reloadKey, setReloadKey] = useState(0);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");
  const [cancelNotice, setCancelNotice] = useState("");

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading", booking: null });

    getBooking(id)
      .then((booking) => {
        if (cancelled) {
          return;
        }
        setState({
          status: booking ? "ready" : "not-found",
          booking: booking ?? null,
        });
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        setState({
          status: error?.status === 404 ? "not-found" : "error",
          booking: null,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [id, reloadKey]);

  const booking = state.booking;
  const foreignBooking =
    state.status === "ready" &&
    booking &&
    !isStaff(user) &&
    booking.userId !== null &&
    booking.userId !== undefined &&
    user?.id !== null &&
    user?.id !== undefined &&
    String(booking.userId) !== String(user.id);

  const notFound = state.status === "not-found" || foreignBooking;

  const canCancel =
    can(PERMISSIONS.CANCEL_BOOKINGS) &&
    booking &&
    isCancellableStatus(booking.status);

  async function handleCancel() {
    if (!booking) {
      return;
    }

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
    setIsCancelling(true);

    try {
      const updated = await cancelBooking(booking.id);
      setState((previous) => {
        if (previous.status !== "ready" || !previous.booking) {
          return previous;
        }
        return {
          ...previous,
          booking: {
            ...previous.booking,
            status: updated.status || "cancelled",
            schedule: updated.schedule ?? previous.booking.schedule,
          },
        };
      });
      setCancelNotice(
        "This booking has been cancelled. Any refund depends on the tour policy.",
      );
    } catch (error) {
      setCancelError(resolveCancelErrorMessage(error));
    } finally {
      setIsCancelling(false);
    }
  }

  let content;

  if (state.status === "loading") {
    content = <LoadingState />;
  } else if (notFound) {
    content = <NotFoundState />;
  } else if (state.status === "error" || !booking) {
    content = <ErrorState onRetry={() => setReloadKey((key) => key + 1)} />;
  } else {
    const seats =
      booking.schedule?.maxCapacity !== null &&
      booking.schedule?.maxCapacity !== undefined
        ? booking.schedule.currentBooked !== null &&
          booking.schedule.currentBooked !== undefined
          ? `${booking.schedule.currentBooked} / ${booking.schedule.maxCapacity}`
          : `Capacity ${booking.schedule.maxCapacity}`
        : null;

    content = (
      <div className="mx-auto max-w-3xl px-4 py-10 md:px-8">
        <nav
          aria-label="Breadcrumb"
          className="mb-4 flex flex-wrap items-center gap-2 text-sm text-slate-500"
        >
          <Link to="/my-bookings" className="transition hover:text-slate-800">
            My bookings
          </Link>
          <span aria-hidden="true">&gt;</span>
          <span className="font-medium text-slate-800">
            Booking #{booking.id ?? id}
          </span>
        </nav>

        <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <header className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Booking #{booking.id ?? id}
              </p>
              <h1 className="mt-1 text-2xl font-bold text-slate-900">
                {booking.title}
              </h1>
            </div>
            <BookingStatusBadge status={booking.status} />
          </header>

          <dl className="mt-6">
            <DetailRow label="Type">
              {booking.type || "Type unavailable"}
            </DetailRow>
            <DetailRow label="Members">
              {membersLabel(booking.membersCount)}
            </DetailRow>
            <DetailRow label="Total">
              {priceLabel(booking.totalPrice)}
            </DetailRow>
            <DetailRow label="Schedule">{booking.scheduleLabel}</DetailRow>
            <DetailRow label="Seats">{seats}</DetailRow>
            {booking.userName && (
              <DetailRow label="Booked by">{booking.userName}</DetailRow>
            )}
            {booking.paymentStatus && (
              <DetailRow label="Payment status">
                {statusLabel(booking.paymentStatus)}
              </DetailRow>
            )}
            {booking.specialRequests && (
              <DetailRow label="Special requests">
                <span className="font-normal text-slate-700">
                  {booking.specialRequests}
                </span>
              </DetailRow>
            )}
          </dl>

          <section className="mt-8">
            <h2 className="text-lg font-bold text-slate-900">Participants</h2>
            {booking.participants.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {booking.participants.map((participant, index) => {
                  const details = [participant.sex, participant.ageGroup]
                    .filter(Boolean)
                    .join(" · ");
                  return (
                    <li
                      key={`${participant.name}-${index}`}
                      className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
                    >
                      <span className="font-semibold text-slate-800">
                        {participant.name || `Participant ${index + 1}`}
                      </span>
                      {details && (
                        <span className="ml-2 text-slate-500">{details}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-500">
                Participant details are not available.
              </p>
            )}
          </section>

          {booking.status === "pending" && (
            <section className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <h2 className="text-base font-bold text-amber-900">
                Payment pending
              </h2>
              <p className="mt-1 text-sm text-amber-800">
                This booking is waiting for payment.
              </p>
              {/* TODO(no-endpoint): the backend has no endpoint to fetch the
                  QR/payment session for an existing booking, so the payment
                  page can only show details stored in this browser. */}
              <Link
                to={`/payment/${encodeURIComponent(booking.id ?? id)}`}
                className="mt-4 inline-block rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-700"
              >
                Continue payment
              </Link>
            </section>
          )}

          {booking.status === "cancelled" && !cancelNotice && (
            <p className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              This booking is already cancelled.
            </p>
          )}

          {booking.status === "completed" && (
            <p className="mt-6 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              This booking is completed and can no longer be cancelled.
            </p>
          )}

          {cancelError && (
            <p
              role="alert"
              className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
            >
              {cancelError}
            </p>
          )}

          {cancelNotice && (
            <p
              role="status"
              className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
            >
              {cancelNotice}
            </p>
          )}

          {canCancel && (
            <div className="mt-6">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isCancelling}
                className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCancelling ? "Cancelling..." : "Cancel booking"}
              </button>
            </div>
          )}
        </article>
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-[60vh] bg-slate-50">{content}</main>
      <Footer />
    </>
  );
}
