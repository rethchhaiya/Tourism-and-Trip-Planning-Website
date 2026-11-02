import { http } from "./httpClient";

const DATE_FORMATTER = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
});

function toNumberOrNull(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const number =
    typeof value === "number" ? value : Number.parseFloat(String(value));
  return Number.isFinite(number) ? number : null;
}

function firstString(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }
  return "";
}

function normalizeStatus(value) {
  if (typeof value !== "string") {
    return "";
  }
  return value.trim().toLowerCase();
}

function readSchedule(raw) {
  return raw?.tour_schedule &&
    typeof raw.tour_schedule === "object" &&
    !Array.isArray(raw.tour_schedule)
    ? raw.tour_schedule
    : null;
}

function readTour(raw) {
  if (raw?.tour && typeof raw.tour === "object" && !Array.isArray(raw.tour)) {
    return raw.tour;
  }
  const schedule = readSchedule(raw);
  return schedule?.tour &&
    typeof schedule.tour === "object" &&
    !Array.isArray(schedule.tour)
    ? schedule.tour
    : null;
}

function readScheduleId(raw) {
  return raw?.tour_schedule_id ?? readSchedule(raw)?.id ?? null;
}

function readUserId(raw) {
  return raw?.user_id ?? raw?.user?.id ?? null;
}

function readTourId(raw) {
  return raw?.tour_id ?? readTour(raw)?.id ?? null;
}

function readTitle(raw, id) {
  const tour = readTour(raw);
  const title = firstString(
    tour?.title,
    raw?.tour_title,
    tour?.name,
    raw?.tour_name,
  );
  if (title) {
    return title;
  }
  return id != null ? `Booking #${id}` : "Booking";
}

function formatDate(value) {
  const time = Date.parse(value ?? "");
  return Number.isFinite(time) ? DATE_FORMATTER.format(new Date(time)) : "";
}

function readScheduleLabel(raw, scheduleId) {
  const schedule = readSchedule(raw) ?? {};
  const start = firstString(
    formatDate(
      schedule.start_datetime ?? schedule.start_date ?? schedule.startDate,
    ),
  );
  const end = firstString(
    formatDate(schedule.end_datetime ?? schedule.end_date ?? schedule.endDate),
  );

  if (start && end && start !== end) {
    return `${start} – ${end}`;
  }
  if (start) {
    return start;
  }
  if (end) {
    return end;
  }
  return scheduleId != null ? `Schedule #${scheduleId}` : "Schedule unavailable";
}

function normalizeSchedule(rawSchedule, fallbackId = null) {
  if (!rawSchedule || typeof rawSchedule !== "object") {
    return null;
  }
  return {
    id: rawSchedule.id ?? fallbackId,
    maxCapacity: toNumberOrNull(
      rawSchedule.max_capacity ?? rawSchedule.maxCapacity,
    ),
    currentBooked: toNumberOrNull(
      rawSchedule.current_booked ?? rawSchedule.currentBooked,
    ),
  };
}

function normalizeParticipants(rawParticipants) {
  if (!Array.isArray(rawParticipants)) {
    return [];
  }

  return rawParticipants
    .map((participant) => ({
      name: firstString(participant?.name),
      sex: firstString(participant?.sex, participant?.participant_sex),
      ageGroup: firstString(participant?.age_group, participant?.ageGroup),
    }))
    .filter(
      (participant) =>
        participant.name || participant.sex || participant.ageGroup,
    );
}

function extractData(payload) {
  if (
    payload &&
    typeof payload === "object" &&
    !Array.isArray(payload) &&
    payload.data &&
    typeof payload.data === "object" &&
    !Array.isArray(payload.data)
  ) {
    return payload.data;
  }
  return payload ?? null;
}

function extractPage(payload) {
  const empty = {
    items: [],
    currentPage: 1,
    total: 0,
    perPage: 10,
  };

  if (Array.isArray(payload)) {
    return {
      items: payload,
      currentPage: 1,
      total: payload.length,
      perPage: payload.length || 10,
    };
  }

  if (!payload || typeof payload !== "object") {
    return empty;
  }

  const source =
    payload.data &&
    typeof payload.data === "object" &&
    !Array.isArray(payload.data)
      ? payload.data
      : payload;

  const items = Array.isArray(source.data)
    ? source.data
    : Array.isArray(source.items)
      ? source.items
      : [];

  const currentPage =
    toNumberOrNull(source.current_page ?? source.currentPage) ??
    toNumberOrNull(source.meta?.current_page) ??
    1;
  const total =
    toNumberOrNull(source.total) ??
    toNumberOrNull(source.meta?.total) ??
    items.length;
  const perPage =
    toNumberOrNull(source.per_page ?? source.perPage) ??
    toNumberOrNull(source.meta?.per_page) ??
    10;

  return {
    items,
    currentPage: Math.max(1, currentPage),
    total: Math.max(0, total),
    perPage: perPage > 0 ? perPage : 10,
  };
}

