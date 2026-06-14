import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchOpsAiUsageByCompany } from "../../api/ops";

const PRESETS = [
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
];

function formatCost(usd, nok) {
  if (usd == null && nok == null) return "—";
  const parts = [];
  if (usd != null) parts.push(`$${Number(usd).toFixed(2)}`);
  if (nok != null) parts.push(`${Number(nok).toFixed(2)} NOK`);
  return parts.join(" · ");
}

function formatNumber(value) {
  if (value == null) return "—";
  return Number(value).toLocaleString();
}

export default function OpsAiUsageByCompany() {
  const [preset, setPreset] = useState("24h");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedCompany, setExpandedCompany] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    fetchOpsAiUsageByCompany({ preset })
      .then((res) => {
        if (res?.success) setData(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [preset]);

  useEffect(() => {
    load();
  }, [load]);

  const totals = data?.totals || {};
  const companies = data?.companies || [];
  const assumptions = data?.cost_assumptions || {};

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
            <Link to="/dashboard/ops/ai-usage" className="text-sky-700 hover:underline">
              Promang internal AI
            </Link>
            <span>/</span>
            <span>Tenant usage</span>
          </div>
          <h1 className="mt-1 text-2xl font-semibold text-gray-900">AI usage by company</h1>
          <p className="mt-1 text-sm text-gray-500">
            Tenant product AI only — excludes Promang internal ops (<code className="text-xs">ops.*</code>) and
            events without a billing company
          </p>
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
        <div className="text-sm text-gray-500">Loading tenant AI usage…</div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Companies", totals.companies_count],
          ["Events", totals.events],
          ["Total tokens", formatNumber(totals.total_tokens ?? 0)],
          ["Est. cost (USD)", totals.estimated_cost_usd != null ? `$${totals.estimated_cost_usd}` : "—"],
          ["Est. cost (NOK)", totals.estimated_cost_nok != null ? `${totals.estimated_cost_nok} NOK` : "—"],
          ["Successful", totals.successful_events],
          ["Failed", totals.failed_events],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl bg-white p-4 shadow">
            <div className="text-xs font-semibold uppercase text-gray-500">{label}</div>
            <div className="mt-2 text-2xl font-semibold text-gray-900">{value ?? "—"}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl bg-white p-5 shadow">
        <h2 className="font-semibold text-gray-900">Companies</h2>
        <p className="mt-1 text-sm text-gray-500">
          Sorted by token usage. Expand a row for user and feature breakdown.
        </p>

        {companies.length === 0 ? (
          <p className="mt-4 text-sm text-gray-500">No tenant AI events in this period.</p>
        ) : (
          <ul className="mt-4 divide-y divide-gray-100">
            {companies.map((row) => {
              const expanded = expandedCompany === row.company_id;
              return (
                <li key={row.company_id} className="py-4">
                  <button
                    type="button"
                    onClick={() => setExpandedCompany(expanded ? null : row.company_id)}
                    className="flex w-full flex-wrap items-center justify-between gap-3 text-left"
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-gray-900">{row.company_name}</div>
                      <div className="text-xs text-gray-500">
                        ID {row.company_id} · {row.successful_events} ok · {row.failed_events} failed ·{" "}
                        {formatNumber(row.total_tokens)} tokens
                      </div>
                    </div>
                    <div className="shrink-0 text-right text-sm text-gray-600">
                      {formatCost(row.estimated_cost_usd, row.estimated_cost_nok)}
                      <span className="ml-2 text-xs text-gray-400">{expanded ? "▲" : "▼"}</span>
                    </div>
                  </button>

                  {expanded ? (
                    <div className="mt-4 grid gap-6 lg:grid-cols-2">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">By user</h3>
                        {(row.by_user || []).length === 0 ? (
                          <p className="mt-2 text-sm text-gray-500">No user-attributed events.</p>
                        ) : (
                          <ul className="mt-2 divide-y divide-gray-100 text-sm">
                            {row.by_user.map((user) => (
                              <li key={user.user_id} className="flex items-center justify-between gap-3 py-2">
                                <div className="min-w-0">
                                  <div className="font-medium text-gray-900">{user.user_name}</div>
                                  <div className="truncate text-xs text-gray-500">
                                    {user.user_email || `User #${user.user_id}`} ·{" "}
                                    {formatNumber(user.total_tokens)} tokens
                                  </div>
                                </div>
                                <div className="shrink-0 text-xs text-gray-600">
                                  {formatCost(user.estimated_cost_usd, user.estimated_cost_nok)}
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold text-gray-900">By feature</h3>
                        {(row.by_feature || []).length === 0 ? (
                          <p className="mt-2 text-sm text-gray-500">No feature breakdown.</p>
                        ) : (
                          <ul className="mt-2 divide-y divide-gray-100 text-sm">
                            {row.by_feature.map((feature) => (
                              <li key={feature.feature} className="flex items-center justify-between gap-3 py-2">
                                <div className="min-w-0">
                                  <div className="font-medium text-gray-900">{feature.feature}</div>
                                  <div className="text-xs text-gray-500">
                                    {feature.successful_events} ok · {feature.failed_events} failed ·{" "}
                                    {formatNumber(feature.total_tokens)} tokens
                                  </div>
                                </div>
                                <div className="shrink-0 text-xs text-gray-600">
                                  {formatCost(feature.estimated_cost_usd, feature.estimated_cost_nok)}
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-700">
        <p className="font-medium text-slate-900">Cost assumptions</p>
        <ul className="mt-2 list-disc space-y-1 pl-4">
          <li>USD→NOK rate: {assumptions.usd_to_nok_rate ?? "—"}</li>
          <li>Tenant billing rate (NOK/M tokens): {assumptions.nok_per_million_tokens ?? "—"}</li>
          <li>Excludes Promang internal ops (<code className="text-xs">ops.*</code>) and events with no billing company</li>
          <li>GPT: model-specific token rates (override via ENV — see docs)</li>
        </ul>
      </div>
    </div>
  );
}
