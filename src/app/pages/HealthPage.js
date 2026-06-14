import { useEffect, useState } from "react";
import { fetchPublicHealth } from "../api/ops";

function statusColor(status) {
  if (status === "up" || status === "healthy") return "text-green-700 bg-green-50 border-green-200";
  if (status === "degraded" || status === "unknown") return "text-amber-800 bg-amber-50 border-amber-200";
  return "text-red-800 bg-red-50 border-red-200";
}

export default function HealthPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPublicHealth()
      .then((res) => {
        if (res?.success) setData(res.data);
        else setError("Health check unavailable");
      })
      .catch(() => setError("Could not reach Promang API"));
  }, []);

  const status = data?.status || "unknown";

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold">Promang Health</h1>
          <p className="mt-2 text-slate-400">Live platform status from promang-api</p>
        </div>

        <div className={`rounded-2xl border px-6 py-8 text-center ${statusColor(status)}`}>
          <div className="text-sm uppercase tracking-wide">Overall</div>
          <div className="mt-2 text-4xl font-bold capitalize">{status}</div>
          {data?.checked_at ? (
            <div className="mt-2 text-sm opacity-80">Checked {new Date(data.checked_at).toLocaleString()}</div>
          ) : null}
        </div>

        {error ? (
          <div className="mt-6 rounded-xl border border-red-300 bg-red-950/40 p-4 text-red-100">{error}</div>
        ) : null}

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {(data?.services || []).map((row) => (
            <div key={row.name} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium capitalize">{row.name.replace(/_/g, " ")}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${statusColor(row.status)}`}>
                  {row.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-slate-500">
          For full ops details, sign in to the admin dashboard Ops Center.
        </p>
      </div>
    </div>
  );
}
