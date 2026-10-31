import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchReferenceDataResult,
  normalizeReferenceKeys,
} from "../services/referenceService";

function emptyLists(keys) {
  const result = {};
  for (const key of keys) {
    result[key] = [];
  }
  return result;
}

export function useReferenceData(keys) {
  const signature = useMemo(
    () => normalizeReferenceKeys(keys).join(","),
    [keys],
  );
  const requestedKeys = useMemo(
    () => (signature ? signature.split(",") : []),
    [signature],
  );

  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const requested = signature ? signature.split(",") : [];

    fetchReferenceDataResult(requested)
      .then(({ data, missingKeys }) => {
        if (cancelled) {
          return;
        }
        setResult({ signature, attempt, data, missingKeys, error: null });
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        setResult({
          signature,
          attempt,
          data: emptyLists(requested),
          missingKeys: requested,
          error,
        });
      });

    return () => {
      cancelled = true;
    };
  }, [signature, attempt]);

  const retry = useCallback(() => {
    setAttempt((value) => value + 1);
  }, []);

  const current =
    result && result.signature === signature && result.attempt === attempt
      ? result
      : null;

  return {
    data: current ? current.data : emptyLists(requestedKeys),
    missingKeys: current ? current.missingKeys : [],
    loading: current === null,
    error: current ? current.error : null,
    retry,
  };
}

export function getOptions(list) {
  if (!Array.isArray(list)) {
    return [];
  }
  return list.filter(
    (item) => item && typeof item === "object" && "value" in item,
  );
}

export function isSameValue(a, b) {
  if (a === b) {
    return true;
  }
  if (a == null || b == null) {
    return false;
  }
  return String(a).toLowerCase() === String(b).toLowerCase();
}

export function getLabel(list, value) {
  const match = getOptions(list).find((item) =>
    isSameValue(item.value, value),
  );
  if (!match || match.label == null) {
    return value;
  }
  return match.label;
}
