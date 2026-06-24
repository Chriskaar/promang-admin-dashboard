import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  createTestRun,
  fetchTestCatalog,
  fetchTestRun,
  fetchTestRuns,
  opsApiError,
} from "../../api/ops";
import { applyRunToCatalog } from "./testRunCatalog";

function statusBadge(status) {
  if (status === "passed") return "bg-green-100 text-green-800";
  if (status === "failed") return "bg-red-100 text-red-800";
  if (status === "error") return "bg-red-100 text-red-900";
  if (status === "running") return "bg-blue-100 text-blue-800";
  if (status === "queued") return "bg-amber-100 text-amber-900";
  return "bg-gray-100 text-gray-800";
}

function formatDuration(ms) {
  if (ms == null) return "—";
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

function formatWhen(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function runSelectionLabel(run, catalogGroups) {
  if (run?.selection_label) return run.selection_label;

  if (run?.selection_mode === "modules") {
    const labels = run.selected_module_labels?.length
      ? run.selected_module_labels
      : (run.selected_modules || []).map(
          (key) => catalogGroups?.find((group) => group.key === key)?.label || key
        );
    if (labels.length) return labels.join(", ");
  }

  if (run?.selection_mode === "all") return "All API tests";
  if (run?.selection_mode === "files") {
    const count = run.total_files || run.selected_files?.length || 0;
    return `${count} selected file(s)`;
  }

  return run?.selection_mode || "—";
}

function buildOutputCopyText(run) {
  return run?.output || "";
}

function buildAiCopyText(run) {
  if (!run) return "";

  const files = (run.selected_files || []).join("\n");
  const moduleLabels = (run.selected_module_labels || run.selected_modules || []).join(", ");
  const selection = run.selection_label || runSelectionLabel(run);

  return `# Promang API test run #${run.id}

Status: ${run.status}
Selection: ${selection}${moduleLabels && run.selection_mode === "modules" ? `\nModules: ${moduleLabels}` : ""}
Files: ${run.total_files ?? 0}
Results: ${run.passed_count ?? 0} passed, ${run.failed_count ?? 0} failed, ${run.error_count ?? 0} errors, ${run.skipped_count ?? 0} skipped
Assertions: ${run.assertions_count ?? 0}
Duration: ${formatDuration(run.duration_ms)}
Started: ${run.started_at || "—"}
Finished: ${run.finished_at || "—"}
User: ${run.user_email || "—"}

## Selected test files
${files || "(none listed)"}

## Task
Analyze the failures/errors below and propose a minimal fix for promang-api.

## Console output
\`\`\`
${run.output || "(no output yet)"}
\`\`\`
`;
}

async function copyText(text, successMessage) {
  if (!text?.trim()) {
    toast.error("Nothing to copy");
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    toast.success(successMessage);
  } catch {
    toast.error("Could not copy to clipboard");
  }
}

function LiveIndicator() {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-600" />
      </span>
      Live
    </span>
  );
}

function formatRelativeTime(value) {
  if (!value) return null;
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMs / 3600000);
  const days = Math.floor(diffMs / 86400000);

  if (minutes < 1) return "Tested just now";
  if (minutes < 60) return `Tested ${minutes} min ago`;
  if (hours < 24) return hours === 1 ? "Tested 1 hour ago" : `Tested ${hours} hours ago`;
  if (days === 1) return "Tested 1 day ago";
  if (days < 7) return `Tested ${days} days ago`;
  return `Tested ${date.toLocaleDateString()}`;
}

function getLastRun(item) {
  return item?.last_run ?? item?.lastRun ?? null;
}

