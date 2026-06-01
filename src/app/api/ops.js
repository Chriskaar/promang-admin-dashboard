import axios from "./axios";

export async function fetchOpsSession() {
  const res = await axios.get("/platform_ops/session");
  return res.data;
}

export async function fetchOpsSummary() {
  const res = await axios.get("/platform_ops/ops_dashboard/summary");
  return res.data;
}

export async function fetchOpsLogs(limit = 100) {
  const res = await axios.get("/platform_ops/ops_dashboard/logs", {
    params: { limit },
  });
  return res.data;
}

export async function fetchOpsErrors(limit = 25) {
  const res = await axios.get("/platform_ops/ops_dashboard/errors", {
    params: { limit },
  });
  return res.data;
}

export async function fetchOpsIncidents(limit = 50) {
  const res = await axios.get("/platform_ops/ops_dashboard/incidents", {
    params: { limit },
  });
  return res.data;
}

export async function sendSentryTest() {
  const res = await axios.post("/platform_ops/ops_dashboard/sentry_test");
  return res.data;
}

export async function fetchSentryServiceHooks(project) {
  const res = await axios.get("/platform_ops/ops_dashboard/sentry_service_hooks", {
    params: project ? { project } : undefined,
  });
  return res.data;
}

export async function registerSentryServiceHook(project) {
  const res = await axios.post("/platform_ops/ops_dashboard/sentry_register_hook", {
    project: project || undefined,
  });
  return res.data;
}

export async function dispatchOpsFix(incidentId) {
  const res = await axios.post(`/platform_ops/ops_dashboard/incidents/${incidentId}/dispatch_fix`);
  return res.data;
}
