import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  fetchOpsSummary,
  fetchOpsLogs,
  fetchOpsErrors,
  fetchOpsIncidents,
} from "../../api/ops";
import OpsLogStream from "./OpsLogStream";

function Panel({ title, children, className = "", bodyClassName = "" }) {
  return (
    <section className={`flex min-h-0 flex-col rounded-xl border border-slate-700 bg-slate-900/80 ${className}`}>
      <header className="border-b border-slate-700 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-slate-300">
        {title}
      </header>
      <div className={`min-h-0 flex-1 overflow-hidden p-4 text-sm ${bodyClassName}`}>{children}</div>
    </section>
  );
}

export default function OpsTv() {
  const [searchParams] = useSearchParams();
  const kiosk = searchParams.get("kiosk") === "1";
  const [summary, setSummary] = useState(null);
  const [logs, setLogs] = useState([]);
  const [errors, setErrors] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [paused, setPaused] = useState(false);

  const refresh = useCallback(async () => {
    const [sumRes, logRes, errRes, incRes] = await Promise.all([
      fetchOpsSummary(),
      fetchOpsLogs(80),
      fetchOpsErrors(15),
      fetchOpsIncidents(15),
    ]);
    if (sumRes?.success) setSummary(sumRes.data);
    if (logRes?.success) setLogs(logRes.data?.lines || []);
    if (errRes?.success) setErrors(errRes.data?.issues || []);
    if (incRes?.success) setIncidents(incRes.data || []);
  }, []);

  useEffect(() => {
    refresh();
    if (paused) return undefined;
    const id = window.setInterval(refresh, 15000);
    return () => window.clearInterval(id);
  }, [refresh, paused]);

  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 ${kiosk ? "p-2" : "p-4"}`}>
      <div className={`mb-4 flex items-center justify-between ${kiosk ? "hidden" : ""}`}>
        <h1 className="text-xl font-semibold">Ops TV</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPaused((v) => !v)}
            className="rounded border border-slate-600 px-3 py-1 text-sm"
          >
            {paused ? "Resume" : "Pause"}
          </button>
          <button
            type="button"
            onClick={() => {
              if (document.fullscreenElement) document.exitFullscreen();
              else document.documentElement.requestFullscreen();
            }}
            className="rounded border border-slate-600 px-3 py-1 text-sm"
          >
            Fullscreen
          </button>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ["Open incidents", summary?.open_incidents ?? 0],
          ["Failed jobs 24h", summary?.failed_jobs_24h ?? 0],
          ["AI failures 24h", summary?.ai_failures_24h ?? 0],
          ["Logtail", summary?.logtail_configured ? "OK" : "—"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-3">
            <div className="text-xs uppercase text-slate-400">{label}</div>
            <div className="text-2xl font-bold">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid h-[calc(100vh-12rem)] gap-4 lg:grid-cols-3">
        <Panel title="Errors" bodyClassName="overflow-y-auto">
          <ul className="space-y-3">
            {errors.length === 0 ? (
              <li className="text-slate-400">No unresolved Sentry issues.</li>
            ) : (
              errors.map((issue) => (
                <li
                  key={issue.id}
                  className={`rounded border px-3 py-2 ${
                    issue.level === "fatal" || issue.level === "error"
                      ? "border-red-500/50 bg-red-950/30"
                      : "border-slate-700"
                  }`}
                >
                  <div className="font-medium">{issue.title}</div>
                  <div className="text-xs text-slate-400">{issue.culprit}</div>
                </li>
              ))
            )}
          </ul>
        </Panel>

        <Panel title="Server tail">
          <OpsLogStream
            lines={logs}
            paused={paused}
            className="h-full"
            emptyMessage="No log lines."
          />
        </Panel>

        <Panel title="Incidents & job failures" bodyClassName="overflow-y-auto">
          <ul className="space-y-3">
            {incidents.length === 0 ? (
              <li className="text-slate-400">No platform incidents yet.</li>
            ) : (
              incidents.map((row) => (
                <li key={row.id} className="rounded border border-slate-700 px-3 py-2">
                  <div className="font-medium">{row.title}</div>
                  <div className="text-xs text-slate-400">
                    {row.level} · {row.status}
                    {row.github_pr_url ? " · PR ready" : ""}
                  </div>
                  {row.github_pr_url ? (
                    <a
                      href={row.github_pr_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-block text-xs text-sky-400 hover:underline"
                    >
                      Open draft PR
                    </a>
                  ) : null}
                </li>
              ))
            )}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
