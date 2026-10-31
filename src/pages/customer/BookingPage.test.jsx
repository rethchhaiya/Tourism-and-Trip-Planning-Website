// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../../context/AuthContext";
import { PERMISSIONS } from "../../constants/permissions";
import RequireAuth from "../../components/layout/RequireAuth";
import RequirePermission from "../../components/layout/RequirePermission";
import BookingPage from "./BookingPage";
import PaymentPlaceholderPage from "../payment/PaymentPlaceholderPage";
import { fetchTourById } from "../../services/catalogService";
import { createBooking } from "../../services/bookingService";
import { useReferenceData } from "../../hooks/useReferenceData";
import { saveBookingResult } from "../../utils/bookingStorage";

vi.mock("../../services/catalogService", () => ({
  fetchTourById: vi.fn(),
}));

vi.mock("../../services/bookingService", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, createBooking: vi.fn() };
});

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

const TOUR_GUIDE = {
  id: 8,
  name: "Guide",
  email: "guide@example.com",
  roles: [{ id: 4, name: "tour_guide", type: "admin" }],
};

const REFERENCE = {
  booking_types: [
    { value: "Individual", label: "Individual" },
    { value: "Family", label: "Family" },
    { value: "Team", label: "Team" },
  ],
  participant_sex: [
    { value: "Male", label: "Male" },
    { value: "Female", label: "Female" },
    { value: "Other", label: "Other" },
  ],
  payment_methods: [
    { value: "cash", label: "Cash" },
    { value: "bank_transfer", label: "Bank Transfer" },
    { value: "aba_pay", label: "ABA Pay" },
  ],
};

const TOUR = {
  id: 5,
  title: "Angkor Adventure",
  slug: "angkor-adventure",
  base_price: "100.00",
  price_override: null,
  duration_day: 2,
  duration_night: 1,
  status: "published",
  category: null,
  destination: null,
  tourImages: [],
  includeExclude: [],
  tourItinerary: [],
  tourSchedule: [
    {
      id: 11,
      start_datetime: "2099-12-01T08:00:00Z",
      end_datetime: "2099-12-03T18:00:00Z",
      booking_cutoff_datetime: "2099-11-20T00:00:00Z",
      min_capacity: 1,
      max_capacity: 10,
      current_booked: 3,
      price_override: null,
      status: "published",
      notes: "",
    },
    {
      id: 12,
      start_datetime: "2099-12-05T08:00:00Z",
      end_datetime: "2099-12-07T18:00:00Z",
      booking_cutoff_datetime: "2000-01-01T00:00:00Z",
      min_capacity: 1,
      max_capacity: 10,
      current_booked: 2,
      price_override: null,
      status: "published",
      notes: "",
    },
    {
      id: 13,
      start_datetime: "2099-12-10T08:00:00Z",
      end_datetime: "2099-12-12T18:00:00Z",
      booking_cutoff_datetime: "2099-11-25T00:00:00Z",
      min_capacity: 1,
      max_capacity: 2,
      current_booked: 0,
      price_override: 150,
      status: "published",
      notes: "",
    },
    {
      id: 14,
      start_datetime: "2099-12-15T08:00:00Z",
      end_datetime: "2099-12-17T18:00:00Z",
      booking_cutoff_datetime: "2099-11-25T00:00:00Z",
      min_capacity: 1,
      max_capacity: 5,
      current_booked: 5,
      price_override: null,
      status: "published",
      notes: "",
    },
  ],
};

function seedSession(user) {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ token: "test-token", user }),
  );
}

