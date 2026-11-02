// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import {
  MemoryRouter,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../../context/AuthContext";
import { PERMISSIONS } from "../../constants/permissions";
import RequireAuth from "../../components/layout/RequireAuth";
import RequirePermission from "../../components/layout/RequirePermission";
import MyBookingsPage from "./MyBookingsPage";
import MyBookingDetailPage from "./MyBookingDetailPage";
import {
  cancelBooking,
  getBooking,
  listBookings,
} from "../../services/bookingService";
import { useReferenceData } from "../../hooks/useReferenceData";
import { GENERIC_CANCEL_ERROR } from "../../utils/bookingDisplay";

vi.mock("../../services/bookingService", () => ({
  listBookings: vi.fn(),
  getBooking: vi.fn(),
  cancelBooking: vi.fn(),
}));

vi.mock("../../hooks/useReferenceData", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, useReferenceData: vi.fn() };
});

vi.mock("../../components/Header", () => ({
  default: () => <header data-testid="header" />,
}));

vi.mock("../../components/Footer", () => ({
  default: () => <footer data-testid="footer" />,
}));

const SESSION_KEY = "traveladmin.session";

const CUSTOMER = {
  id: 7,
  name: "Customer",
  email: "customer@example.com",
  roles: [{ id: 5, name: "customer", type: "user" }],
};

const ADMIN_CUSTOMER = {
  id: 7,
  name: "Admin Customer",
  email: "admin@example.com",
  roles: [
    { id: 2, name: "admin", type: "admin" },
    { id: 5, name: "customer", type: "user" },
  ],
};

const TOUR_GUIDE = {
  id: 8,
  name: "Guide",
  email: "guide@example.com",
  roles: [{ id: 4, name: "tour_guide", type: "admin" }],
};

const REFERENCE = {
  data: {
    booking_statuses: [
      { value: "pending", label: "Pending" },
      { value: "confirmed", label: "Confirmed" },
      { value: "cancelled", label: "Cancelled" },
      { value: "completed", label: "Completed" },
    ],
    booking_types: [
      { value: "Individual", label: "Individual" },
      { value: "Family", label: "Family" },
      { value: "Team", label: "Team" },
    ],
  },
  missingKeys: [],
  loading: false,
  error: null,
  retry: vi.fn(),
};

const OWNED_BOOKING = {
  id: 10,
  title: "Angkor Adventure",
  tourId: 3,
  scheduleId: 11,
  scheduleLabel: "Jun 15, 2026 – Jun 17, 2026",
  totalPrice: 250,
  status: "pending",
  type: "Individual",
  membersCount: 2,
  userId: 7,
};

const OTHER_BOOKING = {
  id: 11,
  title: "Other customer tour",
  tourId: 4,
  scheduleId: 12,
  scheduleLabel: "Schedule #12",
  totalPrice: 100,
  status: "confirmed",
  type: "Family",
  membersCount: 1,
  userId: 8,
};

const DETAIL_BOOKING = {
  id: 10,
  userId: 7,
  tourId: 3,
  title: "Angkor Adventure",
  status: "pending",
  type: "Individual",
  membersCount: 2,
  totalPrice: 250,
  specialRequests: "Vegetarian meals",
  scheduleId: 11,
  scheduleLabel: "Jun 15, 2026 – Jun 17, 2026",
  schedule: { id: 11, maxCapacity: 10, currentBooked: 2 },
  participants: [
    { name: "Dara", sex: "Male", ageGroup: "Adult" },
    { name: "Sophea", sex: "", ageGroup: "" },
  ],
  userName: "Dara Sok",
  paymentStatus: "pending",
  paymentMethod: "aba_pay",
};

function pageResult({
  bookings = [OWNED_BOOKING, OTHER_BOOKING],
  currentPage = 1,
  total = bookings.length,
  perPage = 10,
  lastPage = 1,
} = {}) {
  return { bookings, currentPage, total, perPage, lastPage };
}

function seedSession(user) {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ token: "test-token", user }),
  );
}

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{`${location.pathname}${location.search}`}</div>;
}

function renderAt(path, user) {
  if (user) {
    seedSession(user);
  }

  return render(
    <MemoryRouter initialEntries={[path]}>
      <LocationProbe />
      <AuthProvider>
        <Routes>
          <Route element={<RequireAuth />}>
            <Route
              element={
                <RequirePermission permission={PERMISSIONS.VIEW_BOOKINGS} />
              }
            >
              <Route path="/my-bookings" element={<MyBookingsPage />} />
              <Route
                path="/my-bookings/:id"
                element={<MyBookingDetailPage />}
              />
            </Route>
          </Route>
          <Route path="/login" element={<div>login-page</div>} />
          <Route path="/tours" element={<div>tours-page</div>} />
          <Route
            path="/payment/:bookingId"
            element={<div>payment-page</div>}
          />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  window.confirm = vi.fn(() => true);
  listBookings.mockReset();
  getBooking.mockReset();
  cancelBooking.mockReset();
  useReferenceData.mockReset();
  listBookings.mockResolvedValue(pageResult());
  useReferenceData.mockReturnValue(REFERENCE);
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
});

