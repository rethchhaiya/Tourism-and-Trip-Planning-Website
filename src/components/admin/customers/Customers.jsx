import { Download, Plus, Users, UserCheck, Repeat, Wallet } from "lucide-react";
import CustomerTable from "./CustomerTable";
import { customers } from "./customersData";
import { useAuth } from "../../../context/useAuth";

export default function Customers() {
  const { isAdmin } = useAuth();
  const total = customers.length;
  const activeCount = customers.filter((c) => c.status === "ACTIVE").length;
  const repeatCount = customers.filter((c) => c.bookings >= 2).length;
  const gross = customers.reduce(
    (sum, c) => sum + Number(String(c.spent).replace(/[^0-9.]/g, "")),
    0,
  );
  const avg = total > 0 ? gross / total : 0;

  const stats = [
    {
      label: "Total Customers",
      value: total.toLocaleString(),
      sub: "Registered accounts",
      icon: Users,
    },
    {
      label: "Active Accounts",
      value: activeCount.toLocaleString(),
      sub: total > 0 ? `${((activeCount / total) * 100).toFixed(1)}% of total` : "0% of total",
      icon: UserCheck,
    },
    {
      label: "Repeat Travelers",
      value: repeatCount.toLocaleString(),
      sub: total > 0 ? `${((repeatCount / total) * 100).toFixed(1)}% loyalty` : "0% loyalty",
      icon: Repeat,
    },
    {
      label: "Total Gross Spend",
      value: `$${gross.toLocaleString()}`,
      sub: `Average spend $${avg.toFixed(2)} / traveler`,
      icon: Wallet,
    },
  ];

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-[1500px]">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Customers
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              View, segment, and manage registered traveler accounts and
              spending profiles
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isAdmin && (
              <>
                <button className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50">
                  <Download size={16} />
                  Export CSV
                </button>
                <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-500">
                  <Plus size={16} />
                  Add Customer
                </button>
              </>
            )}
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

        <CustomerTable />
      </div>
    </main>
  );
}
