import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../services/referenceService", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    fetchReferenceData: vi.fn(),
  };
});

import { fetchReferenceData } from "../services/referenceService";
import {
  getLabel,
  getOptions,
  isSameValue,
  useReferenceData,
} from "./useReferenceData";

const TOUR_STATUSES = [
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
  { value: "ARCHIVED", label: "Archived" },
];

beforeEach(() => {
  fetchReferenceData.mockReset();
});

describe("useReferenceData", () => {
  it("returns loading then the requested lists", async () => {
    fetchReferenceData.mockResolvedValue({ tour_statuses: TOUR_STATUSES });

    const { result } = renderHook(() => useReferenceData(["tour_statuses"]));

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toEqual({ tour_statuses: [] });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.data.tour_statuses).toEqual(TOUR_STATUSES);
    expect(fetchReferenceData).toHaveBeenCalledWith(["tour_statuses"]);
  });

  it("returns empty lists and an error when loading fails", async () => {
    fetchReferenceData.mockRejectedValue(new Error("boom"));

    const { result } = renderHook(() => useReferenceData(["tour_statuses"]));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.data).toEqual({ tour_statuses: [] });
  });

  it("retries after a failure", async () => {
    fetchReferenceData
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce({ tour_statuses: TOUR_STATUSES });

    const { result } = renderHook(() => useReferenceData(["tour_statuses"]));

    await waitFor(() => expect(result.current.error).not.toBeNull());

    act(() => result.current.retry());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBeNull();
    expect(result.current.data.tour_statuses).toEqual(TOUR_STATUSES);
    expect(fetchReferenceData).toHaveBeenCalledTimes(2);
  });
});

describe("reference helpers", () => {
  it("getOptions returns select options", () => {
    expect(getOptions(TOUR_STATUSES)).toEqual(TOUR_STATUSES);
    expect(getOptions(null)).toEqual([]);
  });

  it("getLabel matches values case-insensitively", () => {
    expect(getLabel(TOUR_STATUSES, "published")).toBe("Published");
    expect(getLabel(TOUR_STATUSES, "DRAFT")).toBe("Draft");
  });

  it("getLabel falls back to the raw value", () => {
    expect(getLabel(TOUR_STATUSES, "unknown")).toBe("unknown");
  });

  it("isSameValue compares case-insensitively", () => {
    expect(isSameValue("published", "PUBLISHED")).toBe(true);
    expect(isSameValue("draft", "published")).toBe(false);
    expect(isSameValue(null, "published")).toBe(false);
  });
});