function runStatsBadge(run) {
  if (!run) return null;
  const total =
    (run.passed_count ?? 0) +
    (run.failed_count ?? 0) +
    (run.error_count ?? 0) +
    (run.skipped_count ?? 0);
  if (!total) return null;
  return {
    status: run.status,
    passed: run.passed_count ?? 0,
    total,
    tested_at: run.finished_at || run.created_at,
  };
}
function TestHistoryBadge({ lastRun, compact = false }) {
  if (!lastRun) return null;

  const passed = lastRun.passed ?? 0;
  const total = lastRun.total ?? 0;
  const isRunning = lastRun.live || lastRun.status === "running";
  const isPass = !isRunning && lastRun.status === "passed" && passed >= total;
  const tagClass = isRunning
    ? "bg-blue-100 text-blue-800 ring-blue-200"
    : isPass
      ? "bg-green-100 text-green-800 ring-green-200"
      : lastRun.status === "error"
        ? "bg-amber-100 text-amber-900 ring-amber-200"
        : "bg-red-100 text-red-800 ring-red-200";
  const label = isRunning
    ? lastRun.indeterminate
      ? "Running"
      : `Running ${passed}/${total}`
    : isPass
      ? "Passed"
      : lastRun.status === "error"
        ? "Error"
        : "Failed";
  const relative = isRunning ? null : formatRelativeTime(lastRun.tested_at);
  const scoreSuffix = isRunning || lastRun.indeterminate ? "" : ` ${passed}/${total}`;

  if (compact) {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${tagClass}`}>
          {label}
          {scoreSuffix}
        </span>
        {relative ? <span className="text-[11px] text-gray-500">{relative}</span> : null}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-0.5 text-right">
      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${tagClass}`}>
        {label}
        {scoreSuffix}
      </span>
      {relative ? <span className="text-[11px] text-gray-500">{relative}</span> : null}
    </div>
  );
}

