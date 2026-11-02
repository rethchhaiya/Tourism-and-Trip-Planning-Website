// @vitest-environment jsdom
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "../../../context/AuthContext";
import { listCategories } from "../../../services/adminCategoryService";
import {
  createTour,
  getAdminTour,
  updateTour,
} from "../../../services/adminTourService";
import { fetchReferenceDataResult } from "../../../services/referenceService";
import TourFormPage from "./TourFormPage";

vi.mock("../../../services/adminCategoryService", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, listCategories: vi.fn() };
});

vi.mock("../../../services/adminTourService", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    createTour: vi.fn(),
    getAdminTour: vi.fn(),
    updateTour: vi.fn(),
  };
});

vi.mock("../../../services/referenceService", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, fetchReferenceDataResult: vi.fn() };
});

const SESSION_KEY = "traveladmin.session";

const USERS = {
  admin: { roles: [{ id: 2, name: "admin", type: "admin" }] },
  tour_manager: { roles: [{ id: 3, name: "tour_manager", type: "admin" }] },
  tour_guide: { roles: [{ id: 4, name: "tour_guide", type: "admin" }] },
};

const DETAIL = {
  id: 7,
  title: "Kyoto Discovery",
  slug: "kyoto-discovery",
  category: { id: 3, name: "Cultural" },
  destination: { id: 9, name: "Kyoto" },
  durationDays: 4,
  durationNights: 3,
  basePrice: 1200,
  priceOverride: null,
  status: "published",
  primaryImage: "",
  images: [],
};

const CATEGORIES = [
  { id: 3, name: "Cultural", status: 1 },
  { id: 4, name: "Beach", status: 1 },
  { id: 5, name: "Inactive", status: 0 },
];

function LocationProbe() {
  const location = useLocation();
  return (
    <div data-testid="location">{`${location.pathname}${location.search}`}</div>
  );
}