function renderBooking(scheduleId = "11", user = CUSTOMER) {
  if (user) {
    seedSession(user);
  }

  return render(
    <MemoryRouter initialEntries={[`/tours/5/book?schedule=${scheduleId}`]}>
      <AuthProvider>
        <Routes>
          <Route path="/tours/:id/book" element={<BookingPage />} />
          <Route path="/payment/:bookingId" element={<div>payment-page</div>} />
          <Route path="/login" element={<div>login-page</div>} />
          <Route path="/tours/:id" element={<div>tour-page</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  );
}

async function fillValidForm() {
  await screen.findByRole("heading", { name: /Book Angkor Adventure/ });
  fireEvent.change(screen.getByLabelText("Tour type"), {
    target: { value: "Individual" },
  });
  fireEvent.change(screen.getByLabelText("Payment method"), {
    target: { value: "aba_pay" },
  });
  fireEvent.change(screen.getAllByLabelText("Name")[0], {
    target: { value: "Dara" },
  });
  fireEvent.change(screen.getAllByLabelText("Sex")[0], {
    target: { value: "Male" },
  });
  fireEvent.change(screen.getAllByLabelText("Age group")[0], {
    target: { value: "Adult" },
  });
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  fetchTourById.mockReset();
  fetchTourById.mockResolvedValue(TOUR);
  createBooking.mockReset();
  useReferenceData.mockReset();
  useReferenceData.mockReturnValue({
    data: REFERENCE,
    missingKeys: [],
    loading: false,
    error: null,
    retry: vi.fn(),
  });
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
});

describe("BookingPage", () => {
  it("only offers aba_pay and bank_transfer from the reference list", async () => {
    renderBooking();

    const payment = await screen.findByLabelText("Payment method");
    const labels = within(payment)
      .getAllByRole("option")
      .map((option) => option.textContent);

    expect(labels).toContain("ABA Pay");
    expect(labels).toContain("Bank Transfer");
    expect(labels).not.toContain("Cash");
    expect(
      within(payment).queryByRole("option", { name: "Cash" }),
    ).toBeNull();
  });

  it("adds and removes participants and keeps members_count in sync", async () => {
    renderBooking();

    await screen.findByRole("heading", { name: /Book Angkor Adventure/ });
    expect(screen.getByTestId("members-count").textContent).toContain(
      "1 participant",
    );

    fireEvent.click(screen.getByRole("button", { name: "Add participant" }));
    expect(screen.getByTestId("members-count").textContent).toContain(
      "2 participants",
    );

    fireEvent.click(
      screen.getByRole("button", { name: "Remove participant 2" }),
    );
    expect(screen.getByTestId("members-count").textContent).toContain(
      "1 participant",
    );
    expect(
      screen.getByRole("button", { name: "Remove participant 1" }).disabled,
    ).toBe(true);
  });

  it("caps participants at the seats left", async () => {
    renderBooking("13");

    await screen.findByRole("heading", { name: /Book Angkor Adventure/ });
    expect(screen.getByTestId("seats-left").textContent).toContain("2 seats");

    const addButton = screen.getByRole("button", { name: "Add participant" });
    fireEvent.click(addButton);

    expect(screen.getByTestId("members-count").textContent).toContain(
      "2 participants",
    );
    expect(addButton.disabled).toBe(true);
    expect(
      screen.getByText("This departure only has 2 seats left."),
    ).toBeTruthy();
  });

  it("shows no form for a closed schedule", async () => {
    renderBooking("12");

    expect(await screen.findByText("Booking closed")).toBeTruthy();
    expect(screen.queryByLabelText("Tour type")).toBeNull();
    expect(screen.getByRole("link", { name: "Back to tour" })).toBeTruthy();
  });

  it("shows no form for a full schedule", async () => {
    renderBooking("14");

    expect(await screen.findByText("Sold out")).toBeTruthy();
    expect(screen.queryByLabelText("Tour type")).toBeNull();
  });

  it("explains a server-side sold-out error", async () => {
    createBooking.mockRejectedValue({
      status: 409,
      message: "This schedule is full.",
    });

    renderBooking();
    await fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: "Confirm booking" }));

    expect(
      await screen.findByText(
        "This departure is sold out. Please choose another departure.",
      ),
    ).toBeTruthy();
  });

  it("explains a server-side closed departure", async () => {
    createBooking.mockRejectedValue({
      status: 409,
      message: "Booking is closed for this departure.",
    });

    renderBooking();
    await fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: "Confirm booking" }));

    expect(
      await screen.findByText(
        "This departure is closed for booking. Please choose another departure.",
      ),
    ).toBeTruthy();
  });

  it("warns when the network fails before confirmation", async () => {
    createBooking.mockRejectedValue({ status: 0 });

    renderBooking();
    await fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: "Confirm booking" }));

    expect(
      await screen.findByText(
        "We couldn't confirm whether your booking was created. Please check before trying again.",
      ),
    ).toBeTruthy();
    expect(screen.queryByText(/raw/i)).toBeNull();
  });

  it("maps 422 field errors, including participant fields", async () => {
    createBooking.mockRejectedValue({
      status: 422,
      message: "The given data was invalid.",
      errors: {
        "participants.0.name": ["The name field is required."],
      },
    });

    renderBooking();
    await fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: "Confirm booking" }));

    expect(
      await screen.findByText("The name field is required."),
    ).toBeTruthy();
    expect(
      screen.getByRole("alert").textContent,
    ).toContain("Please check the highlighted fields");
  });

  it("prevents double submits while the request is in flight", async () => {
    createBooking.mockReturnValue(new Promise(() => {}));

    renderBooking();
    await fillValidForm();

    const submit = screen.getByRole("button", { name: "Confirm booking" });
    fireEvent.click(submit);
    fireEvent.click(submit);

    await waitFor(() => expect(createBooking).toHaveBeenCalledTimes(1));
    expect(submit.disabled).toBe(true);
  });

  it("stores the full response and navigates to the payment route", async () => {
    const response = {
      booking: { id: 99, total_price: "250.00", status: "pending" },
      payment: { id: 1, booking_id: 99, amount: "250.00" },
      gateway: {
        tran_id: "tran-1",
        status: "pending",
        response: { qrString: "SECRET-QR", qrImage: "data:image/png;base64,x" },
      },
    };
    createBooking.mockResolvedValue(response);

    renderBooking();
    await fillValidForm();
    fireEvent.click(screen.getByRole("button", { name: "Confirm booking" }));

    expect(await screen.findByText("payment-page")).toBeTruthy();
    const stored = JSON.parse(
      sessionStorage.getItem("traveladmin.booking.99"),
    );
    expect(stored).toEqual(response);
    expect(screen.queryByText("SECRET-QR")).toBeNull();
  });
});

