import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";

export default function Forbidden() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
          <ShieldAlert className="h-6 w-6" />
        </span>
        <p className="text-sm font-semibold text-slate-400">403</p>
        <h1 className="mt-1 text-lg font-bold text-slate-900">
          Access denied
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          Your account does not have permission to view this page. If you
          believe this is a mistake, contact the system administrator.
        </p>
        <Link
          to="/"
          className="mt-6 inline-flex rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