function renderForm(user, { entries = ["/admin/tours/7/edit"] } = {}) {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({ token: "test-token", user }),
  );
  return render(
    <MemoryRouter initialEntries={entries}>
      <AuthProvider>
        <Routes>
          <Route path="/admin/tours" element={<div>list-page</div>} />
          <Route
            path="/admin/tours/new"
            element={<TourFormPage mode="create" />}
          />
          <Route
            path="/admin/tours/:id/edit"
            element={<TourFormPage mode="edit" />}
          />
        </Routes>
        <LocationProbe />
      </AuthProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  listCategories.mockResolvedValue(CATEGORIES);
  getAdminTour.mockResolvedValue(DETAIL);
  createTour.mockResolvedValue({ id: 77 });
  updateTour.mockResolvedValue({});
  fetchReferenceDataResult.mockResolvedValue({
    data: {
      tour_statuses: [
        { value: "DRAFT", label: "Draft" },
        { value: "PUBLISHED", label: "Live" },
        { value: "ARCHIVED", label: "Archived" },
      ],
    },
    missingKeys: [],
  });
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("TourFormPage", () => {
  it("prefills the edit form from the detail response", async () => {
    renderForm(USERS.admin);

    const title = await screen.findByLabelText("Title");
    await screen.findByRole("option", { name: "Cultural" });

    expect(title).toHaveProperty("value", "Kyoto Discovery");
    expect(screen.getByLabelText("Slug")).toHaveProperty("readOnly", true);
    expect(screen.getByLabelText("Category")).toHaveProperty("value", "3");
    expect(screen.getByLabelText("Destination ID")).toHaveProperty(
      "value",
      "9",
    );
    expect(screen.getByLabelText("Duration (days)")).toHaveProperty(
      "value",
      "4",
    );
    expect(screen.getByLabelText("Duration (nights)")).toHaveProperty(
      "value",
      "3",
    );
    expect(screen.getByLabelText("Base price")).toHaveProperty("value", "1200");
    expect(screen.getByLabelText("Price override")).toHaveProperty("value", "");
    expect(screen.getByLabelText("Status")).toHaveProperty(
      "value",
      "published",
    );
    expect(screen.getByRole("option", { name: "Live" })).toBeDefined();
    expect(screen.getByText("Kyoto")).toBeDefined();
    expect(screen.getByRole("button", { name: "Save changes" })).toBeDefined();
  });

  it("validates required and numeric fields before saving", async () => {
    renderForm(USERS.admin);

    await screen.findByLabelText("Title");
    await screen.findByRole("option", { name: "Cultural" });

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "   " },
    });
    fireEvent.change(screen.getByLabelText("Category"), {
      target: { value: "" },
    });
    fireEvent.change(screen.getByLabelText("Destination ID"), {
      target: { value: "0" },
    });
    fireEvent.change(screen.getByLabelText("Duration (days)"), {
      target: { value: "0" },
    });
    fireEvent.change(screen.getByLabelText("Duration (nights)"), {
      target: { value: "-1" },
    });
    fireEvent.change(screen.getByLabelText("Base price"), {
      target: { value: "1.234" },
    });
    fireEvent.change(screen.getByLabelText("Price override"), {
      target: { value: "-2" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(screen.getByText("Title is required.")).toBeDefined();
    expect(screen.getByText("Select a category.")).toBeDefined();
    expect(screen.getByText("Enter a valid destination ID.")).toBeDefined();
    expect(
      screen.getByText("Duration days must be a whole number of at least 1."),
    ).toBeDefined();
    expect(
      screen.getByText("Duration nights must be a whole number of at least 0."),
    ).toBeDefined();
    expect(
      screen.getByText(
        "Base price must be a number of at least 0 with up to 2 decimals.",
      ),
    ).toBeDefined();
    expect(
      screen.getByText(
        "Price override must be a number of at least 0 with up to 2 decimals.",
      ),
    ).toBeDefined();
    expect(updateTour).not.toHaveBeenCalled();
  });

  it("maps 422 errors from request field names onto form fields", async () => {
    updateTour.mockRejectedValue({
      status: 422,
      errors: {
        duration_days: ["Duration must be at least 1."],
        status: ["Status is invalid."],
      },
    });
    renderForm(USERS.admin);

    await screen.findByLabelText("Title");
    await screen.findByRole("option", { name: "Cultural" });
    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "Updated title" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByText("Duration must be at least 1.")).toBeDefined();
    expect(screen.getByText("Status is invalid.")).toBeDefined();
  });

  it("re-fetches after edit and warns when saved values differ", async () => {
    getAdminTour
      .mockResolvedValueOnce(DETAIL)
      .mockResolvedValueOnce({ ...DETAIL, durationDays: 4 });
    renderForm(USERS.admin);

    await screen.findByLabelText("Title");
    fireEvent.change(screen.getByLabelText("Duration (days)"), {
      target: { value: "5" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(updateTour).toHaveBeenCalledWith(7, { duration_days: 5 });
    });
    expect(getAdminTour).toHaveBeenCalledTimes(2);
    expect(
      await screen.findByText("Some values were not saved as entered"),
    ).toBeDefined();
    expect(screen.getByLabelText("Duration (days)")).toHaveProperty(
      "value",
      "4",
    );
  });

  it("creates a tour and opens its edit page when an id is returned", async () => {
    renderForm(USERS.admin, {
      entries: ["/admin/tours/new"],
    });

    await screen.findByLabelText("Title");
    await screen.findByRole("option", { name: "Cultural" });

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "  New Tour  " },
    });
    fireEvent.change(screen.getByLabelText("Category"), {
      target: { value: "4" },
    });
    fireEvent.change(screen.getByLabelText("Destination ID"), {
      target: { value: "9" },
    });
    fireEvent.change(screen.getByLabelText("Duration (days)"), {
      target: { value: "3" },
    });
    fireEvent.change(screen.getByLabelText("Duration (nights)"), {
      target: { value: "2" },
    });
    fireEvent.change(screen.getByLabelText("Base price"), {
      target: { value: "500.00" },
    });
    fireEvent.change(screen.getByLabelText("Status"), {
      target: { value: "published" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Create tour" }));

    await waitFor(() => {
      expect(createTour).toHaveBeenCalledWith({
        category_id: 4,
        destination_id: 9,
        title: "New Tour",
        duration_days: 3,
        duration_nights: 2,
        base_price: 500,
        price_override: null,
        status: "published",
      });
    });
    await waitFor(() => {
      expect(screen.getByTestId("location").textContent).toBe(
        "/admin/tours/77/edit",
      );
    });
  });

  it("shows a read-only message to a view-only tour guide", async () => {
    renderForm(USERS.tour_guide);

    const title = await screen.findByLabelText("Title");
    expect(
      screen.getByText(
        "You can view this tour but you do not have permission to edit it.",
      ),
    ).toBeDefined();
    expect(title).toHaveProperty("disabled", true);
    expect(screen.queryByRole("button", { name: "Save changes" })).toBeNull();
  });

  it("retries loading categories after an error", async () => {
    listCategories.mockRejectedValueOnce({ status: 500 });
    renderForm(USERS.admin);

    await screen.findByLabelText("Title");
    expect(await screen.findByText("Could not load categories.")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(
      await screen.findByRole("option", { name: "Cultural" }),
    ).toBeDefined();
  });
});
