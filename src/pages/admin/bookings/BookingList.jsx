import React, { useMemo, useState } from "react";
import {
  Search,
  Download,
  Plus,
  MoreVertical,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  DollarSign,
  Users,
  SlidersHorizontal,
  X,
} from "lucide-react";

const bookings = [
  {
    id: "#BKG-8892",
    initials: "JD",
    customer: "John Doe",
    email: "john@gmail.com",
    tour: "Grand Cany Explorer",
    bookingDate: "Oct 12, 2024",
    travelDate: "Nov 05, 2024",
    guests: 2,
    amount: "$500",
    payment: "Paid",
    status: "Confirmed",
  },
  {
    id: "#BKG-8893",
    initials: "AS",
    customer: "Alice Smith",
    email: "alicesmith@gmail.com",
    tour: "Kyoto Temples & Gerdens",
    bookingDate: "Oct 12, 2024",
    travelDate: "Nov 05, 2024",
    guests: 4,
    amount: "$30000",
    payment: "Pending",
    status: "Pending",
  },
  {
    id: "#BKG-8892",
    initials: "JD",
    customer: "John Doe",
    email: "john@gmail.com",
    tour: "Grand Cany Explorer",
    bookingDate: "Oct 12, 2024",
    travelDate: "Nov 05, 2024",
    guests: 2,
    amount: "$500",
    payment: "Paid",
    status: "Confirmed",
  },
];

const paymentStyles = {
  Paid: "bg-emerald-50 text-emerald-600",
  Pending: "bg-amber-50 text-amber-600",
  Failed: "bg-red-50 text-red-600",
};

const statusStyles = {
  Confirmed: "bg-blue-50 text-blue-600",
  Pending: "bg-amber-50 text-amber-600",
  Cancelled: "bg-red-50 text-red-600",
  Rejected: "bg-red-50 text-red-600",
};

const formatTwoLines = (date) => {
  const idx = date.indexOf(" 2024");
  if (idx === -1) return date;
  return (
    <>
      {date.slice(0, idx + 1)}
      <br />
      {date.slice(idx + 2)}
    </>
  );
};

