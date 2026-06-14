import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { fetchOpsHealth, syncOpsMonitoring } from "../../api/ops";

function statusColor(status) {
  if (status === "up" || status === "healthy") return "bg-green-100 text-green-800";
  if (status === "degraded" || status === "unknown") return "bg-amber-100 text-amber-800";
  return "bg-red-100 text-red-800";
}

export default function OpsHealth() {
  const [data, setData] = useState(null);
  const [syncing, setSyncing] = useState(false);

  const load = () =>
    fetchOpsHealth().then((res) => {
      if (res?.success) setData(res.data);
    });

  useEffect(() => {
    load().catch(() => {});
  }, []);

  const onSync = async () => {
    setSyncing(true);
    try {
      const res = await syncOpsMonitoring();
      if (res?.success) {
        toast.success("Synced Sentry resolutions and Cursor agent runs");
        await load();
      }
    } catch {
      toast.error("Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Platform health</h1>
          <p className="text-sm text-gray-500">API, database, Redis, Sidekiq, Sentry, Better Stack, Cursor agents</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onSync}
            disabled={syncing}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
          >
            {syncing ? "Syncing…" : "Sync status"}
          </button>
          <Link to="/health" className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
            Public /health
          </Link>
        </div>
      </div>

      <div className={`mb-6 rounded-xl p-5 ${statusColor(data?.status)}`}>
        <div className="text-sm uppercase tracking-wide">Overall status</div>
        <div className="mt-1 text-3xl font-semibold capitalize">{data?.status || "—"}</div>
        {data?.checked_at ? (
          <div className="mt-1 text-sm opacity-80">Checked {new Date(data.checked_at).toLocaleString()}</div>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(data?.checks || []).map((row) => (
          <div key={row.name} className="rounded-xl bg-white p-4 shadow">
            <div className="flex items-center justify-between gap-2">
              <div className="font-medium capitalize text-gray-900">{row.name.replace(/_/g, " ")}</div>
              <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${statusColor(row.status)}`}>
                {row.status}
              </span>
            </div>
            {row.detail ? <div className="mt-2 text-sm text-gray-500">{row.detail}</div> : null}
            {Array.isArray(row.monitors) && row.monitors.length > 0 ? (
              <ul className="mt-3 space-y-1 text-xs text-gray-600">
                {row.monitors.map((monitor) => (
                  <li key={monitor.id}>
                    {monitor.name} — {monitor.status}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
