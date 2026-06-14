import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { fetchDailyReport, sendDailyReport } from "../../api/ops";

export default function OpsReports() {
  const [report, setReport] = useState(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetchDailyReport()
      .then((res) => {
        if (res?.success) setReport(res.data);
      })
      .catch(() => {});
  }, []);

  const onSend = async () => {
    setSending(true);
    try {
      const res = await sendDailyReport();
      if (res?.success) {
        toast.success("Daily report email queued");
        setReport(res.data);
      }
    } catch {
      toast.error("Failed to send report");
    } finally {
      setSending(false);
    }
  };

  const summary = report?.summary || {};

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Daily bug report</h1>
          <p className="text-sm text-gray-500">Last 24 hours — emailed automatically via Heroku Scheduler / Sidekiq</p>
        </div>
        <button
          type="button"
          onClick={onSend}
          disabled={sending}
          className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-800 disabled:opacity-50"
        >
          {sending ? "Sending…" : "Send report now"}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Open incidents", summary.open_incidents],
          ["Resolved (24h)", summary.resolved_since],
          ["PRs opened (24h)", summary.pr_opened_since],
          ["Sentry unresolved", summary.sentry_unresolved],
          ["Cursor runs (24h)", summary.cursor_agent_runs],
          ["Cursor failures (24h)", summary.cursor_agent_failures],
          ["Active Cursor agents", summary.cursor_agents_active],
          ["Platform health", report?.health?.status],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl bg-white p-4 shadow">
            <div className="text-xs font-semibold uppercase text-gray-500">{label}</div>
            <div className="mt-2 text-2xl font-semibold text-gray-900">{value ?? "—"}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-5 shadow">
          <h2 className="font-semibold text-gray-900">Incidents</h2>
          <ul className="mt-3 divide-y divide-gray-100 text-sm">
            {(report?.incidents || []).slice(0, 20).map((row) => (
              <li key={row.id} className="py-2">
                <div className="font-medium">{row.title}</div>
                <div className="text-xs text-gray-500">
                  {row.status} · {row.project}
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl bg-white p-5 shadow">
          <h2 className="font-semibold text-gray-900">Recent activity</h2>
          <ul className="mt-3 divide-y divide-gray-100 text-sm">
            {(report?.activities || []).slice(0, 20).map((row) => (
              <li key={row.id} className="py-2">
                <div className="font-medium">{row.title}</div>
                <div className="text-xs text-gray-500">
                  {row.kind} · {new Date(row.created_at).toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