const BookingList = () => {
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("All Statuses");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [openMenuId, setOpenMenuId] = useState(null);

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      const matchesSearch = `${b.id} ${b.customer} ${b.email} ${b.tour}`
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesPayment =
        paymentFilter === "All Statuses" || b.payment === paymentFilter;
      const matchesStatus =
        statusFilter === "All Statuses" || b.status === statusFilter;
      return matchesSearch && matchesPayment && matchesStatus;
    });
  }, [search, paymentFilter, statusFilter]);

  const confirmedCount = bookings.filter((b) => b.status === "Confirmed").length;
  const pendingCount = bookings.filter(
    (b) => b.status === "Pending" || b.payment === "Pending",
  ).length;
  const revenue = bookings.reduce(
    (sum, b) => sum + Number(b.amount.replace(/[^0-9.]/g, "")),
    0,
  );
  const avgGuests =
    bookings.reduce((sum, b) => sum + b.guests, 0) / bookings.length;

  const stats = [
    {
      label: "Confirmed Bookings",
      value: confirmedCount,
      sub: `${bookings.length} total`,
      icon: CheckCircle2,
    },
    {
      label: "Pending Approvals",
      value: pendingCount,
      sub: pendingCount > 0 ? "Needs review" : "All clear",
      icon: Clock,
    },
    {
      label: "Pipeline Revenue",
      value: `$${revenue.toLocaleString()}`,
      sub: "From current bookings",
      icon: DollarSign,
    },
    {
      label: "Average Group Size",
      value: `${avgGuests.toFixed(1)} pax`,
      sub: "Standard",
      icon: Users,
    },
  ];

  const activeChips = [];
  if (paymentFilter !== "All Statuses")
    activeChips.push({ key: "payment", label: `Payment: ${paymentFilter}` });
  if (statusFilter !== "All Statuses")
    activeChips.push({ key: "status", label: `Status: ${statusFilter}` });

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8">
      {/* Page header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Booking Management
            </h1>
            <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-600">
              {bookings.length} Total
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            Manage and track all tour bookings
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50">
            <Download size={16} />
            Export
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-500">
            <Plus size={16} />
            New Booking
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, sub, icon: Icon }) => (
          <div
            key={label}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {label}
              </p>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <Icon size={16} />
              </span>
            </div>
            <p className="mt-0 text-2xl font-bold text-slate-900">{value}</p>
            <p className="mt-1 text-xs text-slate-400">{sub}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex h-10 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3">
            <Search size={16} className="text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by ID, tour, pax..."
              className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="flex flex-1 flex-col gap-3 sm:flex-row lg:flex-none">
            <label className="relative flex h-10 items-center rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600">
              <span className="mr-2 text-xs font-semibold uppercase text-slate-400">
                Pay:
              </span>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="appearance-none bg-transparent pr-6 text-sm text-slate-700 outline-none"
              >
                <option>All Statuses</option>
                <option>Paid</option>
                <option>Pending</option>
                <option>Failed</option>
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-3 text-slate-400" />
            </label>

            <label className="relative flex h-10 items-center rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-600">
              <span className="mr-2 text-xs font-semibold uppercase text-slate-400">
                Status:
              </span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none bg-transparent pr-6 text-sm text-slate-700 outline-none"
              >
                <option>All Statuses</option>
                <option>Confirmed</option>
                <option>Pending</option>
                <option>Cancelled</option>
                <option>Rejected</option>
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-3 text-slate-400" />
            </label>
          </div>

          <div className="flex items-center gap-3">
            <button className="flex h-10 items-center gap-2 rounded-lg border border-blue-600 px-4 text-sm font-medium text-blue-600 transition hover:bg-blue-50">
              <SlidersHorizontal size={16} />
              More Filters
            </button>
            <button className="flex h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium text-blue-600 transition hover:bg-blue-50">
              <Download size={16} />
              Export
            </button>
          </div>
        </div>

        {activeChips.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {activeChips.map((chip) => (
              <span
                key={chip.key}
                className="flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600"
              >
                {chip.label}
                <button
                  type="button"
                  onClick={() =>
                    chip.key === "payment"
                      ? setPaymentFilter("All Statuses")
                      : setStatusFilter("All Statuses")
                  }
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-[1000px] border-collapse">
            <thead>
              <tr className="bg-slate-50 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <th className="w-10 px-4 py-3">
                  <input type="checkbox" className="rounded border-slate-300" />
                </th>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Tour</th>
                <th className="px-4 py-3">Booking Date</th>
                <th className="px-4 py-3">Travel Date</th>
                <th className="px-4 py-3 text-center">Guests</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((booking, idx) => (
                <tr
                  key={`${booking.id}-${idx}`}
                  className="text-sm text-slate-600 transition hover:bg-slate-50"
                >
                  <td className="px-4 py-3">
                    <input type="checkbox" className="rounded border-slate-300" />
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {booking.id}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600">
                        {booking.initials}
                      </span>
                      <div>
                        <p className="font-medium text-slate-900">
                          {booking.customer}
                        </p>
                        <p className="text-xs text-slate-400">{booking.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{booking.tour}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatTwoLines(booking.bookingDate)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatTwoLines(booking.travelDate)}
                  </td>
                  <td className="px-4 py-3 text-center">{booking.guests}</td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-900">
                    {booking.amount}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center justify-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${paymentStyles[booking.payment]}`}
                    >
                      {booking.payment}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center justify-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusStyles[booking.status]}`}
                    >
                      {booking.status}
                    </span>
                  </td>
                  <td className="relative px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenMenuId(openMenuId === idx ? null : idx)
                      }
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100"
                    >
                      <MoreVertical size={16} />
                    </button>
                    {openMenuId === idx && (
                      <div className="absolute right-4 top-12 z-20 w-40 rounded-lg border border-slate-200 bg-white py-1 text-left shadow-lg">
                        {[
                          "View Details",
                          "Edit Booking",
                          "Update Status",
                          "Cancel Booking",
                        ].map((action) => (
                          <button
                            key={action}
                            type="button"
                            onClick={() => setOpenMenuId(null)}
                            className="block w-full px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-50 hover:text-slate-900"
                          >
                            {action}
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span>
              Showing {filtered.length === 0 ? 0 : 1}–{filtered.length} of{" "}
              {filtered.length} bookings
            </span>
            <label className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-400">
              Display:
              <select className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-sm normal-case text-slate-600 outline-none">
                <option>10 per page</option>
                <option>25 per page</option>
                <option>50 per page</option>
              </select>
            </label>
          </div>
          <div className="flex items-center gap-1.5">
            <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50">
              <ChevronLeft size={14} />
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-medium text-white">
              1
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded-lg text-sm text-slate-600 transition hover:bg-slate-100">
              2
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded-lg text-sm text-slate-600 transition hover:bg-slate-100">
              3
            </button>
            <span className="px-1 text-slate-400">...</span>
            <button className="flex h-8 w-8 items-center justify-center rounded-lg text-sm text-slate-600 transition hover:bg-slate-100">
              15
            </button>
            <button className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default BookingList;
