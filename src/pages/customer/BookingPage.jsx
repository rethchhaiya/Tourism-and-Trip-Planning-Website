import { useEffect, useMemo, useRef, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useAuth } from "../../context/useAuth";
import { PERMISSIONS } from "../../constants/permissions";
import { AGE_GROUPS, BOOKING_PAYMENT_METHODS } from "../../constants/booking";
import {
  getOptions,
  isSameValue,
  useReferenceData,
} from "../../hooks/useReferenceData";
import { fetchTourById } from "../../services/catalogService";
import {
  buildBookingPayload,
  createBooking,
} from "../../services/bookingService";
import {
  isPublishedStatus,
  isScheduleClosed,
  normalizeTourDetail,
} from "../../utils/catalog";
import { formatCurrency } from "../../utils/currency";
import { saveBookingResult } from "../../utils/bookingStorage";

const REFERENCE_LISTS = [
  "booking_types",
  "participant_sex",
  "payment_methods",
];

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDateTime(value) {
  const time = Date.parse(value ?? "");
  return Number.isFinite(time)
    ? DATE_FORMATTER.format(new Date(time))
    : "Date to be announced";
}

function createRow(rowId) {
  return { rowId, name: "", sex: "", age_group: "" };
}

function firstMessage(value) {
  if (Array.isArray(value)) {
    return typeof value[0] === "string" ? value[0] : "";
  }
  return typeof value === "string" ? value : "";
}

function collectErrorText(error) {
  const parts = [];
  if (typeof error?.message === "string") {
    parts.push(error.message);
  }
  if (error?.errors && typeof error.errors === "object") {
    for (const value of Object.values(error.errors)) {
      const message = firstMessage(value);
      if (message) {
        parts.push(message);
      }
    }
  }
  return parts.join(" ").toLowerCase();
}

function isSoldOutError(error) {
  return /sold\s*out|no\s+seats|not\s+enough\s+seats|(?:is|are)\s+full|capacity\s+(?:is\s+)?(?:full|exceeded)|exceeds?\s+(?:the\s+)?capacity/.test(
    collectErrorText(error),
  );
}

function isClosedError(error) {
  return /closed|cut\s*-?\s*off|no\s+longer\s+accept/.test(
    collectErrorText(error),
  );
}

function mapFieldErrors(errors) {
  const mapped = {};
  if (!errors || typeof errors !== "object") {
    return mapped;
  }

  for (const [field, value] of Object.entries(errors)) {
    const message = firstMessage(value);
    if (!message) {
      continue;
    }
    const known =
      field === "type" ||
      field === "payment_method" ||
      field === "special_requests" ||
      field === "members_count" ||
      field === "tour_schedule_id" ||
      field === "participants" ||
      /^participants\.\d+\.(name|sex|age_group)$/.test(field);
    if (known) {
      mapped[field] = message;
    }
  }

  return mapped;
}

function validateForm({
  type,
  paymentMethod,
  specialRequests,
  participants,
  seatsLeft,
}) {
  const errors = {};

  if (!type) {
    errors.type = "Select a tour type.";
  }
  if (!paymentMethod) {
    errors.payment_method = "Select a payment method.";
  } else if (
    !BOOKING_PAYMENT_METHODS.some((method) =>
      isSameValue(method, paymentMethod),
    )
  ) {
    errors.payment_method = "Select a valid payment method.";
  }

  if (participants.length === 0) {
    errors.participants = "Add at least one participant.";
  } else if (seatsLeft != null && participants.length > seatsLeft) {
    errors.participants = `This departure only has ${seatsLeft} ${
      seatsLeft === 1 ? "seat" : "seats"
    } left.`;
  }

  participants.forEach((participant, index) => {
    if (!String(participant.name ?? "").trim()) {
      errors[`participants.${index}.name`] = "Enter the participant's name.";
    }
    if (!participant.sex) {
      errors[`participants.${index}.sex`] = "Select a sex.";
    }
    if (!participant.age_group) {
      errors[`participants.${index}.age_group`] = "Select an age group.";
    }
  });

  if (String(specialRequests ?? "").length > 1000) {
    errors.special_requests = "Special requests must be 1000 characters or fewer.";
  }

  return errors;
}

