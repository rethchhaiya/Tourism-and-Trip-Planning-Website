import { http } from "./httpClient";

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
