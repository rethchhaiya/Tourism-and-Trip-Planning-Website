import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useAuth } from "../../context/useAuth";
import {
  checkPaymentStatus,
  mapPaymentStatus,
} from "../../services/paymentService";
import {
  clearBookingResult,
  getBookingResult,
} from "../../utils/bookingStorage";
import { formatCurrency } from "../../utils/currency";

const POLL_INTERVAL_MS = 5000;
const MAX_CHECKS = 60;
const MAX_CONSECUTIVE_FAILURES = 3;
const MAX_CONSECUTIVE_UNKNOWNS = 10;
const QR_IMAGE_PREFIX = "data:image/png;base64,";
const DEEPLINK_PREFIXES = ["abamobilebank://", "https://"];
const STORE_LINK_PREFIX = "https://";

const PAYMENT_METHOD_LABELS = {
  aba_pay: "ABA Pay",
  bank_transfer: "Bank Transfer",
  cash: "Cash",
};

const STATUS_LABELS = {
  pending: "Pending",
  paid: "Paid",
  failed: "Failed",
  refunded: "Refunded",
};

const STATUS_BADGE_CLASSES = {
  pending: "border-amber-200 bg-amber-50 text-amber-800",
  paid: "border-emerald-200 bg-emerald-50 text-emerald-800",
  failed: "border-red-200 bg-red-50 text-red-700",
  refunded: "border-slate-200 bg-slate-100 text-slate-700",
};

function isDocumentHidden() {
  return typeof document !== "undefined" && document.hidden;
}

function isMobileDevice() {
  if (typeof window === "undefined") {
    return false;
  }

  if (typeof window.matchMedia === "function") {
    try {
      return window.matchMedia("(max-width: 767px)").matches;
    } catch {
      // Fall through to the user agent check.
    }
  }

  if (typeof navigator === "undefined") {
    return false;
  }

  return /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent ?? "");
}

