import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  fetchOpsSummary,
  fetchOpsIncidents,
  fetchSentryServiceHooks,
  registerSentryServiceHook,
  sendSentryTest,
  dispatchOpsFix,
} from "../../api/ops";

function opsDispatchLabel(ops) {
  if (!ops) return null;
  if (ops.status === "dispatched") return `AI dispatched to ${ops.repo || "GitHub"}`;
  if (ops.status === "failed") return `Dispatch failed: ${ops.error || "unknown"}`;
  if (ops.status === "skipped") return `Skipped: ${ops.reason || "unknown"}`;
  return null;
}

export default function OpsHome() {
  const [summary, setSummary] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [sentryHooks, setSentryHooks] = useState([]);
  const [hookMeta, setHookMeta] = useState(null);
  const [hookProject, setHookProject] = useState("");
  const [hookSecret, setHookSecret] = useState(null);
  const [sendingTest, setSendingTest] = useState(false);
  const [registeringHook, setRegisteringHook] = useState(false);
  const [dispatchingId, setDispatchingId] = useState(null);

  const loadIncidents = () =>
    fetchOpsIncidents(10).then((incRes) => {
      if (incRes?.success) setIncidents(incRes.data || []);
    });

  const loadSentryHooks = useCallback(async (project) => {
    if (!summary?.sentry_api_configured) return;
    try {
      const res = await fetchSentryServiceHooks(project || undefined);
      if (res?.success) {
        setSentryHooks(res.data?.hooks || []);
        setHookMeta(res.data);
        if (!hookProject && res.data?.project) {
          setHookProject(res.data.project);
        }
      }
    } catch {
      /* optional panel */
    }
  }, [summary?.sentry_api_configured, hookProject]);

  const onSentryTest = async () => {
    setSendingTest(true);
    try {
      const res = await sendSentryTest();
      if (res?.success) {
        toast.success(`Sentry test sent (${res.data?.test_id}). Check Sentry in ~30s.`);
      } else {
        toast.error(res?.message || "Sentry not configured on API");
      }
    } catch {
      toast.error("Failed to send Sentry test");
    } finally {
      setSendingTest(false);
    }
  };

  const onRegisterHook = async () => {
    setRegisteringHook(true);
    setHookSecret(null);
    try {
      const res = await registerSentryServiceHook(hookProject.trim() || undefined);
      if (res?.success) {
        const created = res.data?.hook?.created !== false;
        toast.success(created ? "Sentry Service Hook registered" : "Service Hook already exists");
        if (res.data?.hook?.secret) {
          setHookSecret({
            value: res.data.hook.secret,
            hint: res.data.env_hint,
            varName: res.data.env_var || "OPS_SENTRY_WEBHOOK_SECRET",
          });
        }
        await loadSentryHooks(hookProject.trim() || undefined);
      } else {
        toast.error(res?.message || "Failed to register hook");
      }
    } catch {
      toast.error("Failed to register Sentry Service Hook");
    } finally {
      setRegisteringHook(false);
    }
  };

  const onDispatchFix = async (incidentId) => {
    setDispatchingId(incidentId);
    try {
      const res = await dispatchOpsFix(incidentId);
      if (res?.success) {
        toast.success("GitHub AI fix workflow dispatched");
        await loadIncidents();
      } else {
        toast.error(res?.message || res?.error || "Dispatch failed");
      }
    } catch {
      toast.error("Failed to dispatch AI fix");
    } finally {
      setDispatchingId(null);
    }
  };

  useEffect(() => {
    let active = true;
    Promise.all([fetchOpsSummary(), fetchOpsIncidents(10)])
      .then(([sumRes, incRes]) => {
        if (!active) return;
        if (sumRes?.success) setSummary(sumRes.data);
        if (incRes?.success) setIncidents(incRes.data || []);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (summary?.sentry_api_configured) {
      loadSentryHooks();
    }
  }, [summary?.sentry_api_configured, loadSentryHooks]);

  const copySecret = async () => {
    if (!hookSecret?.value) return;
    try {
      await navigator.clipboard.writeText(hookSecret.value);
      toast.success("Secret copied");
    } catch {
      toast.error("Could not copy — select and copy manually");
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Ops Center</h1>
          <p className="text-sm text-gray-500">Platform monitoring for API and frontend</p>
        </div>
        <Link
          to="/dashboard/ops/tv?kiosk=1"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Open TV mode
        </Link>
        <button
          type="button"
          onClick={onSentryTest}
          disabled={sendingTest}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50"
        >
          {sendingTest ? "Sending…" : "Send Sentry test error"}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ["Open incidents", summary?.open_incidents ?? "—"],
          ["Failed jobs (24h)", summary?.failed_jobs_24h ?? "—"],
          ["AI failures (24h)", summary?.ai_failures_24h ?? "—"],
          ["Sentry", summary?.sentry_configured ? "Connected" : "Not configured"],
          ["AI fixes", summary?.ops_ai_enabled ? "Enabled" : "Disabled"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl bg-white p-4 shadow">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</div>
            <div className="mt-2 text-2xl font-semibold text-gray-900">{value}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl bg-white p-5 shadow">
        <h2 className="font-semibold text-gray-900">Sentry Service Hook</h2>
        <p className="mt-1 text-sm text-gray-500">
          Registers <code className="text-xs">event.alert</code> webhooks via Sentry API so issue alerts reach Promang.
        </p>

        {!summary?.sentry_api_configured ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            Set <code className="text-xs">SENTRY_AUTH_TOKEN</code>, <code className="text-xs">SENTRY_ORG</code>, and{" "}
            <code className="text-xs">SENTRY_PROJECT</code> on the API first.
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="text-sm text-gray-600">
              <span className="font-medium text-gray-800">Webhook URL:</span>{" "}
              <code className="break-all text-xs">{summary?.sentry_webhook_url || hookMeta?.webhook_url}</code>
            </div>
            <div className="flex flex-wrap items-end gap-3">
              <label className="block text-sm">
                <span className="font-medium text-gray-700">Sentry project slug</span>
                <input
                  type="text"
                  value={hookProject}
                  onChange={(e) => setHookProject(e.target.value)}
                  placeholder={hookMeta?.project || "promang-api"}
                  className="mt-1 block w-56 rounded border border-gray-300 px-3 py-2 text-sm"
                />
              </label>
              <button
                type="button"
                onClick={onRegisterHook}
                disabled={registeringHook}
                className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-800 disabled:opacity-50"
              >
                {registeringHook ? "Registering…" : "Register Service Hook"}
              </button>
              <button
                type="button"
                onClick={() => loadSentryHooks(hookProject.trim() || undefined)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
              >
                Refresh list
              </button>
            </div>

            <div className="text-sm">
              <span className="font-medium text-gray-800">API secret configured:</span>{" "}
              {summary?.sentry_webhook_secret_configured ? (
                <span className="text-green-700">Yes</span>
              ) : (
                <span className="text-amber-700">No — add OPS_SENTRY_WEBHOOK_SECRET after registering</span>
              )}
            </div>

            {hookSecret ? (
              <div className="rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-950">
                <p className="font-medium">Copy this secret to the API (shown once from Sentry):</p>
                <p className="mt-2 font-mono text-xs break-all">{hookSecret.varName}={hookSecret.value}</p>
                <p className="mt-2 text-xs text-sky-800">{hookSecret.hint}</p>
                <button
                  type="button"
                  onClick={copySecret}
                  className="mt-3 rounded border border-sky-300 bg-white px-3 py-1.5 text-xs font-medium hover:bg-sky-100"
                >
                  Copy secret
                </button>
              </div>
            ) : null}

            {sentryHooks.length > 0 ? (
              <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 text-sm">
                {sentryHooks.map((hook) => (
                  <li key={hook.id} className="px-3 py-2">
                    <div className="font-medium text-gray-900">{hook.status || "active"}</div>
                    <div className="text-xs text-gray-500 break-all">{hook.url}</div>
                    <div className="text-xs text-gray-500">Events: {(hook.events || []).join(", ")}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No service hooks registered for this project yet.</p>
            )}
          </div>
        )}
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-3">
        <Link to="/dashboard/ops/logs" className="rounded-xl bg-white p-5 shadow hover:ring-2 hover:ring-sky-200">
          <h2 className="font-semibold text-gray-900">Server logs</h2>
          <p className="mt-1 text-sm text-gray-500">Live Heroku tail via Logtail</p>
        </Link>
        <Link to="/dashboard/ops/errors" className="rounded-xl bg-white p-5 shadow hover:ring-2 hover:ring-sky-200">
          <h2 className="font-semibold text-gray-900">Sentry errors</h2>
          <p className="mt-1 text-sm text-gray-500">Unresolved issues from API and frontend</p>
        </Link>
        <Link to="/dashboard/ops/broadcasts" className="rounded-xl bg-white p-5 shadow hover:ring-2 hover:ring-sky-200">
          <h2 className="font-semibold text-gray-900">Platform broadcasts</h2>
          <p className="mt-1 text-sm text-gray-500">Maintenance, notices, scheduled updates</p>
        </Link>
      </div>

      <div className="mt-8 rounded-xl bg-white p-5 shadow">
        <h2 className="font-semibold text-gray-900">Recent incidents</h2>
        <ul className="mt-3 divide-y divide-gray-100">
          {incidents.length === 0 ? (
            <li className="py-3 text-sm text-gray-500">No incidents recorded yet.</li>
          ) : (
            incidents.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-gray-900">{row.title}</div>
                  <div className="text-xs text-gray-500">
                    {row.level} · {row.status} · {row.project || "unknown"}
                  </div>
                  {opsDispatchLabel(row.ops) ? (
                    <div className="mt-1 text-xs text-slate-600">{opsDispatchLabel(row.ops)}</div>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {summary?.ops_ai_enabled && !row.github_pr_url ? (
                    <button
                      type="button"
                      onClick={() => onDispatchFix(row.id)}
                      disabled={dispatchingId === row.id}
                      className="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-50"
                    >
                      {dispatchingId === row.id ? "Dispatching…" : "Request AI fix"}
                    </button>
                  ) : null}
                  {row.github_pr_url ? (
                    <a
                      href={row.github_pr_url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded bg-sky-700 px-2 py-1 text-xs font-medium text-white hover:bg-sky-800"
                    >
                      Draft PR
                    </a>
                  ) : null}
                  {row.permalink ? (
                    <a href={row.permalink} target="_blank" rel="noreferrer" className="text-sky-700 hover:underline">
                      Sentry
                    </a>
                  ) : null}
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
