import { useEffect, useState } from "react";
import { fetchOpsActivities } from "../../api/ops";

function activityColor(status) {
  if (status === "success") return "border-l-green-500";
  if (status === "error") return "border-l-red-500";
  if (status === "warning") return "border-l-amber-500";
  return "border-l-slate-300";
}

export default function OpsActivity() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    fetchOpsActivities(150)
      .then((res) => {
        if (res?.success) setRows(res.data || []);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-gray-900">Activity history</h1>
      <p className="mt-1 text-sm text-gray-500">Sentry webhooks, Cursor agents, GitHub dispatches, PRs, resolutions, daily reports</p>

      <ul className="mt-6 space-y-3">
        {rows.length === 0 ? (
          <li className="rounded-xl bg-white p-5 text-sm text-gray-500 shadow">No activity recorded yet.</li>
        ) : (
          rows.map((row) => (
            <li key={row.id} className={`rounded-xl border-l-4 bg-white p-4 shadow ${activityColor(row.status)}`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="font-medium text-gray-900">{row.title}</div>
                  <div className="text-xs text-gray-500">
                    {row.kind} · {row.status}
                    {row.incident_id ? ` · incident #${row.incident_id}` : ""}
                    {row.agent_run_id ? ` · agent run #${row.agent_run_id}` : ""}
                  </div>
                  {row.message ? <div className="mt-1 text-sm text-gray-600 break-all">{row.message}</div> : null}
                </div>
                <div className="text-xs text-gray-500">{new Date(row.created_at).toLocaleString()}</div>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
