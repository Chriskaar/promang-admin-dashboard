import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchOpsAiUsage } from "../../api/ops";

const PRESETS = [
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
];

const FEATURES = [
  { value: "", label: "All ops features" },
  { value: "ops.community_report_triage", label: "Community report triage (GPT)" },
  { value: "ops.cursor_agent_dispatch", label: "Cursor agent dispatch" },
  { value: "ops.github_ai_dispatch", label: "GitHub AI fix dispatch" },
];

function formatCost(usd, nok) {
  if (usd == null && nok == null) return "—";
  const parts = [];
  if (usd != null) parts.push(`$${Number(usd).toFixed(2)}`);
  if (nok != null) parts.push(`${Number(nok).toFixed(2)} NOK`);
  return parts.join(" · ");
}

function StatusBadge({ success }) {
  return (
    <span
      className={
        success
          ? "rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800"
          : "rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800"
      }
    >
      {success ? "OK" : "Failed"}
    </span>
  );
}

export default function OpsAiUsage() {
  const [preset, setPreset] = useState("24h");
  const [feature, setFeature] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetchOpsAiUsage({ preset, feature: feature || undefined })
      .then((res) => {
        if (res?.success) setData(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [preset, feature]);

  useEffect(() => {
    load();
  }, [load]);

  const totals = data?.totals || {};
  const assumptions = data?.cost_assumptions || {};

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Promang internal AI usage</h1>
          <p className="mt-1 text-sm text-gray-500">
            Platform ops only — community triage, Cursor agents, GitHub AI dispatch. Not billed to tenants.
          </p>
          <Link
            to="/dashboard/ops/ai-usage/companies"
            className="mt-2 inline-block text-sm text-sky-700 hover:underline"
          >
            View tenant AI usage by company →
          </Link>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="block text-sm">
            <span className="font-medium text-gray-700">Period</span>
            <select
              value={preset}
              onChange={(e) => setPreset(e.target.value)}
              className="mt-1 block rounded border border-gray-300 px-3 py-2 text-sm"
            >
              {PRESETS.map((row) => (
                <option key={row.value} value={row.value}>
                  {row.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="font-medium text-gray-700">Feature</span>
            <select
              value={feature}
              onChange={(e) => setFeature(e.target.value)}
              className="mt-1 block min-w-[16rem] rounded border border-gray-300 px-3 py-2 text-sm"
            >
              {FEATURES.map((row) => (
                <option key={row.value || "all"} value={row.value}>
                  {row.label}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={load}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {loading && !data ? (
        <div className="text-sm text-gray-500">Loading AI usage…</div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Events", totals.events],
          ["Successful", totals.successful_events],
          ["Failed", totals.failed_events],
          ["Total tokens", totals.total_tokens ?? 0],
          ["Est. cost (USD)", totals.estimated_cost_usd != null ? `$${totals.estimated_cost_usd}` : "—"],
          ["Est. cost (NOK)", totals.estimated_cost_nok != null ? `${totals.estimated_cost_nok} NOK` : "—"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl bg-white p-4 shadow">
            <div className="text-xs font-semibold uppercase text-gray-500">{label}</div>
            <div className="mt-2 text-2xl font-semibold text-gray-900">{value ?? "—"}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-5 shadow">
          <h2 className="font-semibold text-gray-900">By feature</h2>
          <ul className="mt-3 divide-y divide-gray-100 text-sm">
            {(data?.by_feature || []).length === 0 ? (
              <li className="py-3 text-gray-500">No ops AI events in this period.</li>
            ) : (
              data.by_feature.map((row) => (
                <li key={row.feature} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900">{row.feature}</div>
                    <div className="text-xs text-gray-500">
                      {row.successful_events} ok · {row.failed_events} failed · {row.total_tokens} tokens
                    </div>
                  </div>
                  <div className="shrink-0 text-right text-xs text-gray-600">
                    {formatCost(row.estimated_cost_usd, row.estimated_cost_nok)}
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="rounded-xl bg-white p-5 shadow">
          <h2 className="font-semibold text-gray-900">By provider</h2>
          <ul className="mt-3 divide-y divide-gray-100 text-sm">
            {(data?.by_provider || []).length === 0 ? (
              <li className="py-3 text-gray-500">No provider breakdown.</li>
            ) : (
              data.by_provider.map((row) => (
                <li key={row.provider} className="flex items-center justify-between gap-3 py-3">
                  <div>
                    <div className="font-medium text-gray-900">{row.provider}</div>
                    <div className="text-xs text-gray-500">
                      {row.events} events · {row.total_tokens} tokens
                    </div>
                  </div>
                  <div className="text-xs text-gray-600">
                    {formatCost(row.estimated_cost_usd, row.estimated_cost_nok)}
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      <div className="mt-8 rounded-xl bg-white p-5 shadow">
        <h2 className="font-semibold text-gray-900">Recent events</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase text-gray-500">
                <th className="px-2 py-2">Time</th>
                <th className="px-2 py-2">Feature</th>
                <th className="px-2 py-2">Provider</th>
                <th className="px-2 py-2">Tokens</th>
                <th className="px-2 py-2">Cost</th>
                <th className="px-2 py-2">Link</th>
                <th className="px-2 py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(data?.recent_events || []).length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-2 py-4 text-gray-500">
                    No events yet. Triage, Cursor, and GitHub dispatches are recorded automatically.
                  </td>
                </tr>
              ) : (
                data.recent_events.map((row) => (
                  <tr key={row.id}>
                    <td className="whitespace-nowrap px-2 py-2 text-xs text-gray-500">
                      {new Date(row.created_at).toLocaleString()}
                    </td>
                    <td className="px-2 py-2 font-medium text-gray-900">{row.feature}</td>
                    <td className="px-2 py-2 text-gray-600">{row.provider || "—"}</td>
                    <td className="px-2 py-2 text-gray-600">{row.total_tokens ?? "—"}</td>
                    <td className="whitespace-nowrap px-2 py-2 text-xs text-gray-600">
                      {formatCost(row.estimated_cost_usd, row.estimated_cost_nok)}
                    </td>
                    <td className="px-2 py-2 text-xs text-gray-600">
                      {row.incident_id ? (
                        <span>incident #{row.incident_id}</span>
                      ) : row.report_id ? (
                        <span>
                          report #{row.report_id}
                          {row.related_company_id ? ` · tenant ${row.related_company_id}` : ""}
                        </span>
                      ) : row.related_company_id ? (
                        <span>tenant {row.related_company_id}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-2 py-2">
                      <StatusBadge success={row.success} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {rowErrorHint(data)}
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700">
        <p className="font-medium text-slate-900">Cost assumptions</p>
        <ul className="mt-2 list-disc space-y-1 pl-4">
          <li>USD→NOK rate: {assumptions.usd_to_nok_rate ?? "—"}</li>
          <li>Cursor agent estimate: ${assumptions.cursor_estimated_cost_usd ?? "—"} per launch</li>
          <li>GitHub AI fix estimate: ${assumptions.github_ai_estimated_cost_usd ?? "—"} per dispatch</li>
          <li>GPT: model-specific token rates (override via ENV — see docs)</li>
        </ul>
      </div>
    </div>
  );
}

function rowErrorHint(data) {
  const failed = (data?.recent_events || []).filter((r) => !r.success && r.error_message);
  if (failed.length === 0) return null;
  return (
    <p className="mt-3 text-xs text-gray-500">
      Latest failure: {failed[0].error_message?.slice(0, 120)}
      {failed[0].error_message?.length > 120 ? "…" : ""}
    </p>
  );
}