function FieldError({ id, message }) {
  if (!message) {
    return null;
  }
  return (
    <p id={id} className="mt-1 text-sm font-medium text-red-500">
      {message}
    </p>
  );
}

function UnavailableSchedule({ tourId, title, body }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
        <h1 className="text-xl font-bold text-slate-900">{title}</h1>
        <p className="mt-2 text-sm text-slate-600">{body}</p>
        <Link
          to={`/tours/${tourId}`}
          className="mt-6 inline-block rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          Back to tour
        </Link>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16" data-testid="booking-loading">
      <div className="h-8 w-2/3 animate-pulse rounded bg-slate-200" />
      <div className="mt-4 h-40 animate-pulse rounded-2xl bg-slate-200" />
      <div className="mt-6 h-64 animate-pulse rounded-2xl bg-slate-200" />
    </div>
  );
}

function TourLoadError({ onRetry }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
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
          className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
        >
          Retry tour
        </button>
      </div>
    </div>
  );
}

export default function BookingPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const scheduleId = searchParams.get("schedule");
  const navigate = useNavigate();
  const location = useLocation();
  const { can, logout } = useAuth();

  const allowed = can(PERMISSIONS.STORE_BOOKINGS);
  const reference = useReferenceData(REFERENCE_LISTS);

  const [tourStatus, setTourStatus] = useState("loading");
  const [tour, setTour] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [completedRequestKey, setCompletedRequestKey] = useState("");
  const requestKey = `${id}|${reloadKey}`;
  const isLoadingTour = completedRequestKey !== requestKey;

  const [type, setType] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [specialRequests, setSpecialRequests] = useState("");
  const nextRowId = useRef(2);
  const [participants, setParticipants] = useState(() => [createRow(1)]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    fetchTourById(id)
      .then((raw) => {
        if (cancelled) {
          return;
        }
        if (!raw) {
          setTourStatus("not-found");
          setCompletedRequestKey(requestKey);
          return;
        }
        const detail = normalizeTourDetail(raw);
        if (!isPublishedStatus(detail.status)) {
          setTourStatus("not-found");
          setCompletedRequestKey(requestKey);
          return;
        }
        setTour(detail);
        setTourStatus("ready");
        setCompletedRequestKey(requestKey);
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        setTourStatus(error?.status === 404 ? "not-found" : "error");
        setCompletedRequestKey(requestKey);
      });

    return () => {
      cancelled = true;
    };
  }, [id, reloadKey, requestKey]);

  const schedule = useMemo(() => {
    if (!tour || !scheduleId) {
      return null;
    }
    return (
      tour.schedules.find(
        (item) => String(item.id) === String(scheduleId),
      ) ?? null
    );
  }, [tour, scheduleId]);

  const typeOptions = getOptions(reference.data.booking_types);
  const sexOptions = getOptions(reference.data.participant_sex);
  const paymentOptions = useMemo(
    () =>
      getOptions(reference.data.payment_methods).filter((option) =>
        BOOKING_PAYMENT_METHODS.some((method) =>
          isSameValue(method, option.value),
        ),
      ),
    [reference.data.payment_methods],
  );

  const referenceLoading = reference.loading;
  const referenceFailed =
    !referenceLoading &&
    (Boolean(reference.error) ||
      reference.missingKeys.length > 0 ||
      typeOptions.length === 0 ||
      sexOptions.length === 0 ||
      paymentOptions.length === 0);
  const referenceDisabled = referenceLoading || referenceFailed;

  const seatsLeft = schedule?.seatsLeft ?? null;
  const atCapacity =
    seatsLeft != null && participants.length >= seatsLeft;
  const unitPrice =
    schedule?.priceOverride ?? tour?.priceOverride ?? tour?.basePrice ?? null;
  const estimate =
    unitPrice != null ? unitPrice * participants.length : null;

  function updateParticipant(rowId, index, field, value) {
    setParticipants((prev) =>
      prev.map((participant) =>
        participant.rowId === rowId
          ? { ...participant, [field]: value }
          : participant,
      ),
    );
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[`participants.${index}.${field}`];
      delete next.participants;
      return next;
    });
  }

  function addParticipant() {
    if (atCapacity) {
      return;
    }
    const rowId = nextRowId.current;
    nextRowId.current += 1;
    setParticipants((prev) => [...prev, createRow(rowId)]);
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.participants;
      return next;
    });
  }

  function removeParticipant(rowId) {
    if (participants.length <= 1) {
      return;
    }
    setParticipants((prev) =>
      prev.filter((participant) => participant.rowId !== rowId),
    );
    setFieldErrors({});
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (submittingRef.current) {
      return;
    }

    const clientErrors = validateForm({
      type,
      paymentMethod,
      specialRequests,
      participants,
      seatsLeft,
    });
    setFieldErrors(clientErrors);
    setFormError("");

    if (Object.keys(clientErrors).length > 0) {
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);

    const payload = buildBookingPayload({
      tourScheduleId: schedule.id,
      type,
      paymentMethod,
      specialRequests,
      participants,
    });

    try {
      const result = await createBooking(payload);
      const bookingId = result?.booking?.id;

      if (bookingId == null) {
        setFormError(
          "Your booking was sent, but the confirmation could not be read. Please check before trying again.",
        );
        return;
      }

      saveBookingResult(result);
      navigate(`/payment/${encodeURIComponent(bookingId)}`);
    } catch (error) {
      if (error?.name === "AbortError" || error?.status === 0) {
        setFormError(
          "We couldn't confirm whether your booking was created. Please check before trying again.",
        );
        return;
      }

      if (isSoldOutError(error)) {
        setFormError(
          "This departure is sold out. Please choose another departure.",
        );
        return;
      }

      if (isClosedError(error)) {
        setFormError(
          "This departure is closed for booking. Please choose another departure.",
        );
        return;
      }

      if (error?.status === 401) {
        await logout().catch(() => {});
        navigate("/login", {
          state: { from: `${location.pathname}${location.search}` },
          replace: true,
        });
        return;
      }

      if (error?.status === 403) {
        setFormError("Your account is not allowed to create bookings.");
        return;
      }

      if (error?.status === 422) {
        const mapped = mapFieldErrors(error.errors);
        setFieldErrors(mapped);
        const rootMessage =
          mapped.tour_schedule_id || mapped.members_count || "";
        setFormError(
          rootMessage ||
            (Object.keys(mapped).length > 0
              ? "Please check the highlighted fields and try again."
              : "Please check your booking details and try again."),
        );
        return;
      }

      setFormError("We couldn't create your booking. Please try again.");
    } finally {
      submittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  let content;

  if (isLoadingTour) {
    content = <LoadingState />;
  } else if (tourStatus === "not-found") {
    content = (
      <UnavailableSchedule
        tourId={id}
        title="Tour not found"
        body="This tour is unavailable or is no longer published."
      />
    );
  } else if (tourStatus === "error") {
    content = (
      <TourLoadError onRetry={() => setReloadKey((key) => key + 1)} />
    );
  } else if (!allowed) {
    content = (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <h1 className="text-xl font-bold text-slate-900">
            You are not allowed to book this tour
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Your account does not have permission to create bookings.
          </p>
          <Link
            to={`/tours/${id}`}
            className="mt-6 inline-block rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            Back to tour
          </Link>
        </div>
      </div>
    );
  } else if (!scheduleId) {
    content = (
      <UnavailableSchedule
        tourId={id}
        title="Choose a departure"
        body="No departure was selected. Pick a date from the tour page."
      />
    );
  } else if (!schedule) {
    content = (
      <UnavailableSchedule
        tourId={id}
        title="Departure not found"
        body="That departure could not be found for this tour."
      />
    );
  } else if (!isPublishedStatus(schedule.status)) {
    content = (
      <UnavailableSchedule
        tourId={id}
        title="Departure not open"
        body="This departure is not published, so it cannot be booked."
      />
    );
  } else if (isScheduleClosed(schedule)) {
    content = (
      <UnavailableSchedule
        tourId={id}
        title="Booking closed"
        body="This departure is past its booking cutoff."
      />
    );
  } else if (seatsLeft != null && seatsLeft <= 0) {
    content = (
      <UnavailableSchedule
        tourId={id}
        title="Sold out"
        body="This departure is full. Please choose another date."
      />
    );
  } else {
    content = (
      <div className="mx-auto max-w-5xl px-4 py-10 md:px-8">
        <nav
          aria-label="Breadcrumb"
          className="mb-5 flex flex-wrap items-center gap-2 text-sm text-slate-500"
        >
          <Link to="/" className="transition hover:text-slate-800">
            Home
          </Link>
          <span aria-hidden="true">&gt;</span>
          <Link to={`/tours/${id}`} className="transition hover:text-slate-800">
            {tour.title}
          </Link>
          <span aria-hidden="true">&gt;</span>
          <span className="font-medium text-slate-800">Book</span>
        </nav>

        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">
            Book {tour.title}
          </h1>
          <div className="mt-3 space-y-1 text-sm text-slate-600">
            <p data-testid="schedule-dates">
              {formatDateTime(schedule.startDateTime)} —{" "}
              {formatDateTime(schedule.endDateTime)}
            </p>
            <p data-testid="seats-left">
              {seatsLeft == null
                ? "Seats unavailable"
                : `${seatsLeft} ${seatsLeft === 1 ? "seat" : "seats"} left`}
            </p>
          </div>
          <p className="mt-3 text-sm text-slate-500">
            Estimated total:{" "}
            <span className="font-semibold text-slate-900">
              {estimate != null ? formatCurrency(estimate) : "Price on request"}
            </span>{" "}
            for {participants.length}{" "}
            {participants.length === 1 ? "participant" : "participants"}. The
            server confirms the final amount.
          </p>
        </header>

        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-6">
          {referenceFailed && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <p>We couldn't load the booking options.</p>
              <button
                type="button"
                onClick={reference.retry}
                className="mt-2 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-700"
              >
                Retry options
              </button>
            </div>
          )}

          {formError && (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600"
            >
              {formError}
            </p>
          )}

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="booking-type"
                  className="text-xs font-semibold uppercase tracking-wide text-slate-600"
                >
                  Tour type
                </label>
                <select
                  id="booking-type"
                  value={type}
                  onChange={(event) => setType(event.target.value)}
                  disabled={referenceDisabled || isSubmitting}
                  aria-invalid={Boolean(fieldErrors.type)}
                  className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">
                    {referenceLoading ? "Loading..." : "Select a tour type"}
                  </option>
                  {typeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <FieldError
                  id="booking-type-error"
                  message={fieldErrors.type}
                />
              </div>

              <div>
                <label
                  htmlFor="booking-payment-method"
                  className="text-xs font-semibold uppercase tracking-wide text-slate-600"
                >
                  Payment method
                </label>
                <select
                  id="booking-payment-method"
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                  disabled={referenceDisabled || isSubmitting}
                  aria-invalid={Boolean(fieldErrors.payment_method)}
                  className="mt-1.5 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <option value="">
                    {referenceLoading ? "Loading..." : "Select a payment method"}
                  </option>
                  {paymentOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <FieldError
                  id="booking-payment-error"
                  message={fieldErrors.payment_method}
                />
              </div>
            </div>

            <div className="mt-5">
              <label
                htmlFor="booking-special-requests"
                className="text-xs font-semibold uppercase tracking-wide text-slate-600"
              >
                Special requests
              </label>
              <textarea
                id="booking-special-requests"
                value={specialRequests}
                onChange={(event) => setSpecialRequests(event.target.value)}
                maxLength={1000}
                rows={4}
                disabled={isSubmitting}
                className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              />
              <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
                <span>
                  {fieldErrors.special_requests ? (
                    <span className="font-medium text-red-500">
                      {fieldErrors.special_requests}
                    </span>
                  ) : (
                    "Optional, up to 1000 characters."
                  )}
                </span>
                <span data-testid="special-requests-count">
                  {specialRequests.length}/1000
                </span>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Participants
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  <span data-testid="members-count">
                    {participants.length}{" "}
                    {participants.length === 1
                      ? "participant"
                      : "participants"}
                  </span>
                  {seatsLeft != null && (
                    <span className="ml-2 text-slate-400">
                      (maximum {seatsLeft})
                    </span>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={addParticipant}
                disabled={
                  atCapacity || referenceDisabled || isSubmitting
                }
                className="rounded-lg border border-indigo-200 px-3 py-1.5 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Add participant
              </button>
            </div>

            <FieldError
              message={fieldErrors.participants}
            />

            <div className="mt-4 space-y-4">
              {participants.map((participant, index) => (
                <div
                  key={participant.rowId}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-700">
                      Participant {index + 1}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeParticipant(participant.rowId)}
                      disabled={participants.length <= 1 || isSubmitting}
                      aria-label={`Remove participant ${index + 1}`}
                      className="text-xs font-medium text-red-500 transition hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Remove
                    </button>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    <div>
                      <label
                        htmlFor={`participant-${participant.rowId}-name`}
                        className="text-xs font-medium text-slate-600"
                      >
                        Name
                      </label>
                      <input
                        id={`participant-${participant.rowId}-name`}
                        type="text"
                        value={participant.name}
                        onChange={(event) =>
                          updateParticipant(
                            participant.rowId,
                            index,
                            "name",
                            event.target.value,
                          )
                        }
                        disabled={isSubmitting}
                        aria-invalid={Boolean(
                          fieldErrors[`participants.${index}.name`],
                        )}
                        className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                      />
                      <FieldError
                        id={`participant-${participant.rowId}-name-error`}
                        message={fieldErrors[`participants.${index}.name`]}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`participant-${participant.rowId}-sex`}
                        className="text-xs font-medium text-slate-600"
                      >
                        Sex
                      </label>
                      <select
                        id={`participant-${participant.rowId}-sex`}
                        value={participant.sex}
                        onChange={(event) =>
                          updateParticipant(
                            participant.rowId,
                            index,
                            "sex",
                            event.target.value,
                          )
                        }
                        disabled={referenceDisabled || isSubmitting}
                        aria-invalid={Boolean(
                          fieldErrors[`participants.${index}.sex`],
                        )}
                        className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <option value="">
                          {referenceLoading ? "Loading..." : "Select sex"}
                        </option>
                        {sexOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <FieldError
                        id={`participant-${participant.rowId}-sex-error`}
                        message={fieldErrors[`participants.${index}.sex`]}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`participant-${participant.rowId}-age`}
                        className="text-xs font-medium text-slate-600"
                      >
                        Age group
                      </label>
                      <select
                        id={`participant-${participant.rowId}-age`}
                        value={participant.age_group}
                        onChange={(event) =>
                          updateParticipant(
                            participant.rowId,
                            index,
                            "age_group",
                            event.target.value,
                          )
                        }
                        disabled={isSubmitting}
                        aria-invalid={Boolean(
                          fieldErrors[`participants.${index}.age_group`],
                        )}
                        className="mt-1 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <option value="">Select age group</option>
                        {AGE_GROUPS.map((group) => (
                          <option key={group} value={group}>
                            {group}
                          </option>
                        ))}
                      </select>
                      <FieldError
                        id={`participant-${participant.rowId}-age-error`}
                        message={fieldErrors[`participants.${index}.age_group`]}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {atCapacity && (
              <p className="mt-3 text-sm font-medium text-amber-600">
                This departure only has {seatsLeft}{" "}
                {seatsLeft === 1 ? "seat" : "seats"} left.
              </p>
            )}
          </section>

          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Estimated
              </p>
              <p className="text-2xl font-bold text-slate-900">
                {estimate != null
                  ? formatCurrency(estimate)
                  : "Price on request"}
              </p>
            </div>
            <button
              type="submit"
              disabled={isSubmitting || referenceDisabled}
              className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Creating booking..." : "Confirm booking"}
            </button>
          </div>
        </form>
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
