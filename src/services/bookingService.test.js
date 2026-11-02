import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./httpClient", () => ({
  http: { post: vi.fn(), get: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

import { http } from "./httpClient";
import {
  buildBookingPayload,
  cancelBooking,
  createBooking,
  deleteBooking,
  getBooking,
  listBookings,
  normalizeBookingDetail,
  normalizeBookingListItem,
} from "./bookingService";

beforeEach(() => {
  http.post.mockReset();
  http.get.mockReset();
  http.patch.mockReset();
  http.delete.mockReset();
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

describe("normalizeBookingListItem", () => {
  it("maps the documented list fields and nested tour/schedule", () => {
    const mapped = normalizeBookingListItem({
      id: 5,
      tour_schedule_id: 11,
      total_price: "250.00",
      status: "PENDING",
      type: "Family",
      members_count: 2,
      user_id: 7,
      tour: { id: 3, title: "Angkor Adventure" },
      tour_schedule: {
        id: 11,
        start_datetime: "2026-06-15T08:00:00Z",
        end_datetime: "2026-06-17T18:00:00Z",
      },
    });

    expect(mapped).toMatchObject({
      id: 5,
      title: "Angkor Adventure",
      tourId: 3,
      scheduleId: 11,
      totalPrice: 250,
      status: "pending",
      type: "Family",
      membersCount: 2,
      userId: 7,
    });
    expect(mapped.scheduleLabel).toMatch(/Jun 15, 2026/);
    expect(mapped.scheduleLabel).toContain("–");
  });

  it("falls back to the booking id and schedule id when fields are missing", () => {
    const mapped = normalizeBookingListItem({ id: 12, tour_schedule_id: 4 });

    expect(mapped.title).toBe("Booking #12");
    expect(mapped.scheduleLabel).toBe("Schedule #4");
    expect(mapped.status).toBe("unknown");
    expect(mapped.totalPrice).toBeNull();
    expect(mapped.membersCount).toBeNull();
    expect(mapped.userId).toBeNull();
  });

  it("tolerates a completely empty item", () => {
    expect(normalizeBookingListItem({})).toMatchObject({
      title: "Booking",
      scheduleLabel: "Schedule unavailable",
      status: "unknown",
      userId: null,
    });
  });
});

describe("normalizeBookingDetail", () => {
  it("maps participants, schedule, payment and optional fields", () => {
    const mapped = normalizeBookingDetail({
      id: 5,
      user_id: 7,
      status: "Confirmed",
      type: "Individual",
      total_price: "99.50",
      special_requests: "  Vegetarian meals  ",
      participants: [
        { name: "Dara", sex: "Male", age_group: "Adult" },
        { name: "Sophea" },
      ],
      tour_schedule: {
        id: 11,
        max_capacity: 20,
        current_booked: 5,
        start_datetime: "2026-06-15T08:00:00Z",
        end_datetime: "2026-06-15T18:00:00Z",
      },
      tour: { title: "Angkor Adventure" },
      user: { name: "Dara Sok" },
      payment: { status: "PAID", payment_method: "aba_pay" },
    });

    expect(mapped).toMatchObject({
      id: 5,
      userId: 7,
      title: "Angkor Adventure",
      status: "confirmed",
      type: "Individual",
      totalPrice: 99.5,
      specialRequests: "Vegetarian meals",
      userName: "Dara Sok",
      paymentStatus: "paid",
      paymentMethod: "aba_pay",
      schedule: { id: 11, maxCapacity: 20, currentBooked: 5 },
      membersCount: 2,
    });
    expect(mapped.participants).toEqual([
      { name: "Dara", sex: "Male", ageGroup: "Adult" },
      { name: "Sophea", sex: "", ageGroup: "" },
    ]);
  });

  it("falls back to the booking id and a schedule id with no dates", () => {
    const mapped = normalizeBookingDetail({
      id: 9,
      tour_schedule: { id: 3 },
    });

    expect(mapped.title).toBe("Booking #9");
    expect(mapped.scheduleLabel).toBe("Schedule #3");
    expect(mapped.participants).toEqual([]);
    expect(mapped.paymentStatus).toBe("");
  });
});

describe("listBookings", () => {
  it("sends pagination and filters and computes lastPage", async () => {
    http.get.mockResolvedValue({
      current_page: 2,
      data: [
        { id: 1, status: "pending" },
        { id: 2, status: "confirmed" },
      ],
      total: 25,
      per_page: 10,
    });

    const result = await listBookings({
      page: 2,
      perPage: 10,
      status: "pending",
      type: "Family",
    });

    expect(http.get).toHaveBeenCalledWith(
      "/bookings?page=2&per_page=10&status=pending&type=Family",
    );
    expect(result.currentPage).toBe(2);
    expect(result.total).toBe(25);
    expect(result.perPage).toBe(10);
    expect(result.lastPage).toBe(3);
    expect(result.bookings).toHaveLength(2);
  });

  it("tolerates an un-unwrapped { success, data } envelope", async () => {
    http.get.mockResolvedValue({
      success: true,
      message: "Bookings retrieved.",
      data: {
        current_page: 1,
        data: [{ id: 1, status: "pending" }],
        total: 1,
        per_page: 10,
      },
    });

    const result = await listBookings();

    expect(result.bookings[0]).toMatchObject({
      id: 1,
      title: "Booking #1",
      status: "pending",
    });
    expect(result.lastPage).toBe(1);
  });
});

describe("getBooking", () => {
  it("unwraps { data } and normalizes the detail", async () => {
    http.get.mockResolvedValue({
      data: { id: 5, status: "pending" },
    });

    const result = await getBooking(5);

    expect(http.get).toHaveBeenCalledWith("/bookings/5");
    expect(result).toMatchObject({
      id: 5,
      title: "Booking #5",
      status: "pending",
    });
  });

  it("returns null for an empty payload", async () => {
    http.get.mockResolvedValue(null);
    await expect(getBooking(5)).resolves.toBeNull();
  });
});

describe("cancelBooking", () => {
  it("patches the cancel endpoint and returns the updated status", async () => {
    http.patch.mockResolvedValue({
      id: 5,
      status: "cancelled",
      tour_schedule: { id: 11, max_capacity: 10, current_booked: 2 },
    });

    const result = await cancelBooking(5);

    expect(http.patch).toHaveBeenCalledWith("/bookings/5/cancel");
    expect(result).toEqual({
      id: 5,
      status: "cancelled",
      schedule: { id: 11, maxCapacity: 10, currentBooked: 2 },
    });
  });

  it("defaults the status to cancelled when the response has no status", async () => {
    http.patch.mockResolvedValue({ id: 5 });
    await expect(cancelBooking(5)).resolves.toMatchObject({
      id: 5,
      status: "cancelled",
      schedule: null,
    });
  });
});

describe("deleteBooking", () => {
  it("deletes the booking and returns its id", async () => {
    http.delete.mockResolvedValue(null);

    await expect(deleteBooking("5/ok")).resolves.toEqual({ id: "5/ok" });
    expect(http.delete).toHaveBeenCalledWith("/bookings/5%2Fok");
  });
});
