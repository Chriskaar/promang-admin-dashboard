import { useCallback, useEffect, useState } from "react";
import { fetchOpsLogs } from "../../api/ops";
import OpsLogStream from "./OpsLogStream";

export default function OpsLogs() {
  const [data, setData] = useState(null);
  const [paused, setPaused] = useState(false);

  const load = useCallback(async () => {
    const res = await fetchOpsLogs(150);
    if (res?.success) setData(res.data);
  }, []);

  useEffect(() => {
    load();
    if (paused) return undefined;
    const id = window.setInterval(load, 10000);
    return () => window.clearInterval(id);
  }, [load, paused]);

  const lines = data?.lines || [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Server logs</h1>
        <button
          type="button"
          onClick={() => setPaused((v) => !v)}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
        >
          {paused ? "Resume" : "Pause"}
        </button>
      </div>

      {!data?.configured ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {data?.hint || "Better Stack logs are not configured. Set LOGTAIL_API_TOKEN and LOGTAIL_SOURCE_ID on the API."}
        </div>
      ) : null}

      {data?.configured && data?.success === false && data?.error ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          {data.error}
        </div>
      ) : null}

      <div className="mt-4 h-[70vh] rounded-xl bg-slate-950 p-4">
        <OpsLogStream lines={lines} paused={paused} className="h-full" />
      </div>
    </div>
  );
}
