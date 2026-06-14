import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { fetchCursorAgents, syncCursorAgentRun } from "../../api/ops";

export default function OpsAgents() {
  const [data, setData] = useState(null);
  const [syncingId, setSyncingId] = useState(null);

  const load = () =>
    fetchCursorAgents(50).then((res) => {
      if (res?.success) setData(res.data);
    });

  useEffect(() => {
    load().catch(() => {});
    const timer = setInterval(() => load().catch(() => {}), 30000);
    return () => clearInterval(timer);
  }, []);

  const onSync = async (runId) => {
    setSyncingId(runId);
    try {
      const res = await syncCursorAgentRun(runId);
      if (res?.success) {
        toast.success("Agent status synced");
        await load();
      } else {
        toast.error("Sync failed");
      }
    } catch {
      toast.error("Sync failed");
    } finally {
      setSyncingId(null);
    }
  };

  const runs = data?.runs || [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-gray-900">Cursor agents</h1>
      <p className="mt-1 text-sm text-gray-500">Cloud agents launched from Sentry incidents and manual ops runs</p>

      {!data?.configured ? (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Set <code className="text-xs">CURSOR_API_KEY</code> and <code className="text-xs">OPS_CURSOR_ENABLED=true</code> on the API.
        </div>
      ) : null}

      <div className="mt-6 overflow-hidden rounded-xl bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Repository</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Incident</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {runs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-gray-500">
                  No Cursor agent runs yet.
                </td>
              </tr>
            ) : (
              runs.map((run) => (
                <tr key={run.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{run.repository}</div>
                    <div className="text-xs text-gray-500">{run.cursor_agent_id}</div>
                    {run.error_message ? <div className="mt-1 text-xs text-red-600">{run.error_message}</div> : null}
                  </td>
                  <td className="px-4 py-3 capitalize">{run.status}</td>
                  <td className="px-4 py-3">{run.incident_id || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onSync(run.id)}
                        disabled={syncingId === run.id}
                        className="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-50"
                      >
                        Sync
                      </button>
                      {run.agent_url ? (
                        <a href={run.agent_url} target="_blank" rel="noreferrer" className="text-sky-700 hover:underline">
                          Open
                        </a>
                      ) : null}
                      {run.pr_url ? (
                        <a href={run.pr_url} target="_blank" rel="noreferrer" className="text-sky-700 hover:underline">
                          PR
                        </a>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {data?.remote_agents?.length ? (
        <div className="mt-8 rounded-xl bg-white p-5 shadow">
          <h2 className="font-semibold text-gray-900">Remote agents (Cursor API)</h2>
          <ul className="mt-3 divide-y divide-gray-100 text-sm">
            {data.remote_agents.map((agent) => (
              <li key={agent.id} className="flex items-center justify-between py-2">
                <div>
                  <div className="font-medium">{agent.name || agent.id}</div>
                  <div className="text-xs text-gray-500">{agent.status}</div>
                </div>
                {agent.url ? (
                  <a href={agent.url} target="_blank" rel="noreferrer" className="text-sky-700 hover:underline">
                    View
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
