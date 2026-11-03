import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { X } from "lucide-react";
import { useAuth } from "../../../context/useAuth";
import { PERMISSIONS } from "../../../constants/permissions";
import { useReferenceData } from "../../../hooks/useReferenceData";
import TourImagesSection from "../../../components/admin/tours/TourImagesSection";
import { listCategories } from "../../../services/adminCategoryService";
import {
  buildTourPayload,
  createTour,
  getAdminTour,
  toTourForm,
  updateTour,
} from "../../../services/adminTourService";
import { resolveApiErrorMessage } from "../../../utils/apiError";
import {
  EMPTY_TOUR_FORM,
  buildTourStatusOptions,
  validateTourForm,
} from "./tourForm";

const TOUR_STATUS_KEYS = ["tour_statuses"];
const SAVE_FALLBACK = "Could not save this tour. Please try again.";
const NOT_SAVED_NOTICE = "Some values were not saved as entered";
const EMPTY_CATEGORIES = [];

const FORM_FIELD_NAMES = new Set([
  "title",
  "categoryId",
  "destinationId",
  "durationDays",
  "durationNights",
  "basePrice",
  "priceOverride",
  "status",
]);

const FIELD_NAME_MAP = {
  title: "title",
  category_id: "categoryId",
  categoryId: "categoryId",
  destination_id: "destinationId",
  destinationId: "destinationId",
  duration_days: "durationDays",
  duration_day: "durationDays",
  durationDays: "durationDays",
  duration_nights: "durationNights",
  duration_night: "durationNights",
  durationNights: "durationNights",
  base_price: "basePrice",
  basePrice: "basePrice",
  price_override: "priceOverride",
  priceOverride: "priceOverride",
  status: "status",
};

const inputClass =
  "mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500";

function readFieldErrors(error) {
  if (
    !error ||
    typeof error !== "object" ||
    !error.errors ||
    typeof error.errors !== "object" ||
    Array.isArray(error.errors)
  ) {
    return {};
  }

  const result = {};
  for (const [field, value] of Object.entries(error.errors)) {
    const message = Array.isArray(value) ? value[0] : value;
    const mapped = FIELD_NAME_MAP[field] ?? field;
    if (
      typeof message === "string" &&
      message.trim() &&
      FORM_FIELD_NAMES.has(mapped)
    ) {
      result[mapped] = message.trim();
    }
  }
  return result;
}

function payloadsEqual(first, second) {
  return (
    JSON.stringify(buildTourPayload(first)) ===
    JSON.stringify(buildTourPayload(second))
  );
}

function FieldError({ message }) {
  if (!message) {
    return null;
  }
  return <p className="mt-1 text-xs font-medium text-red-600">{message}</p>;
}

