/**
 * Extract a user-facing error message from an Ops API response or axios error.
 */
export function opsApiError(errorOrResponse, fallback = "Request failed") {
  const data = errorOrResponse?.response?.data ?? errorOrResponse;
  if (!data || typeof data !== "object") return fallback;

  if (data.message) return data.message;
  if (typeof data.error === "string" && data.error.length > 0) return data.error;

  const dispatch = data.data?.dispatch ?? data.data;
  if (dispatch && typeof dispatch === "object") {
    if (dispatch.message) return dispatch.message;
    if (typeof dispatch.error === "string" && dispatch.error.length > 0) return dispatch.error;
    if (typeof dispatch.reason === "string" && dispatch.reason.length > 0) return dispatch.reason;
  }

  if (Array.isArray(data.errors) && data.errors[0]) return data.errors[0];
  return fallback;
}

/**
 * True when an Ops dispatch/create response indicates the dispatch succeeded.
 */
export function opsDispatchSucceeded(res) {
  if (!res?.success) return false;
  const dispatch = res.data?.dispatch;
  if (!dispatch) return true;
  return dispatch.success !== false && dispatch.skipped !== true;
}
