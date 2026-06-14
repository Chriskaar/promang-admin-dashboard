import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
  createIncidentFromSentry,
  fetchOpsErrors,
  resolveSentryIssue,
  opsApiError,
} from "../../api/ops";

export default function OpsErrors() {
  const [data, setData] = useState(null);
  const [busyKey, setBusyKey] = useState(null);

  const load = () =>
    fetchOpsErrors(50).then((res) => {
      if (res?.success) setData(res.data);
    });

  useEffect(() => {
    load().catch(() => {});
  }, []);

  const onCursorFix = async (issue) => {
    setBusyKey(`${issue.id}-cursor`);
    try {
      const res = await createIncidentFromSentry(issue.id, { dispatch: true });
      if (res?.success) {
        toast.success("Cursor agent launched");
        await load();
      } else {
        toast.error(opsApiError(res, "Dispatch failed"));
      }
    } catch (err) {
      toast.error(opsApiError(err, "Dispatch failed"));
    } finally {
      setBusyKey(null);
    }
  };

  const onResolve = async (issue) => {
    setBusyKey(`${issue.id}-resolve`);
    try {
      const res = await resolveSentryIssue(issue.id);
      if (res?.success) {
        toast.success("Issue resolved in Sentry");
        await load();
      } else {
        toast.error(opsApiError(res, "Resolve failed"));
      }
    } catch (err) {
      toast.error(opsApiError(err, "Resolve failed"));
    } finally {
      setBusyKey(null);
    }
  };

  const issues = data?.issues || [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-gray-900">Sentry errors</h1>
      <p className="mt-1 text-sm text-gray-500">
        Import issues as platform incidents and launch Cursor agents or mark resolved in Sentry.
      </p>

      {!data?.configured ? (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {data?.hint || "Configure SENTRY_AUTH_TOKEN, SENTRY_ORG, and SENTRY_PROJECT on the API."}
        </div>
      ) : null}

      {data?.configured && data?.success === false && data?.error ? (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          {data.error}
        </div>
      ) : null}

      <div className="mt-6 overflow-hidden rounded-xl bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Title</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Level</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Count</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-600">Last seen</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {issues.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-gray-500">
                  No unresolved issues.
                </td>
              </tr>
            ) : (
              issues.map((issue) => (
                <tr key={issue.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{issue.title}</div>
                    <div className="text-xs text-gray-500">{issue.culprit}</div>
                  </td>
                  <td className="px-4 py-3">{issue.level}</td>
                  <td className="px-4 py-3">{issue.count}</td>
                  <td className="px-4 py-3">{issue.last_seen}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => onCursorFix(issue)}
                        disabled={busyKey === `${issue.id}-cursor`}
                        className="rounded border border-sky-300 px-2 py-1 text-xs text-sky-800 hover:bg-sky-50 disabled:opacity-50"
                      >
                        {busyKey === `${issue.id}-cursor` ? "Launching…" : "Start Cursor agent"}
                      </button>
                      <button
                        type="button"
                        onClick={() => onResolve(issue)}
                        disabled={busyKey === `${issue.id}-resolve`}
                        className="rounded border border-gray-300 px-2 py-1 text-xs hover:bg-gray-50 disabled:opacity-50"
                      >
                        {busyKey === `${issue.id}-resolve` ? "Resolving…" : "Mark resolved"}
                      </button>
                      {issue.permalink ? (
                        <a href={issue.permalink} target="_blank" rel="noreferrer" className="text-sky-700 hover:underline">
                          Open
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
