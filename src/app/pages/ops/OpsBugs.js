import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
  fetchOpsBugs,
  dispatchOpsFix,
  launchCursorAgent,
  createIncidentFromSentry,
  resolveOpsIncident,
  resolveSentryIssue,
  opsApiError,
} from "../../api/ops";

function statusBadge(status) {
  const colors = {
    open: "bg-red-100 text-red-800",
    notified: "bg-amber-100 text-amber-800",
    pr_opened: "bg-sky-100 text-sky-800",
    resolved: "bg-green-100 text-green-800",
    ignored: "bg-gray-100 text-gray-700",
  };
  return colors[status] || "bg-gray-100 text-gray-700";
}

export default function OpsBugs() {
  const [data, setData] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = () =>
    fetchOpsBugs(100, statusFilter || undefined).then((res) => {
      if (res?.success) setData(res.data);
    });

  useEffect(() => {
    load().catch(() => {});
  }, [statusFilter]);

  const onDispatch = async (bug, useCursor) => {
    setBusyId(`${bug.id || bug.external_id}-${useCursor ? "cursor" : "gh"}`);
    try {
      let res;
      if (bug.id) {
        res = useCursor
          ? await launchCursorAgent({ incidentId: bug.id })
          : await dispatchOpsFix(bug.id);
      } else if (bug.external_id) {
        res = await createIncidentFromSentry(bug.external_id, { dispatch: useCursor });
      } else {
        toast.error("Missing incident reference");
        return;
      }
      if (res?.success) {
        toast.success(useCursor ? "Cursor agent launched" : "Fix workflow dispatched");
        await load();
      } else {
        toast.error(opsApiError(res, "Dispatch failed"));
      }
    } catch (err) {
      toast.error(opsApiError(err, "Dispatch failed"));
    } finally {
      setBusyId(null);
    }
  };

  const onResolve = async (bug) => {
    setBusyId(`${bug.id || bug.external_id}-resolve`);
    try {
      const res = bug.id
        ? await resolveOpsIncident(bug.id)
        : await resolveSentryIssue(bug.external_id);
      if (res?.success) {
        toast.success("Marked resolved");
        await load();
      } else {
        toast.error(opsApiError(res, "Resolve failed"));
      }
    } catch (err) {
      toast.error(opsApiError(err, "Resolve failed"));
    } finally {
      setBusyId(null);
    }
  };

  const bugs = data?.bugs || [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Bugs &amp; incidents</h1>
          <p className="text-sm text-gray-500">Platform incidents plus live Sentry issues</p>
        </div>
        <label className="text-sm">
          <span className="font-medium text-gray-700">Status</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="mt-1 block rounded border border-gray-300 px-3 py-2"
          >
            <option value="">All</option>
            <option value="open">Open</option>
            <option value="notified">Notified</option>
            <option value="pr_opened">PR opened</option>
            <option value="resolved">Resolved</option>
          </select>
        </label>
      </div>

      {data?.counts ? (
        <div className="mb-4 flex flex-wrap gap-3 text-sm text-gray-600">
          <span>Open: {data.counts.open}</span>
          <span>Resolved: {data.counts.resolved}</span>
          <span>Sentry-only: {data.counts.sentry_only}</span>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Issue</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Agent</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {bugs.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-gray-500">
                  No bugs found.
                </td>
              </tr>
            ) : (
              bugs.map((bug) => (
                <tr key={`${bug.source}-${bug.id || bug.external_id}`}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{bug.title}</div>
                    <div className="text-xs text-gray-500">
                      {bug.level} · {bug.project} · {bug.source}
                    </div>
                    {bug.cursor_agent_run?.error_message ? (
                      <div className="mt-1 text-xs text-red-600">{bug.cursor_agent_run.error_message}</div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(bug.status)}`}>
                      {bug.status}
                    </span>
                    {bug.sentry_resolved ? (
                      <div className="mt-1 text-xs text-green-700">Sentry resolved</div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {bug.cursor_agent_run ? (
                      <>
                        <div>{bug.cursor_agent_run.status}</div>
                        {bug.cursor_agent_run.agent_url ? (
                          <a href={bug.cursor_agent_run.agent_url} target="_blank" rel="noreferrer" className="text-sky-700 hover:underline">
                            Agent
                          </a>
                        ) : null}
                      </>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      {(bug.id || bug.external_id) && !bug.github_pr_url && bug.status !== "resolved" ? (
                        <>
                          <button
                            type="button"
                            onClick={() => onDispatch(bug, true)}
                            disabled={busyId === `${bug.id || bug.external_id}-cursor`}
                            className="rounded border border-sky-300 px-2 py-1 text-xs text-sky-800 hover:bg-sky-50 disabled:opacity-50"
                          >
                            Cursor fix
                          </button>
                          {bug.id ? (
                            <button
                              type="button"
                              onClick={() => onDispatch(bug, false)}
                              disabled={busyId === `${bug.id}-gh`}
                              className="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-50"
                            >
                              GitHub fix
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => onResolve(bug)}
                            disabled={busyId === `${bug.id || bug.external_id}-resolve`}
                            className="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-50"
                          >
                            Resolve
                          </button>
                        </>
                      ) : null}
                      {bug.github_pr_url ? (
                        <a href={bug.github_pr_url} target="_blank" rel="noreferrer" className="rounded bg-sky-700 px-2 py-1 text-xs text-white">
                          PR
                        </a>
                      ) : null}
                      {bug.permalink ? (
                        <a href={bug.permalink} target="_blank" rel="noreferrer" className="text-sky-700 hover:underline">
                          Sentry
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
    </div>
  );
}