function paymentMethodLabel(value) {
  if (!value) {
    return "Not specified";
  }

  const key = String(value).trim().toLowerCase();
  if (PAYMENT_METHOD_LABELS[key]) {
    return PAYMENT_METHOD_LABELS[key];
  }

  return key
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getTourLink(booking) {
  const tourId =
    booking?.tour?.id ??
    booking?.tour_id ??
    booking?.tour_schedule?.tour?.id ??
    booking?.tour_schedule?.tour_id;

  return tourId != null ? `/tours/${encodeURIComponent(tourId)}` : "/tours/catalog";
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
        STATUS_BADGE_CLASSES[status] ?? STATUS_BADGE_CLASSES.pending
      }`}
    >
      {STATUS_LABELS[status] ?? STATUS_LABELS.pending}
    </span>
  );
}

function NotAvailable({ bookingId }) {
  // TODO(no-endpoint): the backend has no endpoint to fetch the QR/payment
  // session for an existing booking, so this page can only show details that
  // were stored in the browser when the booking was created.
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Payment</h1>
        <p className="mt-3 text-base font-semibold text-amber-900">
          Payment details are not available here
        </p>
        <p className="mt-2 text-sm text-amber-800">
          Booking #{bookingId ?? "unknown"}. Open the booking in the same browser
          tab where it was made.
        </p>
        <Link
          to="/tours/catalog"
          className="mt-6 inline-block rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          Browse tours
        </Link>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  const { bookingId } = useParams();
  const { user } = useAuth();
  const [stored] = useState(() => getBookingResult(bookingId));

  const booking = stored?.booking ?? null;
  const payment = stored?.payment ?? null;
  const gateway = stored?.gateway ?? null;
  const gatewayResponse = gateway?.response ?? null;
  const tranId = gateway?.tran_id != null ? String(gateway.tran_id) : "";

  const storedUserId = booking?.user?.id;
  const currentUserId = user?.id;
  const ownsBooking =
    storedUserId != null &&
    currentUserId != null &&
    String(storedUserId) === String(currentUserId);
  const available = Boolean(stored && booking && ownsBooking);

  const [status, setStatus] = useState(
    () => mapPaymentStatus(payment ?? {}).status,
  );
  const [isChecking, setIsChecking] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [stopped, setStopped] = useState(false);
  const manualCheckRef = useRef(() => {});

  const canPoll =
    available && status === "pending" && !timedOut && Boolean(tranId);

  useEffect(() => {
    if (!canPoll) {
      return undefined;
    }

    let cancelled = false;
    let timer = null;
    let checking = false;
    let halted = false;
    let checks = 0;
    let failures = 0;
    let unknowns = 0;

    function schedule(delay) {
      if (cancelled || halted) {
        return;
      }
      clearTimeout(timer);
      timer = setTimeout(run, delay);
    }

    function stopForManualCheck() {
      halted = true;
      setStopped(true);
    }

    async function run(manual = false) {
      if (cancelled || checking || (halted && !manual)) {
        return;
      }

      if (!manual && isDocumentHidden()) {
        schedule(POLL_INTERVAL_MS);
        return;
      }

      if (checks >= MAX_CHECKS) {
        setTimedOut(true);
        return;
      }

      checking = true;
      checks += 1;
      setIsChecking(true);

      try {
        const result = await checkPaymentStatus(tranId);
        if (cancelled) {
          return;
        }

        const nextStatus =
          typeof result === "string" ? result : result?.status ?? "pending";
        const unknown =
          Boolean(result) &&
          typeof result === "object" &&
          result.unknown === true;

        if (nextStatus === "error") {
          failures += 1;

          if (failures >= MAX_CONSECUTIVE_FAILURES) {
            stopForManualCheck();
            return;
          }

          if (checks >= MAX_CHECKS) {
            setTimedOut(true);
          } else {
            schedule(POLL_INTERVAL_MS);
          }
          return;
        }

        failures = 0;
        setStatus(nextStatus);

        if (unknown) {
          unknowns += 1;

          if (unknowns >= MAX_CONSECUTIVE_UNKNOWNS) {
            stopForManualCheck();
            return;
          }
        } else {
          unknowns = 0;
        }

        if (nextStatus === "pending") {
          if (checks >= MAX_CHECKS) {
            setTimedOut(true);
          } else {
            schedule(POLL_INTERVAL_MS);
          }
        }
      } catch {
        if (cancelled) {
          return;
        }

        failures += 1;

        if (failures >= MAX_CONSECUTIVE_FAILURES) {
          stopForManualCheck();
          return;
        }

        if (checks >= MAX_CHECKS) {
          setTimedOut(true);
        } else {
          schedule(POLL_INTERVAL_MS);
        }
      } finally {
        if (!cancelled) {
          checking = false;
          setIsChecking(false);
        }
      }
    }

    manualCheckRef.current = () => {
      if (cancelled) {
        return;
      }
      halted = false;
      failures = 0;
      unknowns = 0;
      setStopped(false);
      clearTimeout(timer);
      run(true);
    };

    schedule(POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      manualCheckRef.current = () => {};
    };
  }, [canPoll, tranId]);

  useEffect(() => {
    if (available && status === "paid") {
      clearBookingResult(bookingId);
    }
  }, [available, bookingId, status]);

  const handleCheckAgain = useCallback(() => {
    manualCheckRef.current();
  }, []);

  if (!available) {
    return (
      <>
        <Header />
        <main className="min-h-[60vh] bg-slate-50">
          <NotAvailable bookingId={bookingId} />
        </main>
        <Footer />
      </>
    );
  }

  const amount = payment?.amount ?? booking.total_price;
  const formattedAmount = formatCurrency(amount);
  const response = gatewayResponse ?? {};
  const qrImage = response.qrImage;
  const hasSafeQr =
    typeof qrImage === "string" && qrImage.startsWith(QR_IMAGE_PREFIX);
  const deeplink = response.abapay_deeplink;
  const safeDeeplink =
    typeof deeplink === "string" &&
    DEEPLINK_PREFIXES.some((prefix) => deeplink.startsWith(prefix))
      ? deeplink
      : null;
  const appStore = response.app_store;
  const safeAppStore =
    typeof appStore === "string" && appStore.startsWith(STORE_LINK_PREFIX)
      ? appStore
      : null;
  const playStore = response.play_store;
  const safePlayStore =
    typeof playStore === "string" && playStore.startsWith(STORE_LINK_PREFIX)
      ? playStore
      : null;
  const mobileDevice = isMobileDevice();
  const tourLink = getTourLink(booking);
  const showPendingWithoutQr = status === "pending" && !hasSafeQr;

  return (
    <>
      <Header />
      <main className="min-h-[60vh] bg-slate-50">
        <div className="mx-auto max-w-3xl px-4 py-12 md:px-8">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Payment</h1>
                <p className="mt-1 text-sm text-slate-500">
                  Booking confirmation
                </p>
              </div>
              <StatusBadge status={status} />
            </div>

            <dl className="mt-6 space-y-4 text-sm">
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
                <dt className="font-medium text-slate-500">Booking ID</dt>
                <dd className="font-semibold text-slate-900">
                  #{booking.id ?? bookingId}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
                <dt className="font-medium text-slate-500">Amount</dt>
                <dd className="font-semibold text-slate-900">
                  {formattedAmount || "Amount unavailable"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
                <dt className="font-medium text-slate-500">Payment method</dt>
                <dd className="font-semibold text-slate-900">
                  {paymentMethodLabel(payment?.payment_method)}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-4">
                <dt className="font-medium text-slate-500">Status</dt>
                <dd>
                  <StatusBadge status={status} />
                </dd>
              </div>
            </dl>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleCheckAgain}
                disabled={
                  isChecking || status !== "pending" || timedOut || !tranId
                }
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Check again
              </button>
              {isChecking && (
                <span className="text-sm text-slate-500">Checking payment...</span>
              )}
            </div>

            {status === "pending" && stopped && (
              <p
                role="alert"
                className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900"
              >
                We could not check the payment right now
              </p>
            )}

            {status === "pending" && timedOut && (
              <div
                role="alert"
                className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
              >
                <p className="font-medium">
                  We could not confirm this payment in time.
                </p>
                <p className="mt-1">
                  If you already paid, keep your receipt and check with the tour
                  provider.
                </p>
                <Link
                  to={tourLink}
                  className="mt-3 inline-block font-semibold text-amber-900 underline"
                >
                  Back to tour
                </Link>
              </div>
            )}

            {status === "paid" && (
              <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
                <h2 className="text-lg font-bold text-emerald-900">
                  Payment confirmed
                </h2>
                <p className="mt-2 text-sm text-emerald-800">
                  Your payment was received and your booking is confirmed.
                </p>
                {/* TODO(no-endpoint): the backend has no endpoint to refresh
                    the payment/QR details of an existing booking. */}
                <Link
                  to="/my-bookings"
                  className="mt-4 inline-block rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800"
                >
                  View my bookings
                </Link>
              </div>
            )}

            {status === "failed" && (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6">
                <h2 className="text-lg font-bold text-red-800">
                  Payment failed
                </h2>
                <p className="mt-2 text-sm text-red-700">
                  This payment did not go through. Please try again from the tour
                  page.
                </p>
                <Link
                  to={tourLink}
                  className="mt-4 inline-block rounded-lg bg-red-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-800"
                >
                  Back to tour
                </Link>
              </div>
            )}

            {status === "refunded" && (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <h2 className="text-lg font-bold text-slate-900">
                  Payment refunded
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                  This payment has been refunded.
                </p>
                <Link
                  to={tourLink}
                  className="mt-4 inline-block rounded-lg bg-slate-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  Back to tour
                </Link>
              </div>
            )}

            {status === "pending" && hasSafeQr && (
              <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <h2 className="text-lg font-bold text-slate-900">Scan to pay</h2>
                <p className="mt-1 text-sm text-slate-600">
                  Use the ABA Mobile app to scan this QR code.
                </p>
                <img
                  src={qrImage}
                  alt="Payment QR code"
                  className="mt-4 h-56 w-56 rounded-lg border border-slate-200 bg-white p-2"
                />
                {safeDeeplink && (
                  <a
                    href={safeDeeplink}
                    rel="noreferrer"
                    className="mt-4 inline-block rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
                  >
                    Open ABA Mobile
                  </a>
                )}
                {mobileDevice && (safeAppStore || safePlayStore) && (
                  <div className="mt-4 flex flex-wrap gap-3 text-sm font-semibold">
                    {safeAppStore && (
                      <a
                        href={safeAppStore}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 underline"
                      >
                        App Store
                      </a>
                    )}
                    {safePlayStore && (
                      <a
                        href={safePlayStore}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 underline"
                      >
                        Google Play
                      </a>
                    )}
                  </div>
                )}
              </section>
            )}

            {showPendingWithoutQr && (
              <section className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-6">
                <h2 className="text-lg font-bold text-amber-900">
                  Your booking is pending payment
                </h2>
                <p className="mt-2 text-sm text-amber-800">
                  This payment method does not have a QR code. Follow the payment
                  instructions from the tour provider.
                </p>
              </section>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
