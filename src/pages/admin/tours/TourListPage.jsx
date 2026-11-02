import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Toast from "../../../components/common/Toast";
import TourFilter from "../../../components/admin/tours/TourFilter";
import TourHeader from "../../../components/admin/tours/TourHeader";
import Pagination from "../../../components/admin/tours/Pagination";
import TourTable from "../../../components/admin/tours/TourTable";
import { useAuth } from "../../../context/useAuth";
import {
  deleteTour,
  listAdminTours,
  restoreTour,
} from "../../../services/adminTourService";
import { resolveApiErrorMessage } from "../../../utils/apiError";

const DELETE_FALLBACK = "Could not delete this tour. Please try again.";
const RESTORE_FALLBACK = "Could not restore this tour. Please try again.";
const EMPTY_TOURS = [];

function readPage(searchParams) {
  const parsed = Number.parseInt(searchParams.get("page") ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function isValidTourId(value) {
  return /^\d+$/.test(String(value ?? "").trim()) && Number(value) > 0;
}

export default function TourListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAdmin } = useAuth();
  const page = readPage(searchParams);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [result, setResult] = useState({
    key: null,
    status: "loading",
    tours: [],
    meta: null,
  });
  const [reloadKey, setReloadKey] = useState(0);

  const requestKey = `${page}\u0000${reloadKey}`;
  const tours = result.key === requestKey ? result.tours : EMPTY_TOURS;
  const meta = result.key === requestKey ? result.meta : null;
  const loadState = result.key === requestKey ? result.status : "loading";

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [undoing, setUndoing] = useState(false);
  const [toast, setToast] = useState(null);

  const [restoreId, setRestoreId] = useState("");
  const [restoring, setRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState("");

  const closeToast = useCallback(() => setToast(null), []);

  useEffect(() => {
    let cancelled = false;
    const key = `${page}\u0000${reloadKey}`;

    listAdminTours({ page })
      .then((next) => {
        if (!cancelled) {
          setResult({
            key,
            status: "ready",
            tours: next.tours,
            meta: next.meta,
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setResult({ key, status: "error", tours: [], meta: null });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [page, reloadKey]);

  const filteredTours = useMemo(() => {
    const term = search.trim().toLowerCase();
    const normalizedStatus = status.toLowerCase();

    return tours.filter((tour) => {
      const matchesSearch =
        !term || String(tour.title ?? "").toLowerCase().includes(term);
      const matchesStatus =
        !normalizedStatus ||
        String(tour.status ?? "").trim().toLowerCase() === normalizedStatus;
      return matchesSearch && matchesStatus;
    });
  }, [tours, search, status]);

  const currentPage = Number(meta?.current_page ?? page) || 1;
  const lastPage = Math.max(Number(meta?.last_page ?? 1) || 1, 1);
  const total = Number(meta?.total ?? tours.length) || 0;
  const perPage = Number(meta?.per_page ?? tours.length) || 0;

  function refresh() {
    setReloadKey((key) => key + 1);
  }

  function goToPage(nextPage) {
    const target = Math.min(Math.max(nextPage, 1), lastPage);
    const next = new URLSearchParams(searchParams);
    if (target <= 1) {
      next.delete("page");
    } else {
      next.set("page", String(target));
    }
    setSearchParams(next);
  }

  function openDelete(tour) {
    setDeleteError("");
    setDeleteTarget(tour);
  }

  function closeDelete() {
    if (deleting) {
      return;
    }
    setDeleteTarget(null);
    setDeleteError("");
  }

  async function confirmDelete() {
    if (deleting || !deleteTarget) {
      return;
    }

    setDeleting(true);
    setDeleteError("");
    try {
      await deleteTour(deleteTarget.id);
      setDeleteTarget(null);
      refresh();
      setToast({
        message: "Tour deleted. It is hidden from the website.",
        tone: "success",
        undoId: deleteTarget.id,
      });
    } catch (error) {
      setDeleteError(resolveApiErrorMessage(error, DELETE_FALLBACK));
    } finally {
      setDeleting(false);
    }
  }

  async function handleUndo() {
    if (undoing || !toast?.undoId) {
      return;
    }

    const id = toast.undoId;
    setUndoing(true);
    try {
      await restoreTour(id);
      refresh();
      setToast({ message: "Tour restored.", tone: "success" });
    } catch (error) {
      setToast({
        message: resolveApiErrorMessage(error, RESTORE_FALLBACK),
        tone: "error",
      });
    } finally {
      setUndoing(false);
    }
  }

  async function handleRestoreById(event) {
    event.preventDefault();
    if (restoring) {
      return;
    }

    setRestoreError("");
    if (!isValidTourId(restoreId)) {
      setRestoreError("Enter a valid tour ID.");
      return;
    }

    setRestoring(true);
    try {
      await restoreTour(Number(restoreId));
      setRestoreId("");
      refresh();
      setToast({ message: "Tour restored.", tone: "success" });
    } catch (error) {
      setRestoreError(resolveApiErrorMessage(error, RESTORE_FALLBACK));
    } finally {
      setRestoring(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-[1500px]">
        <TourHeader onAdd={() => navigate("/admin/tours/new")} />

        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <TourFilter
            search={search}
            setSearch={setSearch}
            status={status}
            setStatus={setStatus}
          />

          {/* TODO(no-endpoint): deleted tours cannot be listed because there is
              no endpoint for deleted tours. Use restore-by-ID below instead. */}
          <TourTable
            tours={filteredTours}
            loadState={loadState}
            onDelete={openDelete}
            onRetry={refresh}
          />

          <Pagination
            currentPage={currentPage}
            lastPage={lastPage}
            total={total}
            perPage={perPage}
            onPageChange={goToPage}
            disabled={loadState === "loading"}
          />
        </section>

        {isAdmin && (
          <section className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900">
              Restore a deleted tour by ID
            </h2>
            {/* TODO(no-endpoint): no endpoint lists deleted tours, so the admin
                must know the tour ID. */}
            <p className="mt-1 text-xs text-slate-400">
              There is no list of deleted tours yet. Enter the tour ID to
              restore it.
            </p>

            <form
              className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center"
              onSubmit={handleRestoreById}
              noValidate
            >
              <input
                type="number"
                min="1"
                step="1"
                value={restoreId}
                onChange={(event) => setRestoreId(event.target.value)}
                aria-label="Tour ID to restore"
                placeholder="Tour ID"
                className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-50 sm:max-w-[180px]"
              />
              <button
                type="submit"
                disabled={restoring}
                className="h-10 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {restoring ? "Restoring..." : "Restore"}
              </button>
            </form>

            {restoreError && (
              <p
                role="alert"
                className="mt-2 text-xs font-medium text-red-600"
              >
                {restoreError}
              </p>
            )}
          </section>
        )}
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-tour-title"
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
          >
            <h2
              id="delete-tour-title"
              className="text-lg font-bold text-slate-900"
            >
              Delete tour?
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              &ldquo;{deleteTarget.title || "This tour"}&rdquo; will be hidden
              from the website. You can restore it.
            </p>

            {deleteError && (
              <p
                role="alert"
                className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
              >
                {deleteError}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeDelete}
                disabled={deleting}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast
        message={toast?.message ?? ""}
        tone={toast?.tone ?? "success"}
        duration={toast?.undoId ? 10000 : 4000}
        actionLabel={toast?.undoId ? "Undo" : undefined}
        onAction={toast?.undoId ? handleUndo : undefined}
        onClose={closeToast}
      />
    </main>
  );
}