export default function OpsTests() {
  const [catalog, setCatalog] = useState(null);
  const [history, setHistory] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [refreshingCatalog, setRefreshingCatalog] = useState(false);
  const catalogSyncedRunRef = useRef(null);
  const [search, setSearch] = useState("");
  const [selectedFiles, setSelectedFiles] = useState(() => new Set());
  const [expandedModules, setExpandedModules] = useState(() => new Set());
  const [activeRunId, setActiveRunId] = useState(null);
  const [activeRun, setActiveRun] = useState(null);
  const [starting, setStarting] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const outputRef = useRef(null);
  const lastOutputLengthRef = useRef(0);

  const loadCatalog = useCallback(async (refresh = false, { silent = false } = {}) => {
    if (silent) setRefreshingCatalog(true);
    else setLoadingCatalog(true);
    try {
      const res = await fetchTestCatalog(refresh);
      if (res?.success) setCatalog(res.data);
    } catch (error) {
      toast.error(opsApiError(error, "Could not load test catalog"));
    } finally {
      if (silent) setRefreshingCatalog(false);
      else setLoadingCatalog(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    try {
      const res = await fetchTestRuns(30);
      if (res?.success) setHistory(res.data || []);
    } catch {
      /* optional */
    }
  }, []);

  useEffect(() => {
    loadCatalog();
    loadHistory();
  }, [loadCatalog, loadHistory]);

  useEffect(() => {
    if (!catalog?.groups?.length) return;
    setExpandedModules((prev) => {
      const next = new Set(prev);
      catalog.groups.forEach((group) => {
        if (getLastRun(group)) next.add(group.key);
      });
      return next;
    });
  }, [catalog]);

  const refreshActiveRun = useCallback(async (runId) => {
    if (!runId) return;
    try {
      const res = await fetchTestRun(runId);
      if (!res?.success) return;

      const run = res.data;
      setActiveRun(run);
      setCatalog((prev) => (prev ? applyRunToCatalog(prev, run) : prev));

      const terminal = ["passed", "failed", "error"].includes(run?.status);
      if (terminal && catalogSyncedRunRef.current !== runId) {
        catalogSyncedRunRef.current = runId;
        await loadHistory();
      }
    } catch {
      /* polling */
    }
  }, [loadHistory]);

  const runInProgress = activeRun && !["passed", "failed", "error"].includes(activeRun.status);
  const pollMs = runInProgress ? 800 : 2000;

  useEffect(() => {
    if (!activeRunId) return undefined;
    refreshActiveRun(activeRunId);
    const interval = setInterval(() => {
      refreshActiveRun(activeRunId);
    }, pollMs);
    return () => clearInterval(interval);
  }, [activeRunId, refreshActiveRun, pollMs]);

  useEffect(() => {
    const length = activeRun?.output_length ?? activeRun?.output?.length ?? 0;
    if (!autoScroll || !outputRef.current || length === lastOutputLengthRef.current) return;
    lastOutputLengthRef.current = length;
    outputRef.current.scrollTop = outputRef.current.scrollHeight;
  }, [activeRun?.output, activeRun?.output_length, autoScroll]);

  const filteredGroups = useMemo(() => {
    const groups = catalog?.groups || [];
    const query = search.trim().toLowerCase();
    if (!query) return groups;

    return groups
      .map((group) => {
        const entries = (group.entries || []).filter((entry) => {
          const haystack = [
            entry.file,
            entry.class_name,
            entry.module_label,
            entry.type,
            ...(entry.tests || []),
          ]
            .join(" ")
            .toLowerCase();
          return haystack.includes(query);
        });
        return { ...group, entries };
      })
      .filter((group) => group.entries.length > 0);
  }, [catalog, search]);

  const isModuleExpanded = (moduleKey) =>
    search.trim().length > 0 || expandedModules.has(moduleKey);

  const toggleFile = (fileId) => {
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(fileId)) next.delete(fileId);
      else next.add(fileId);
      return next;
    });
  };

  const toggleModule = (moduleKey) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleKey)) next.delete(moduleKey);
      else next.add(moduleKey);
      return next;
    });
  };

  const selectModuleFiles = (entries, checked) => {
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      entries.forEach((entry) => {
        if (checked) next.add(entry.id);
        else next.delete(entry.id);
      });
      return next;
    });
  };

  const startRun = async (payload) => {
    setStarting(true);
    lastOutputLengthRef.current = 0;
    try {
      const res = await createTestRun(payload);
      if (res?.success) {
        toast.success("Test run started");
        catalogSyncedRunRef.current = null;
        setActiveRunId(res.data.id);
        setActiveRun(res.data);
        setCatalog((prev) => (prev ? applyRunToCatalog(prev, res.data) : prev));
        await loadHistory();
      } else {
        toast.error(res?.message || "Could not start test run");
      }
    } catch (error) {
      const message = opsApiError(error, "Could not start test run");
      toast.error(message);
    } finally {
      setStarting(false);
    }
  };

  const onRunSelected = () => {
    const files = Array.from(selectedFiles);
    if (!files.length) {
      toast.error("Select at least one test file");
      return;
    }
    startRun({ mode: "files", files });
  };

  const onRunAll = () => startRun({ mode: "all" });

  const onRunModule = (moduleKey) => startRun({ mode: "modules", modules: [moduleKey] });

  const runnerAvailable = Boolean(catalog?.runner_available);
  const outputText = activeRun?.output || "";
  const hasOutput = outputText.length > 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">API test runner</h1>
          <p className="mt-1 text-sm text-gray-500">
            Browse promang-api Minitest files, run selected suites locally, and review history.
          </p>
        </div>
        <Link
          to="/dashboard/ops"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
        >
          Back to Ops Center
        </Link>
      </div>

      {!runnerAvailable ? (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
          Test execution is disabled because promang-api is not running in <code>development</code>.
          You can still browse the catalog, but runs must be started against a local development API.
        </div>
      ) : null}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-4 shadow">
          <div className="text-xs uppercase tracking-wide text-gray-500">Test files</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">{catalog?.total_files ?? "—"}</div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow">
          <div className="text-xs uppercase tracking-wide text-gray-500">Individual tests</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">{catalog?.total_tests ?? "—"}</div>
        </div>
        <div className="rounded-xl bg-white p-4 shadow">
          <div className="text-xs uppercase tracking-wide text-gray-500">Selected files</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">{selectedFiles.size}</div>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search file, class, module, or test description…"
          className="min-w-[240px] flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          type="button"
          disabled={refreshingCatalog}
          onClick={() => loadCatalog(true, { silent: Boolean(catalog) })}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          {refreshingCatalog ? "Refreshing…" : "Refresh status"}
        </button>
        <button
          type="button"
          disabled={!runnerAvailable || starting || runInProgress}
          onClick={onRunSelected}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          Run selected
        </button>
        <button
          type="button"
          disabled={!runnerAvailable || starting || runInProgress}
          onClick={onRunAll}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          Run all API tests
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-900">Catalog by module</h2>
          {loadingCatalog ? (
            <div className="rounded-xl bg-white p-6 text-sm text-gray-500 shadow">Loading catalog…</div>
          ) : (
            filteredGroups.map((group) => {
              const expanded = isModuleExpanded(group.key);
              const moduleFiles = group.entries || [];
              const allSelected = moduleFiles.length > 0 && moduleFiles.every((entry) => selectedFiles.has(entry.id));
              return (
                <div key={group.key} className="rounded-xl bg-white shadow">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleModule(group.key)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="font-semibold text-gray-900">{group.label}</div>
                      <div className="text-xs text-gray-500">
                        {group.file_count} files · {group.test_count} tests
                      </div>
                    </button>
                    {getLastRun(group) ? (
                      <TestHistoryBadge lastRun={getLastRun(group)} />
                    ) : null}
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-2 text-xs text-gray-600">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={(event) => selectModuleFiles(moduleFiles, event.target.checked)}
                        />
                        Select module
                      </label>
                      <button
                        type="button"
                        disabled={!runnerAvailable || starting || runInProgress}
                        onClick={() => onRunModule(group.key)}
                        className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs hover:bg-gray-50 disabled:opacity-50"
                      >
                        Run module
                      </button>
                    </div>
                  </div>
                  {expanded ? (
                    <ul className="divide-y divide-gray-100">
                      {moduleFiles.map((entry) => (
                        <li key={entry.id} className="px-4 py-3">
                          <label className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              className="mt-1"
                              checked={selectedFiles.has(entry.id)}
                              onChange={() => toggleFile(entry.id)}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div className="font-medium text-gray-900">{entry.class_name || entry.file}</div>
                                {getLastRun(entry) ? (
                                  <TestHistoryBadge lastRun={getLastRun(entry)} compact />
                                ) : null}
                              </div>
                              <div className="text-xs text-gray-500">{entry.file}</div>
                              <div className="mt-1 text-xs text-gray-500">
                                {entry.type} · {entry.test_count} tests
                              </div>
                              {entry.tests?.length ? (
                                <ul className="mt-2 space-y-1 text-sm text-gray-700">
                                  {entry.tests.map((description) => (
                                    <li key={description} className="rounded bg-gray-50 px-2 py-1">
                                      {description}
                                    </li>
                                  ))}
                                </ul>
                              ) : null}
                            </div>
                          </label>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              );
            })
          )}
        </section>

        <aside className="space-y-4">
          <section className="rounded-xl bg-white p-4 shadow">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold text-gray-900">Current run</h2>
              {runInProgress ? <LiveIndicator /> : null}
            </div>
            {!activeRun ? (
              <p className="mt-2 text-sm text-gray-500">Start a run to see live output here.</p>
            ) : (
              <div className="mt-3 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${statusBadge(activeRun.status)}`}>
                    {activeRun.status}
                  </span>
                  <span className="text-xs text-gray-500">Run #{activeRun.id}</span>
                </div>
                <div className="text-sm font-medium text-gray-900">
                  {runSelectionLabel(activeRun, catalog?.groups)}
                </div>
                {activeRun.selection_mode === "modules" && (activeRun.selected_module_labels?.length || activeRun.selected_modules?.length) ? (
                  <div className="flex flex-wrap gap-1.5">
                    {(activeRun.selected_module_labels ||
                      (activeRun.selected_modules || []).map(
                        (key) => catalog?.groups?.find((group) => group.key === key)?.label || key
                      )).map((label) => (
                      <span
                        key={label}
                        className="rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-800 ring-1 ring-sky-100"
                      >
                        {label}
                      </span>
                    ))}
                  </div>
                ) : null}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-lg bg-gray-50 p-2">
                    <div className="text-xs text-gray-500">Passed</div>
                    <div className="font-semibold text-green-700">{activeRun.passed_count ?? 0}</div>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-2">
                    <div className="text-xs text-gray-500">Failed</div>
                    <div className="font-semibold text-red-700">{activeRun.failed_count ?? 0}</div>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-2">
                    <div className="text-xs text-gray-500">Errors</div>
                    <div className="font-semibold text-red-700">{activeRun.error_count ?? 0}</div>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-2">
                    <div className="text-xs text-gray-500">Duration</div>
                    <div className="font-semibold text-gray-900">{formatDuration(activeRun.duration_ms)}</div>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  {activeRun.total_files} files · {activeRun.assertions_count ?? 0} assertions · started {formatWhen(activeRun.started_at)}
                  {activeRun.updated_at ? (
                    <span> · output updated {formatWhen(activeRun.updated_at)}</span>
                  ) : null}
                </div>
                {activeRun.error_message ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                    {activeRun.error_message}
                  </div>
                ) : null}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={!hasOutput}
                    onClick={() => copyText(buildOutputCopyText(activeRun), "Console output copied")}
                    className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs hover:bg-gray-50 disabled:opacity-50"
                  >
                    Copy output
                  </button>
                  <button
                    type="button"
                    disabled={!activeRun}
                    onClick={() => copyText(buildAiCopyText(activeRun), "AI prompt copied")}
                    className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-800 hover:bg-indigo-100 disabled:opacity-50"
                  >
                    Copy for AI fix
                  </button>
                  <label className="ml-auto flex items-center gap-2 text-xs text-gray-600">
                    <input
                      type="checkbox"
                      checked={autoScroll}
                      onChange={(event) => setAutoScroll(event.target.checked)}
                    />
                    Auto-scroll
                  </label>
                </div>
                <pre
                  ref={outputRef}
                  className="max-h-[480px] overflow-auto rounded-lg bg-slate-950 p-3 font-mono text-xs text-slate-100 whitespace-pre-wrap"
                >
                  {hasOutput ? outputText : runInProgress ? "Waiting for test output…" : "No output captured."}
                </pre>
              </div>
            )}
          </section>

          <section className="rounded-xl bg-white p-4 shadow">
            <h2 className="text-lg font-semibold text-gray-900">History</h2>
            <ul className="mt-3 space-y-2">
              {history.length === 0 ? (
                <li className="text-sm text-gray-500">No runs yet.</li>
              ) : (
                history.map((run) => (
                  <li key={run.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveRunId(run.id);
                        setActiveRun(run);
                        lastOutputLengthRef.current = 0;
                        refreshActiveRun(run.id);
                      }}
                      className="flex w-full items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2 text-left hover:bg-gray-50"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          Run #{run.id} · {runSelectionLabel(run, catalog?.groups)}
                        </div>
                        {runStatsBadge(run) ? (
                          <div className="mt-1">
                            <TestHistoryBadge lastRun={runStatsBadge(run)} compact />
                          </div>
                        ) : null}
                        <div className="text-xs text-gray-500">{formatWhen(run.created_at)}</div>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${statusBadge(run.status)}`}>
                        {run.status}
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