describe("MyBookingsPage", () => {
  it("shows a loading skeleton while the request is in flight", async () => {
    listBookings.mockReturnValue(new Promise(() => {}));

    renderAt("/my-bookings", CUSTOMER);

    expect(await screen.findByTestId("bookings-loading")).toBeTruthy();
  });

  it("reads filters and page from the URL and sends them to the API", async () => {
    renderAt("/my-bookings?status=pending&type=Family&page=2", CUSTOMER);

    await waitFor(() =>
      expect(listBookings).toHaveBeenCalledWith({
        page: 2,
        perPage: 10,
        status: "pending",
        type: "Family",
      }),
    );
  });

  it("writes filter changes to the URL and resets the page", async () => {
    renderAt("/my-bookings?page=3", CUSTOMER);

    const select = await screen.findByLabelText("Filter by status");
    fireEvent.change(select, { target: { value: "confirmed" } });

    await waitFor(() =>
      expect(listBookings).toHaveBeenLastCalledWith({
        page: 1,
        perPage: 10,
        status: "confirmed",
        type: "",
      }),
    );
    expect(screen.getByTestId("location").textContent).toBe(
      "/my-bookings?status=confirmed",
    );
  });

  it("renders bookings, status, total, members and a detail link", async () => {
    renderAt("/my-bookings", CUSTOMER);

    expect(await screen.findByText("Angkor Adventure")).toBeTruthy();
    expect(screen.getAllByText("Pending").length).toBeGreaterThan(0);
    expect(screen.getByText("$250.00")).toBeTruthy();
    expect(screen.getByText("2 members")).toBeTruthy();
    expect(screen.getAllByText("Individual").length).toBeGreaterThan(0);
    expect(
      screen.getByRole("link", { name: "Angkor Adventure" }).getAttribute(
        "href",
      ),
    ).toBe("/my-bookings/10");
  });

  it("shows the empty state with a link to the tours page", async () => {
    listBookings.mockResolvedValue(
      pageResult({ bookings: [], total: 0 }),
    );

    renderAt("/my-bookings", CUSTOMER);

    expect(await screen.findByText("No bookings yet")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Browse tours" }).getAttribute("href"),
    ).toBe("/tours");
  });

  it("shows an error state and retries", async () => {
    listBookings.mockRejectedValueOnce(new Error("Unable to reach the server."));

    renderAt("/my-bookings", CUSTOMER);

    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.getByText(/couldn't load your bookings/i)).toBeTruthy();

    listBookings.mockResolvedValue(pageResult());
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByText("Angkor Adventure")).toBeTruthy();
  });

  it("filters an admin + customer view to the logged-in user's bookings", async () => {
    renderAt("/my-bookings", ADMIN_CUSTOMER);

    expect(await screen.findByText("Angkor Adventure")).toBeTruthy();
    expect(screen.queryByText("Other customer tour")).toBeNull();
  });

  it("does not filter a customer-only view", async () => {
    renderAt("/my-bookings", CUSTOMER);

    expect(await screen.findByText("Angkor Adventure")).toBeTruthy();
    expect(screen.getByText("Other customer tour")).toBeTruthy();
    expect(
      screen.queryByText(/Showing only bookings that belong to your account/i),
    ).toBeNull();
  });

  it("paginates with the current page and last page", async () => {
    listBookings.mockResolvedValue(
      pageResult({ currentPage: 2, total: 25, lastPage: 3 }),
    );

    renderAt("/my-bookings?page=2", CUSTOMER);

    expect(await screen.findByText("Page 2 of 3")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Previous" }).disabled).toBe(
      false,
    );

    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    await waitFor(() =>
      expect(listBookings).toHaveBeenLastCalledWith({
        page: 3,
        perPage: 10,
        status: "",
        type: "",
      }),
    );
    expect(screen.getByTestId("location").textContent).toBe(
      "/my-bookings?page=3",
    );
  });

  it("redirects a guest to login", async () => {
    renderAt("/my-bookings");

    expect(await screen.findByText("login-page")).toBeTruthy();
    expect(listBookings).not.toHaveBeenCalled();
  });
});

