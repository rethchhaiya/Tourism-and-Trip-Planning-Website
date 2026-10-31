import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./httpClient", () => ({
  http: { get: vi.fn() },
}));

import { http } from "./httpClient";
import {
  REFERENCE_KEYS,
  clearReferenceCache,
  fetchReferenceData,
  fetchReferenceDataResult,
} from "./referenceService";

const ALL_LISTS = {
  booking_statuses: [{ value: "pending", label: "Pending" }],
  booking_types: [{ value: "group", label: "Group" }],
  participant_sex: [{ value: "Male", label: "Male" }],
  payment_methods: [{ value: "cash", label: "Cash" }],
  payment_statuses: [{ value: "paid", label: "Paid" }],
  user_statuses: [{ value: "active", label: "Active" }],
  tour_statuses: [
    { value: "DRAFT", label: "Draft" },
    { value: "PUBLISHED", label: "Published" },
    { value: "ARCHIVED", label: "Archived" },
  ],
};

beforeEach(() => {
  clearReferenceCache();
  http.get.mockReset();
});

describe("fetchReferenceData", () => {
  it("loads all lists from the unwrapped top-level shape", async () => {
    http.get.mockResolvedValue(ALL_LISTS);

    const data = await fetchReferenceData();

    expect(http.get).toHaveBeenCalledTimes(1);
    expect(http.get).toHaveBeenCalledWith("/reference-data", {
      noAuthRedirect: true,
    });
    expect(Object.keys(data).sort()).toEqual([...REFERENCE_KEYS].sort());
    expect(data).toEqual(ALL_LISTS);
  });

  it("requests only the filtered keys", async () => {
    http.get.mockResolvedValue({
      tour_statuses: ALL_LISTS.tour_statuses,
      booking_statuses: ALL_LISTS.booking_statuses,
    });

    const data = await fetchReferenceData([
      "tour_statuses",
      "booking_statuses",
    ]);

    expect(http.get).toHaveBeenCalledWith(
      "/reference-data?keys=tour_statuses,booking_statuses",
      { noAuthRedirect: true },
    );
    expect(data).toEqual({
      tour_statuses: ALL_LISTS.tour_statuses,
      booking_statuses: ALL_LISTS.booking_statuses,
    });
  });

  it("unwraps a { success, message, data } response", async () => {
    http.get.mockResolvedValue({
      success: true,
      message: "Reference data retrieved.",
      data: { booking_statuses: ALL_LISTS.booking_statuses },
    });

    await expect(fetchReferenceData(["booking_statuses"])).resolves.toEqual({
      booking_statuses: ALL_LISTS.booking_statuses,
    });
  });

  it("keeps values exactly as the API returns them", async () => {
    http.get.mockResolvedValue(ALL_LISTS);

    const data = await fetchReferenceData(["tour_statuses", "participant_sex"]);

    expect(data.tour_statuses.map((item) => item.value)).toEqual([
      "DRAFT",
      "PUBLISHED",
      "ARCHIVED",
    ]);
    expect(data.participant_sex[0].value).toBe("Male");
  });

  it("reuses cached lists and only fetches missing keys", async () => {
    http.get.mockResolvedValue(ALL_LISTS);

    await fetchReferenceData(["tour_statuses"]);
    await fetchReferenceData(["tour_statuses", "booking_statuses"]);

    expect(http.get).toHaveBeenCalledTimes(2);
    expect(http.get.mock.calls[0][0]).toBe(
      "/reference-data?keys=tour_statuses",
    );
    expect(http.get.mock.calls[1][0]).toBe(
      "/reference-data?keys=booking_statuses",
    );
  });

  it("does not fetch again when every requested list is cached", async () => {
    http.get.mockResolvedValue(ALL_LISTS);
    await fetchReferenceData();

    const data = await fetchReferenceData(["tour_statuses", "booking_statuses"]);

    expect(http.get).toHaveBeenCalledTimes(1);
    expect(data.tour_statuses).toEqual(ALL_LISTS.tour_statuses);
  });

  it("shares one in-flight request between simultaneous callers", async () => {
    let resolveRequest;
    http.get.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );

    const first = fetchReferenceData(["tour_statuses"]);
    const second = fetchReferenceData(["tour_statuses"]);

    expect(http.get).toHaveBeenCalledTimes(1);
    resolveRequest({ tour_statuses: ALL_LISTS.tour_statuses });

    const [firstData, secondData] = await Promise.all([first, second]);
    expect(firstData).toEqual({ tour_statuses: ALL_LISTS.tour_statuses });
    expect(secondData).toEqual(firstData);
    expect(http.get).toHaveBeenCalledTimes(1);
  });

  it("propagates failures, leaves the cache empty, and retries", async () => {
    http.get.mockRejectedValueOnce(new Error("network down"));

    await expect(fetchReferenceData(["tour_statuses"])).rejects.toThrow(
      "network down",
    );

    http.get.mockResolvedValueOnce({
      tour_statuses: ALL_LISTS.tour_statuses,
    });

    await expect(fetchReferenceData(["tour_statuses"])).resolves.toEqual({
      tour_statuses: ALL_LISTS.tour_statuses,
    });
    expect(http.get).toHaveBeenCalledTimes(2);
  });

  it("returns empty lists and reports missing keys", async () => {
    http.get.mockResolvedValue({
      tour_statuses: ALL_LISTS.tour_statuses,
    });

    const result = await fetchReferenceDataResult([
      "tour_statuses",
      "booking_types",
    ]);

    expect(result.data).toEqual({
      tour_statuses: ALL_LISTS.tour_statuses,
      booking_types: [],
    });
    expect(result.missingKeys).toEqual(["booking_types"]);
  });

  it("clearReferenceCache forces the next call to refetch", async () => {
    http.get.mockResolvedValue(ALL_LISTS);
    await fetchReferenceData(["tour_statuses"]);

    clearReferenceCache();
    await fetchReferenceData(["tour_statuses"]);

    expect(http.get).toHaveBeenCalledTimes(2);
  });

  it("ignores unknown keys", async () => {
    http.get.mockResolvedValue(ALL_LISTS);

    const data = await fetchReferenceData(["tour_statuses", "not_a_list"]);

    expect(http.get).toHaveBeenCalledWith(
      "/reference-data?keys=tour_statuses",
      { noAuthRedirect: true },
    );
    expect(data).toEqual({ tour_statuses: ALL_LISTS.tour_statuses });
  });
});