export default function TourFormPage({ mode = "create" }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { can, isAdmin } = useAuth();
  const isEdit = mode === "edit";
  const tourId = isEdit ? Number(id) : null;
  const canUpdate = can(PERMISSIONS.UPDATE_TOURS);
  const readOnly = isEdit && !canUpdate;

  const reference = useReferenceData(TOUR_STATUS_KEYS);
  const statusOptions = buildTourStatusOptions(
    reference.data.tour_statuses,
  );

  const [form, setForm] = useState(() => ({ ...EMPTY_TOUR_FORM }));
  const [baseline, setBaseline] = useState(() => ({ ...EMPTY_TOUR_FORM }));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);

  const [categoryAttempt, setCategoryAttempt] = useState(0);
  const [categoryResult, setCategoryResult] = useState({
    key: null,
    status: "loading",
    items: [],
  });
  const categoryKey = String(categoryAttempt);
  const categories =
    categoryResult.key === categoryKey
      ? categoryResult.items
      : EMPTY_CATEGORIES;
  const categoryState =
    categoryResult.key === categoryKey ? categoryResult.status : "loading";

  const [tourAttempt, setTourAttempt] = useState(0);
  const [tourResult, setTourResult] = useState({
    key: null,
    status: isEdit ? "loading" : "ready",
    tour: null,
  });
  const tourKey = `${id ?? ""}\u0000${tourAttempt}`;
  const tourData =
    isEdit && tourResult.key === tourKey ? tourResult.tour : null;
  const tourState = isEdit
    ? tourResult.key === tourKey
      ? tourResult.status
      : "loading"
    : "ready";

  useEffect(() => {
    let cancelled = false;
    const key = String(categoryAttempt);

    listCategories({ status: 1 })
      .then((items) => {
        if (!cancelled) {
          setCategoryResult({
            key,
            status: "ready",
            items: items.filter((category) => category.status === 1),
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setCategoryResult({ key, status: "error", items: [] });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [categoryAttempt]);

  useEffect(() => {
    if (!isEdit) {
      return undefined;
    }

    let cancelled = false;
    const key = `${id ?? ""}\u0000${tourAttempt}`;

    getAdminTour(tourId)
      .then((tour) => {
        if (cancelled) {
          return;
        }
        if (!tour) {
          setTourResult({ key, status: "error", tour: null });
          return;
        }
        const nextForm = toTourForm(tour);
        setTourResult({ key, status: "ready", tour });
        setBaseline(nextForm);
        setForm(nextForm);
      })
      .catch(() => {
        if (!cancelled) {
          setTourResult({ key, status: "error", tour: null });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [id, isEdit, tourAttempt, tourId]);

  function updateField(field, value) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (saving || readOnly) {
      return;
    }

    setErrors({});
    setFormError("");
    setNotice("");

    const validationErrors = validateTourForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    try {
      if (!isEdit) {
        const created = await createTour(buildTourPayload(form));
        if (created?.id != null) {
          navigate(`/admin/tours/${created.id}/edit`, { replace: true });
        } else {
          navigate("/admin/tours", { replace: true });
        }
        return;
      }

      const payload = buildTourPayload(form, baseline);
      if (Object.keys(payload).length === 0) {
        setNotice("No changes to save.");
        return;
      }

      await updateTour(tourId, payload);

      // TODO(verify-live): the API may not persist every field (for example
      // duration or status). Re-fetch and compare before trusting the values.
      const fresh = await getAdminTour(tourId);
      if (!fresh) {
        setFormError("Saved, but the tour could not be reloaded.");
        return;
      }

      const freshForm = toTourForm(fresh);
      if (!payloadsEqual(form, freshForm)) {
        setNotice(NOT_SAVED_NOTICE);
      }

      setTourResult({ key: tourKey, status: "ready", tour: fresh });
      setBaseline(freshForm);
      setForm(freshForm);
    } catch (error) {
      const fieldErrors = readFieldErrors(error);
      setErrors(fieldErrors);
      if (Object.keys(fieldErrors).length === 0) {
        setFormError(resolveApiErrorMessage(error, SAVE_FALLBACK));
      }
    } finally {
      setSaving(false);
    }
  }

  const currentCategory = tourData?.category ?? null;
  const categoryOptions = [...categories];
  if (
    isEdit &&
    currentCategory?.id != null &&
    !categoryOptions.some(
      (category) => String(category.id) === String(currentCategory.id),
    )
  ) {
    categoryOptions.unshift({
      id: currentCategory.id,
      name: currentCategory.name || `Category #${currentCategory.id}`,
    });
  }

  if (isEdit && tourState === "loading") {
    return (
      <main className="min-h-screen bg-slate-100 p-4 md:p-8">
        <div className="mx-auto max-w-[1100px]">
          <div className="h-52 animate-pulse rounded-xl bg-white shadow-sm" />
          <div className="mt-4 h-96 animate-pulse rounded-xl bg-white shadow-sm" />
        </div>
      </main>
    );
  }

  if (isEdit && tourState === "error") {
    return (
      <main className="min-h-screen bg-slate-100 p-4 md:p-8">
        <div className="mx-auto max-w-[1100px] rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <p role="alert" className="text-sm text-red-600">
            Could not load this tour.
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <Link
              to="/admin/tours"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Back to tours
            </Link>
            <button
              type="button"
              onClick={() => setTourAttempt((value) => value + 1)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              Try again
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-8">
      <div className="mx-auto max-w-[1100px]">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              <Link
                to="/admin/tours"
                className="transition hover:text-slate-600"
              >
                Tours
              </Link>{" "}
              / {isEdit ? "Edit" : "New"}
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              {isEdit ? "Edit tour" : "New tour"}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {isEdit
                ? "Update the tour details shown on the website."
                : "Create a new tour package."}
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              to="/admin/tours"
              className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <X size={15} />
              Cancel
            </Link>
            {!readOnly && (
              <button
                type="submit"
                form="tour-form"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : isEdit
                    ? "Save changes"
                    : "Create tour"}
              </button>
            )}
          </div>
        </div>

        {readOnly && (
          <p
            role="status"
            className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900"
          >
            You can view this tour but you do not have permission to edit it.
          </p>
        )}

        <form id="tour-form" className="space-y-4" onSubmit={handleSubmit} noValidate>
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="border-b border-slate-100 pb-3 text-sm font-bold text-slate-900">
              Basic information
            </h2>

            <div className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="tour-title"
                  className="text-sm font-medium text-slate-700"
                >
                  Title
                </label>
                <input
                  id="tour-title"
                  type="text"
                  value={form.title}
                  onChange={(event) =>
                    updateField("title", event.target.value)
                  }
                  disabled={readOnly}
                  className={inputClass}
                  placeholder="e.g. Kyoto Cultural Experience"
                />
                <FieldError message={errors.title} />
              </div>

              {isEdit && (
                <div>
                  <label
                    htmlFor="tour-slug"
                    className="text-sm font-medium text-slate-700"
                  >
                    Slug
                  </label>
                  <input
                    id="tour-slug"
                    type="text"
                    value={tourData?.slug ?? ""}
                    readOnly
                    className={`${inputClass} bg-slate-50 text-slate-500`}
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    The slug is generated by the server.
                  </p>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="tour-category"
                    className="text-sm font-medium text-slate-700"
                  >
                    Category
                  </label>
                  <select
                    id="tour-category"
                    value={String(form.categoryId ?? "")}
                    onChange={(event) =>
                      updateField("categoryId", event.target.value)
                    }
                    disabled={readOnly || categoryState === "loading"}
                    className={inputClass}
                  >
                    <option value="">Select a category</option>
                    {categoryOptions.map((category) => (
                      <option key={category.id} value={String(category.id)}>
                        {category.name || `Category #${category.id}`}
                      </option>
                    ))}
                  </select>
                  {categoryState === "loading" && (
                    <p className="mt-1 text-xs text-slate-400">
                      Loading categories...
                    </p>
                  )}
                  {categoryState === "error" && (
                    <div className="mt-1 flex items-center gap-2 text-xs">
                      <span className="text-red-600">
                        Could not load categories.
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setCategoryAttempt((value) => value + 1)
                        }
                        className="font-semibold text-blue-600 hover:text-blue-500"
                      >
                        Retry
                      </button>
                    </div>
                  )}
                  <FieldError message={errors.categoryId} />
                </div>

                <div>
                  <label
                    htmlFor="tour-destination"
                    className="text-sm font-medium text-slate-700"
                  >
                    Destination ID
                  </label>
                  <input
                    id="tour-destination"
                    type="number"
                    min="1"
                    step="1"
                    value={form.destinationId}
                    onChange={(event) =>
                      updateField("destinationId", event.target.value)
                    }
                    disabled={readOnly}
                    className={inputClass}
                    placeholder="e.g. 12"
                  />
                  <p className="mt-1 text-xs text-slate-400">
                    Enter the destination ID; there is no destinations list yet
                  </p>
                  {/* TODO(no-endpoint): there is no endpoint to list destinations. */}
                  {isEdit && tourData?.destination?.name && (
                    <p className="mt-1 text-xs text-slate-500">
                      Destination:{" "}
                      <span className="font-medium text-slate-700">
                        {tourData.destination.name}
                      </span>
                    </p>
                  )}
                  <FieldError message={errors.destinationId} />
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="border-b border-slate-100 pb-3 text-sm font-bold text-slate-900">
              Duration and pricing
            </h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="tour-duration-days"
                  className="text-sm font-medium text-slate-700"
                >
                  Duration (days)
                </label>
                <input
                  id="tour-duration-days"
                  type="number"
                  min="1"
                  step="1"
                  value={form.durationDays}
                  onChange={(event) =>
                    updateField("durationDays", event.target.value)
                  }
                  disabled={readOnly}
                  className={inputClass}
                  placeholder="e.g. 3"
                />
                <FieldError message={errors.durationDays} />
              </div>

              <div>
                <label
                  htmlFor="tour-duration-nights"
                  className="text-sm font-medium text-slate-700"
                >
                  Duration (nights)
                </label>
                <input
                  id="tour-duration-nights"
                  type="number"
                  min="0"
                  step="1"
                  value={form.durationNights}
                  onChange={(event) =>
                    updateField("durationNights", event.target.value)
                  }
                  disabled={readOnly}
                  className={inputClass}
                  placeholder="e.g. 2"
                />
                <FieldError message={errors.durationNights} />
              </div>

              <div>
                <label
                  htmlFor="tour-base-price"
                  className="text-sm font-medium text-slate-700"
                >
                  Base price
                </label>
                <input
                  id="tour-base-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.basePrice}
                  onChange={(event) =>
                    updateField("basePrice", event.target.value)
                  }
                  disabled={readOnly}
                  className={inputClass}
                  placeholder="0.00"
                />
                <p className="mt-1 text-xs text-slate-400">
                  Up to 2 decimals.
                </p>
                <FieldError message={errors.basePrice} />
              </div>

              <div>
                <label
                  htmlFor="tour-price-override"
                  className="text-sm font-medium text-slate-700"
                >
                  Price override
                </label>
                <input
                  id="tour-price-override"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.priceOverride}
                  onChange={(event) =>
                    updateField("priceOverride", event.target.value)
                  }
                  disabled={readOnly}
                  className={inputClass}
                  placeholder="Optional"
                />
                <p className="mt-1 text-xs text-slate-400">
                  Leave empty to use the base price.
                </p>
                <FieldError message={errors.priceOverride} />
              </div>
            </div>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="border-b border-slate-100 pb-3 text-sm font-bold text-slate-900">
              Status
            </h2>

            <div className="mt-4 max-w-xs">
              <label
                htmlFor="tour-status"
                className="text-sm font-medium text-slate-700"
              >
                Status
              </label>
              <select
                id="tour-status"
                value={form.status}
                onChange={(event) =>
                  updateField("status", event.target.value)
                }
                disabled={readOnly}
                className={inputClass}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <FieldError message={errors.status} />
            </div>
          </section>

          {/* TODO(separate-task): inclusions/exclusions, schedules and itinerary
              editing are intentionally not part of this screen. */}

          {formError && (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
            >
              {formError}
            </p>
          )}

          {notice && (
            <p
              role="status"
              className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900"
            >
              {notice}
            </p>
          )}
        </form>

        {isEdit && (
          <div className="mt-4">
            <TourImagesSection tourId={tourId} canManage={isAdmin} />
          </div>
        )}
      </div>
    </main>
  );
}