describe("MyBookingDetailPage", () => {
  it("renders booking details, participants, payment and the payment link", async () => {
    getBooking.mockResolvedValue(DETAIL_BOOKING);

    renderAt("/my-bookings/10", CUSTOMER);

    expect(await screen.findByRole("heading", { name: "Angkor Adventure" })).toBeTruthy();
    expect(screen.getAllByText("Booking #10").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Pending").length).toBeGreaterThan(0);
    expect(screen.getByText("Individual")).toBeTruthy();
    expect(screen.getByText("2 members")).toBeTruthy();
    expect(screen.getByText("$250.00")).toBeTruthy();
    expect(screen.getByText("Vegetarian meals")).toBeTruthy();
    expect(screen.getByText("Dara")).toBeTruthy();
    expect(screen.getByText("Sophea")).toBeTruthy();
    expect(screen.getByText("Jun 15, 2026 – Jun 17, 2026")).toBeTruthy();
    expect(screen.getByText("2 / 10")).toBeTruthy();
    expect(screen.getByText("Dara Sok")).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Continue payment" }).getAttribute(
        "href",
      ),
    ).toBe("/payment/10");
    expect(
      screen.getByRole("button", { name: "Cancel booking" }),
    ).toBeTruthy();
  });

  it("shows Booking not found for a 404", async () => {
    getBooking.mockRejectedValue({ status: 404 });

    renderAt("/my-bookings/10", CUSTOMER);

    expect(await screen.findByText("Booking not found")).toBeTruthy();
  });

  it("shows Booking not found for another customer's booking", async () => {
    getBooking.mockResolvedValue({ ...DETAIL_BOOKING, userId: 8 });

    renderAt("/my-bookings/10", CUSTOMER);

    expect(await screen.findByText("Booking not found")).toBeTruthy();
    expect(screen.queryByText("Angkor Adventure")).toBeNull();
  });

  it("lets staff view a booking they do not own", async () => {
    getBooking.mockResolvedValue({ ...DETAIL_BOOKING, userId: 7 });

    renderAt("/my-bookings/10", TOUR_GUIDE);

    expect(
      await screen.findByRole("heading", { name: "Angkor Adventure" }),
    ).toBeTruthy();
    expect(screen.queryByText("Booking not found")).toBeNull();
  });

  it("hides the cancel button without cancel_bookings", async () => {
    getBooking.mockResolvedValue({ ...DETAIL_BOOKING, status: "pending" });

    renderAt("/my-bookings/10", TOUR_GUIDE);

    expect(
      await screen.findByRole("heading", { name: "Angkor Adventure" }),
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Cancel booking" })).toBeNull();
  });

  it("hides the cancel button for completed bookings", async () => {
    getBooking.mockResolvedValue({ ...DETAIL_BOOKING, status: "completed" });

    renderAt("/my-bookings/10", CUSTOMER);

    expect(
      await screen.findByText(
        "This booking is completed and can no longer be cancelled.",
      ),
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Cancel booking" })).toBeNull();
  });

  it("asks for confirmation before cancelling", async () => {
    getBooking.mockResolvedValue(DETAIL_BOOKING);
    window.confirm = vi.fn(() => false);

    renderAt("/my-bookings/10", CUSTOMER);

    fireEvent.click(
      await screen.findByRole("button", { name: "Cancel booking" }),
    );

    expect(window.confirm).toHaveBeenCalledWith(
      "Cancel this booking? The seats will be released.",
    );
    expect(cancelBooking).not.toHaveBeenCalled();
  });

  it("updates the status after a successful cancellation", async () => {
    getBooking.mockResolvedValue(DETAIL_BOOKING);
    cancelBooking.mockResolvedValue({
      id: 10,
      status: "cancelled",
      schedule: null,
    });

    renderAt("/my-bookings/10", CUSTOMER);

    fireEvent.click(
      await screen.findByRole("button", { name: "Cancel booking" }),
    );

    expect(await screen.findByText("Cancelled")).toBeTruthy();
    expect(
      screen.getByText(
        "This booking has been cancelled. Any refund depends on the tour policy.",
      ),
    ).toBeTruthy();
    expect(cancelBooking).toHaveBeenCalledWith(10);
    expect(screen.queryByRole("button", { name: "Cancel booking" })).toBeNull();
  });

  it("replaces an unsafe backend error with a generic message", async () => {
    getBooking.mockResolvedValue(DETAIL_BOOKING);
    cancelBooking.mockRejectedValue({
      message: "SQLSTATE[HY000] connection failed in /app/BookingService.php",
      exception: "PDOException",
      file: "/app/BookingService.php",
    });

    renderAt("/my-bookings/10", CUSTOMER);

    fireEvent.click(
      await screen.findByRole("button", { name: "Cancel booking" }),
    );

    expect(await screen.findByText(GENERIC_CANCEL_ERROR)).toBeTruthy();
    expect(screen.queryByText(/SQLSTATE/)).toBeNull();
    expect(screen.queryByText(/BookingService\.php/)).toBeNull();
  });

  it("shows a clear message for an already-cancelled booking", async () => {
    getBooking.mockResolvedValue({ ...DETAIL_BOOKING, status: "cancelled" });

    renderAt("/my-bookings/10", CUSTOMER);

    expect(
      await screen.findByText("This booking is already cancelled."),
    ).toBeTruthy();
  });
});