describe("booking route guards", () => {
  function LoginStub() {
    const location = useLocation();
    return (
      <div>
        <span>login-page</span>
        <span>{location.state?.from ?? "no-from"}</span>
      </div>
    );
  }

  function renderRoute(user) {
    if (user) {
      seedSession(user);
    }
    return render(
      <MemoryRouter initialEntries={["/tours/5/book?schedule=11"]}>
        <AuthProvider>
          <Routes>
            <Route element={<RequireAuth />}>
              <Route
                element={
                  <RequirePermission
                    permission={PERMISSIONS.STORE_BOOKINGS}
                  />
                }
              >
                <Route
                  path="/tours/:id/book"
                  element={<div>booking-form</div>}
                />
              </Route>
            </Route>
            <Route path="/login" element={<LoginStub />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );
  }

  it("sends guests to login and preserves the schedule in the return path", () => {
    renderRoute();

    expect(screen.getByText("login-page")).toBeTruthy();
    expect(
      screen.getByText("/tours/5/book?schedule=11"),
    ).toBeTruthy();
  });

  it("shows a not-allowed message without store_bookings", async () => {
    renderRoute(TOUR_GUIDE);

    expect(await screen.findByText("Access denied")).toBeTruthy();
    expect(screen.queryByText("booking-form")).toBeNull();
  });
});

describe("PaymentPlaceholderPage", () => {
  it("shows only the booking id, total and status", () => {
    saveBookingResult({
      booking: { id: 99, total_price: "250.00", status: "pending" },
      payment: { id: 1 },
      gateway: { response: { qrString: "SECRET-QR" } },
    });

    render(
      <MemoryRouter initialEntries={["/payment/99"]}>
        <Routes>
          <Route
            path="/payment/:bookingId"
            element={<PaymentPlaceholderPage />}
          />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("#99")).toBeTruthy();
    expect(screen.getByText("$250.00")).toBeTruthy();
    expect(screen.getByText("pending")).toBeTruthy();
    expect(screen.queryByText("SECRET-QR")).toBeNull();
  });
});
