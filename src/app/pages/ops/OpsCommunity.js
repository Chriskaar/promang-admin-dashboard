import { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
  approveCommunityReport,
  dispatchCommunityFix,
  fetchCommunityReportsAdmin,
  rejectCommunityReport,
  opsApiError,
} from "../../api/ops";

export default function OpsCommunity() {
  const [rows, setRows] = useState([]);
  const [counts, setCounts] = useState(null);
  const [pendingOnly, setPendingOnly] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [note, setNote] = useState("");

  const load = useCallback(() => {
    fetchCommunityReportsAdmin({ pending: pendingOnly ? 1 : undefined, limit: 100 })
      .then((res) => {
        if (res?.success) {
          setRows(res.data || []);
          setCounts(res.counts);
        }
      })
      .catch(() => {});
  }, [pendingOnly]);

  useEffect(() => {
    load();
  }, [load]);

  const withAction = async (id, action) => {
    setBusyId(id);
    try {
      let res;
      if (action === "approve") res = await approveCommunityReport(id, note || undefined);
      else if (action === "reject") res = await rejectCommunityReport(id, note || undefined);
      else res = await dispatchCommunityFix(id);

      if (res?.success) {
        toast.success(action === "dispatch" ? "Fix dispatched" : `Report ${action}d`);
        setNote("");
        load();
      } else {
        toast.error(opsApiError(res, "Action failed"));
      }
    } catch (err) {
      toast.error(opsApiError(err, "Action failed"));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Community reports</h1>
          <p className="text-sm text-gray-500">User bug reports and feature votes — AI triage, admin approval before fixes</p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={pendingOnly} onChange={(e) => setPendingOnly(e.target.checked)} />
          Pending approval only
        </label>
      </div>

      {counts ? (
        <div className="mb-4 flex flex-wrap gap-4 text-sm text-gray-600">
          <span>Pending: {counts.pending_approval}</span>
          <span>Approved: {counts.approved}</span>
          <span>Spam: {counts.spam}</span>
        </div>
      ) : null}

      <div className="mb-4">
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional admin note for approve/reject"
          className="w-full max-w-xl rounded border border-gray-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="space-y-4">
        {rows.length === 0 ? (
          <div className="rounded-xl bg-white p-6 text-sm text-gray-500 shadow">No reports in this filter.</div>
        ) : (
          rows.map((row) => (
            <div key={row.id} className="rounded-xl bg-white p-5 shadow">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold uppercase text-gray-500">
                    {row.kind} · {row.status} · {row.admin_decision}
                  </div>
                  <h2 className="mt-1 font-semibold text-gray-900">{row.title}</h2>
                  <p className="mt-2 text-sm text-gray-600 whitespace-pre-wrap">{row.description}</p>
                  <div className="mt-2 text-xs text-gray-500">
                    {row.user_name} ({row.user_email}) · {row.company_name}
                    {row.votes_count ? ` · ${row.votes_count} votes` : ""}
                  </div>
                  {row.triage_summary ? (
                    <p className="mt-2 rounded bg-slate-50 p-2 text-xs text-slate-700">
                      AI ({row.triage_result}, {(row.triage_confidence * 100).toFixed(0)}%): {row.triage_summary}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {row.status === "pending_approval" ? (
                    <>
                      <button
                        type="button"
                        disabled={busyId === row.id}
                        onClick={() => withAction(row.id, "approve")}
                        className="rounded bg-green-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-800 disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={busyId === row.id}
                        onClick={() => withAction(row.id, "reject")}
                        className="rounded bg-red-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-800 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </>
                  ) : null}
                  {row.kind === "bug" && row.admin_decision === "approved" && row.status !== "in_progress" ? (
                    <button
                      type="button"
                      disabled={busyId === row.id}
                      onClick={() => withAction(row.id, "dispatch")}
                      className="rounded bg-sky-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-800 disabled:opacity-50"
                    >
                      Dispatch AI fix
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
