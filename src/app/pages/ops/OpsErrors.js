import { useEffect, useState } from "react";
import { fetchOpsErrors } from "../../api/ops";

export default function OpsErrors() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchOpsErrors(50)
      .then((res) => {
        if (res?.success) setData(res.data);
      })
      .catch(() => {});
  }, []);

  const issues = data?.issues || [];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-gray-900">Sentry errors</h1>

      {!data?.configured ? (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {data?.hint || "Configure SENTRY_AUTH_TOKEN, SENTRY_ORG, and SENTRY_PROJECT on the API."}
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
                    {issue.permalink ? (
                      <a href={issue.permalink} target="_blank" rel="noreferrer" className="text-sky-700 hover:underline">
                        Open
                      </a>
                    ) : null}
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
