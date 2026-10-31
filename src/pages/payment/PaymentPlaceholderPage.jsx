import { Link, useParams } from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { formatCurrency } from "../../utils/currency";
import { getBookingResult } from "../../utils/bookingStorage";

// TODO(next-task): build the payment page. This placeholder only confirms that
// the booking response was stored; it must not expose the gateway QR payload.
export default function PaymentPlaceholderPage() {
  const { bookingId } = useParams();
  const stored = getBookingResult(bookingId);
  const booking = stored?.booking ?? null;

  return (
    <>
      <Header />
      <main className="min-h-[60vh] bg-slate-50">
        <div className="mx-auto max-w-2xl px-4 py-16">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <h1 className="text-2xl font-bold text-slate-900">
              Payment
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Booking confirmation
            </p>

            {booking ? (
              <dl className="mt-6 space-y-4 text-sm">
                <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
                  <dt className="font-medium text-slate-500">Booking ID</dt>
                  <dd className="font-semibold text-slate-900">
                    #{booking.id}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
                  <dt className="font-medium text-slate-500">Total</dt>
                  <dd className="font-semibold text-slate-900">
                    {formatCurrency(booking.total_price)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <dt className="font-medium text-slate-500">Status</dt>
                  <dd className="font-semibold capitalize text-slate-900">
                    {booking.status ?? "Pending"}
                  </dd>
                </div>
              </dl>
            ) : (
              <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                We couldn't find this booking in this session. Please open it
                again from your booking confirmation.
              </p>
            )}

            <Link
              to="/tours/catalog"
              className="mt-8 inline-block rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              Browse more tours
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
