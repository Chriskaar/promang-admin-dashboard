import { useEffect, useState } from "react";
import { fetchOpsTelemetry } from "../../api/ops";

export default function OpsTelemetry() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchOpsTelemetry()
      .then((res) => {
        if (res?.success) setData(res.data);
      })
      .catch(() => {});
  }, []);

  const monitors = data?.uptime?.monitors || [];
  const sources = data?.sources?.sources || [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-gray-900">Telemetry</h1>
      <p className="mt-1 text-sm text-gray-500">Better Stack uptime monitors, log sources, and recent log connectivity</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-4 shadow">
          <div className="text-xs font-semibold uppercase text-gray-500">Logs</div>
          <div className="mt-2 text-lg font-semibold">
            {data?.logs?.configured ? (data.logs.success ? "Connected" : "Error") : "Not configured"}
          </div>
          <div className="mt-1 text-sm text-gray-500">Recent lines: {data?.logs?.recent_count ?? "—"}</div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow">
          <div className="text-xs font-semibold uppercase text-gray-500">Uptime monitors</div>
          <div className="mt-2 text-lg font-semibold">{monitors.length}</div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow">
          <div className="text-xs font-semibold uppercase text-gray-500">Log sources</div>
          <div className="mt-2 text-lg font-semibold">{sources.length}</div>
        </div>
      </div>

      {data?.logs?.error ? (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{data.logs.error}</div>
      ) : null}

      <div className="mt-8 rounded-xl bg-white p-5 shadow">
        <h2 className="font-semibold text-gray-900">Uptime monitors</h2>
        <ul className="mt-3 divide-y divide-gray-100 text-sm">
          {monitors.length === 0 ? (
            <li className="py-3 text-gray-500">No monitors returned. Set BETTERSTACK_UPTIME_TOKEN or LOGTAIL_API_TOKEN.</li>
          ) : (
            monitors.map((monitor) => (
              <li key={monitor.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="font-medium text-gray-900">{monitor.name}</div>
                  <div className="text-xs text-gray-500 break-all">{monitor.url}</div>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium capitalize">{monitor.status}</span>
              </li>
            ))
          )}
        </ul>
      </div>

      <div className="mt-8 rounded-xl bg-white p-5 shadow">
        <h2 className="font-semibold text-gray-900">Better Stack log sources</h2>
        <ul className="mt-3 divide-y divide-gray-100 text-sm">
          {sources.length === 0 ? (
            <li className="py-3 text-gray-500">No sources listed.</li>
          ) : (
            sources.map((source) => (
              <li key={source.id} className="py-3">
                <div className="font-medium text-gray-900">{source.name}</div>
                <div className="text-xs text-gray-500">
                  id={source.id} · {source.platform}
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
