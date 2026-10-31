import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./httpClient", () => ({
  http: { post: vi.fn() },
}));

import { http } from "./httpClient";
import { buildBookingPayload, createBooking } from "./bookingService";

beforeEach(() => {
  http.post.mockReset();
});

describe("buildBookingPayload", () => {
  it("trims names, omits empty optional fields, and derives members_count", () => {
    const payload = buildBookingPayload({
      tourScheduleId: 11,
      type: "Individual",
      paymentMethod: "aba_pay",
      specialRequests: "   ",
      participants: [
        { name: "  Sok Dara  ", sex: "Male", age_group: "Adult" },
        { name: "   ", sex: "", age_group: "" },
      ],
    });

    expect(payload).toEqual({
      tour_schedule_id: 11,
      type: "Individual",
      payment_method: "aba_pay",
      members_count: 2,
      participants: [
        { name: "Sok Dara", sex: "Male", age_group: "Adult" },
        { name: "" },
      ],
    });
    expect(payload).not.toHaveProperty("special_requests");
  });

  it("includes trimmed special requests when provided", () => {
    const payload = buildBookingPayload({
      tourScheduleId: 12,
      type: "Family",
      paymentMethod: "bank_transfer",
      specialRequests: "  Vegetarian meals  ",
      participants: [{ name: "Dara", sex: "Female", age_group: "Adult" }],
    });

    expect(payload.special_requests).toBe("Vegetarian meals");
    expect(payload.members_count).toBe(1);
  });
});

describe("createBooking", () => {
  it("requests the full body and keeps payment and gateway siblings", async () => {
    const body = {
      success: true,
      message: "Booking created.",
      data: { id: 99, total_price: "250.00", status: "pending" },
      payment: { id: 1, booking_id: 99, amount: "250.00" },
      gateway: { tran_id: "tran-1", status: "pending" },
    };
    http.post.mockResolvedValue(body);
    const payload = { tour_schedule_id: 11 };

    const result = await createBooking(payload);

    expect(http.post).toHaveBeenCalledWith("/bookings", payload, {
      unwrap: false,
      noAuthRedirect: true,
    });
    expect(result).toEqual({
      booking: body.data,
      payment: body.payment,
      gateway: body.gateway,
    });
  });
});