export function normalizeBookingListItem(raw) {
  const id = raw?.id ?? null;
  const scheduleId = readScheduleId(raw);
  const participants = normalizeParticipants(raw?.participants);
  const membersCount =
    toNumberOrNull(raw?.members_count ?? raw?.membersCount) ??
    (participants.length > 0 ? participants.length : null);

  return {
    id,
    title: readTitle(raw, id),
    tourId: readTourId(raw),
    scheduleId,
    scheduleLabel: readScheduleLabel(raw, scheduleId),
    totalPrice: toNumberOrNull(raw?.total_price ?? raw?.totalPrice),
    status: normalizeStatus(raw?.status) || "unknown",
    type: firstString(raw?.type, raw?.booking_type),
    membersCount,
    userId: readUserId(raw),
  };
}

export function normalizeBookingDetail(raw) {
  const id = raw?.id ?? null;
  const scheduleId = readScheduleId(raw);
  const participants = normalizeParticipants(raw?.participants);
  const membersCount =
    toNumberOrNull(raw?.members_count ?? raw?.membersCount) ??
    (participants.length > 0 ? participants.length : null);

  return {
    id,
    userId: readUserId(raw),
    tourId: readTourId(raw),
    title: readTitle(raw, id),
    status: normalizeStatus(raw?.status) || "unknown",
    type: firstString(raw?.type, raw?.booking_type),
    membersCount,
    totalPrice: toNumberOrNull(raw?.total_price ?? raw?.totalPrice),
    specialRequests: firstString(
      raw?.special_requests,
      raw?.specialRequests,
    ),
    scheduleId,
    scheduleLabel: readScheduleLabel(raw, scheduleId),
    schedule: normalizeSchedule(readSchedule(raw), scheduleId),
    participants,
    userName: firstString(raw?.user?.name, raw?.user_name),
    paymentStatus:
      normalizeStatus(
        raw?.payment?.status ??
          raw?.payment_status ??
          raw?.payment?.payment_status,
      ) || "",
    paymentMethod: firstString(
      raw?.payment?.payment_method,
      raw?.payment_method,
    ),
  };
}

export async function listBookings({
  page = 1,
  perPage = 10,
  status = "",
  type = "",
} = {}) {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("per_page", String(perPage));
  if (status) {
    params.set("status", status);
  }
  if (type) {
    params.set("type", type);
  }

  const payload = await http.get(`/bookings?${params.toString()}`);
  const { items, currentPage, total, perPage: pageSize } =
    extractPage(payload);

  return {
    bookings: items.map(normalizeBookingListItem),
    currentPage,
    total,
    perPage: pageSize,
    lastPage: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getBooking(id) {
  const payload = await http.get(
    `/bookings/${encodeURIComponent(String(id))}`,
  );
  const data = extractData(payload);
  return data ? normalizeBookingDetail(data) : null;
}

export async function cancelBooking(id) {
  const payload = await http.patch(
    `/bookings/${encodeURIComponent(String(id))}/cancel`,
  );
  const data = extractData(payload);

  return {
    id: data?.id ?? id,
    status: normalizeStatus(data?.status) || "cancelled",
    schedule: normalizeSchedule(readSchedule(data ?? {})),
  };
}

export function buildBookingPayload({
  tourScheduleId,
  type,
  paymentMethod,
  specialRequests,
  participants,
}) {
  const rows = Array.isArray(participants) ? participants : [];

  const payloadEntries = rows.map((participant) => {
    const entry = { name: String(participant?.name ?? "").trim() };
    if (participant?.sex) {
      entry.sex = participant.sex;
    }
    if (participant?.age_group) {
      entry.age_group = participant.age_group;
    }
    return entry;
  });

  const payload = {
    tour_schedule_id: tourScheduleId,
    type,
    payment_method: paymentMethod,
    members_count: payloadEntries.length,
    participants: payloadEntries,
  };

  const requests =
    typeof specialRequests === "string" ? specialRequests.trim() : "";
  if (requests) {
    payload.special_requests = requests;
  }

  return payload;
}

export async function createBooking(payload) {
  // The payment and gateway objects are siblings of data, so the full response
  // body must survive. The page handles a 401 instead of hard-redirecting.
  const body = await http.post("/bookings", payload, {
    unwrap: false,
    noAuthRedirect: true,
  });

  return {
    booking: body?.data ?? null,
    payment: body?.payment ?? null,
    gateway: body?.gateway ?? null,
  };
}
