import axios from "./axios";
import rawAxios from "axios";

const publicAxios = rawAxios.create({
  baseURL: process.env.REACT_APP_BACKEND_URL || "http://localhost:4000/api/v1",
});

export { opsApiError, opsDispatchSucceeded } from "./opsError";

export async function fetchOpsSession() {
  try {
    const res = await axios.get("/platform_ops/session");
    return { ok: true, ...res.data };
  } catch (error) {
    const status = error.response?.status;
    const data = error.response?.data;
    const signedInEmail = data?.data?.email;
    const configuredOpsEmail = data?.data?.platform_ops_email;
    let message =
      data?.errors?.[0] ||
      data?.message ||
      (status === 401
        ? "Session expired — sign in again."
        : status === 403
          ? "You do not have platform ops access."
          : !error.response
            ? error.code === "ECONNABORTED"
              ? "Promang API timed out. Check that promang-api is running on port 4000."
              : "Could not reach the Promang API. Is promang-api running on port 4000?"
            : "Could not verify platform ops access.");
    if (status === 403 && signedInEmail) {
      message = `Signed in as ${signedInEmail}, but that email is not authorized for Ops Center.`;
      if (configuredOpsEmail) {
        message += ` Set PLATFORM_OPS_EMAIL=${configuredOpsEmail} in promang-api (or add your email to PLATFORM_SUPER_ADMIN_EMAILS), then restart the API.`;
      }
    }
    return { ok: false, success: false, status, message, data, signedInEmail, configuredOpsEmail };
  }
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

export async function fetchOpsErrors(limit = 25, query) {
  const res = await axios.get("/platform_ops/ops_dashboard/errors", {
    params: { limit, query },
  });
  return res.data;
}

export async function fetchOpsIncidents(limit = 50) {
  const res = await axios.get("/platform_ops/ops_dashboard/incidents", {
    params: { limit },
  });
  return res.data;
}

export async function fetchOpsBugs(limit = 100, status) {
  const res = await axios.get("/platform_ops/ops_dashboard/bugs", {
    params: { limit, status },
  });
  return res.data;
}

export async function fetchOpsActivities(limit = 100) {
  const res = await axios.get("/platform_ops/ops_dashboard/activities", {
    params: { limit },
  });
  return res.data;
}

export async function fetchOpsHealth() {
  const res = await axios.get("/platform_ops/ops_dashboard/health");
  return res.data;
}

export async function fetchPublicHealth() {
  const res = await publicAxios.get("/platform_ops/health");
  return res.data;
}

export async function fetchOpsTelemetry() {
  const res = await axios.get("/platform_ops/ops_dashboard/telemetry");
  return res.data;
}

export async function fetchOpsAiUsage({ preset = "24h", feature, limit } = {}) {
  const res = await axios.get("/platform_ops/ops_dashboard/ai_usage", {
    params: { preset, feature, limit },
  });
  return res.data;
}

export async function fetchOpsAiUsageByCompany({ preset = "24h", companyId, includeUsers, limit } = {}) {
  const res = await axios.get("/platform_ops/ops_dashboard/ai_usage_by_company", {
    params: {
      preset,
      company_id: companyId,
      include_users: includeUsers,
      limit,
    },
  });
  return res.data;
}

export async function fetchDailyReport(since) {
  const res = await axios.get("/platform_ops/ops_dashboard/daily_report", {
    params: since ? { since } : undefined,
  });
  return res.data;
}

export async function sendDailyReport(since) {
  const res = await axios.post("/platform_ops/ops_dashboard/daily_report/send", null, {
    params: since ? { since } : undefined,
  });
  return res.data;
}

export async function syncOpsMonitoring() {
  const res = await axios.post("/platform_ops/ops_dashboard/sync");
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

export async function createIncidentFromSentry(issueId, { dispatch = false } = {}) {
  const res = await axios.post("/platform_ops/ops_dashboard/incidents/from_sentry", {
    issue_id: issueId,
    dispatch,
  });
  return res.data;
}

export async function createIncidentFromLog({ message, timestamp, level, project, dispatch = false }) {
  const res = await axios.post("/platform_ops/ops_dashboard/incidents/from_log", {
    message,
    timestamp,
    level,
    project,
    dispatch,
  });
  return res.data;
}

export async function resolveOpsIncident(incidentId, { syncSentry = true } = {}) {
  const res = await axios.post(`/platform_ops/ops_dashboard/incidents/${incidentId}/resolve`, {
    sync_sentry: syncSentry,
  });
  return res.data;
}

export async function resolveSentryIssue(issueId, { syncIncident = true } = {}) {
  const res = await axios.post(`/platform_ops/ops_dashboard/sentry_issues/${issueId}/resolve`, {
    sync_incident: syncIncident,
  });
  return res.data;
}

export async function fetchCursorAgents(limit = 50) {
  const res = await axios.get("/platform_ops/cursor_agents", { params: { limit } });
  return res.data;
}

export async function launchCursorAgent({ incidentId, prompt, repository, ref, autoCreatePr = true }) {
  const res = await axios.post("/platform_ops/cursor_agents", {
    incident_id: incidentId,
    prompt,
    repository,
    ref,
    auto_create_pr: autoCreatePr,
  });
  return res.data;
}

export async function syncCursorAgentRun(runId) {
  const res = await axios.post(`/platform_ops/cursor_agents/${runId}/sync`);
  return res.data;
}

export async function fetchDocsTree() {
  const res = await axios.get("/platform_ops/docs/tree");
  return res.data;
}

export async function fetchDocsContent(sourceId, relativePath) {
  const res = await axios.get("/platform_ops/docs/content", {
    params: { source_id: sourceId, relative_path: relativePath },
  });
  return res.data;
}

export async function fetchCommunityReportsAdmin(params = {}) {
  const res = await axios.get("/platform_ops/community_reports", { params });
  return res.data;
}

export async function approveCommunityReport(id, note) {
  const res = await axios.post(`/platform_ops/community_reports/${id}/approve`, { note });
  return res.data;
}

export async function rejectCommunityReport(id, note) {
  const res = await axios.post(`/platform_ops/community_reports/${id}/reject`, { note });
  return res.data;
}

export async function dispatchCommunityFix(id) {
  const res = await axios.post(`/platform_ops/community_reports/${id}/dispatch_fix`);
  return res.data;
}
