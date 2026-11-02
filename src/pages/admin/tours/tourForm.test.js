import { describe, expect, it } from "vitest";
import {
  FALLBACK_TOUR_STATUS_OPTIONS,
  buildTourStatusOptions,
  validateTourForm,
} from "./tourForm";

const VALID = {
  title: "Kyoto Discovery",
  categoryId: "3",
  destinationId: "9",
  durationDays: "4",
  durationNights: "3",
  basePrice: "1200.00",
  priceOverride: "",
  status: "draft",
};

describe("validateTourForm", () => {
  it("accepts a valid form and an empty optional override", () => {
    expect(validateTourForm(VALID)).toEqual({});
  });

  it("applies the documented numeric and required-field rules", () => {
    expect(
      validateTourForm({
        title: "   ",
        categoryId: "0",
        destinationId: "-1",
        durationDays: "0",
        durationNights: "-1",
        basePrice: "1.234",
        priceOverride: "-2",
        status: "",
      }),
    ).toEqual({
      title: "Title is required.",
      categoryId: "Select a category.",
      destinationId: "Enter a valid destination ID.",
      durationDays: "Duration days must be a whole number of at least 1.",
      durationNights: "Duration nights must be a whole number of at least 0.",
      basePrice:
        "Base price must be a number of at least 0 with up to 2 decimals.",
      priceOverride:
        "Price override must be a number of at least 0 with up to 2 decimals.",
      status: "Select a status.",
    });
  });

  it("rejects decimal durations", () => {
    expect(
      validateTourForm({ ...VALID, durationDays: "3.5", durationNights: "2.5" }),
    ).toMatchObject({
      durationDays: "Duration days must be a whole number of at least 1.",
      durationNights: "Duration nights must be a whole number of at least 0.",
    });
  });
});

describe("buildTourStatusOptions", () => {
  it("maps reference tour_statuses values to lowercase option values", () => {
    expect(
      buildTourStatusOptions([
        { value: "DRAFT", label: "Draft" },
        { value: "PUBLISHED", label: "Live" },
        { value: "ARCHIVED", label: "Archived" },
      ]),
    ).toEqual([
      { value: "draft", label: "Draft" },
      { value: "published", label: "Live" },
      { value: "archived", label: "Archived" },
    ]);
  });

  it("falls back when the reference list is unavailable", () => {
    expect(buildTourStatusOptions([])).toEqual(FALLBACK_TOUR_STATUS_OPTIONS);
    expect(buildTourStatusOptions(null)).toEqual(FALLBACK_TOUR_STATUS_OPTIONS);
  });
});
