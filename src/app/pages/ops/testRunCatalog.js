const TERMINAL_STATUSES = new Set(["passed", "failed", "error"]);

export function runTestTotal(run) {
  const total =
    (run.passed_count ?? 0) +
    (run.failed_count ?? 0) +
    (run.error_count ?? 0) +
    (run.skipped_count ?? 0);
  return total > 0 ? total : null;
}

export function buildLastRunPayload(run, passed, total, scope, { live = false, indeterminate = false } = {}) {
  const totalInt = Number(total) || 0;
  const passedInt = Number(passed) || 0;
  let status = run.status;

  if (!live) {
    if (run.status === "passed" && totalInt === 0 && (run.passed_count ?? 0) === 0) {
      status = "failed";
    } else if (passedInt >= totalInt && run.status === "passed") {
      status = "passed";
    } else if (run.status === "error" && passedInt === 0) {
      status = "error";
    } else {
      status = "failed";
    }
  }

  return {
    run_id: run.id,
    status,
    passed: passedInt,
    total: totalInt,
    tested_at: run.finished_at || run.started_at || run.created_at,
    scope,
    ...(live ? { live: true } : {}),
    ...(indeterminate ? { indeterminate: true } : {}),
  };
}

function moduleRunForGroup(group, run) {
  const files = new Set((run.selected_files || []).map(String));
  const moduleKeys = new Set((run.selected_modules || []).map(String));

  if (run.selection_mode === "all") return true;
  if (run.selection_mode === "modules" && moduleKeys.has(group.key)) return true;
  if (run.selection_mode === "files") {
    const entries = group.entries || [];
    return entries.length > 0 && entries.every((entry) => files.has(entry.file));
  }
  return false;
}

function fileIncludedInRun(entry, run, moduleRun) {
  if (run.selection_mode === "all" || moduleRun) return true;
  return (run.selected_files || []).map(String).includes(entry.file);
}

function fileLastRun(entry, run, moduleRun, live) {
  const files = (run.selected_files || []).map(String);
  const isSingleFileRun =
    run.selection_mode === "files" && files.length === 1 && files[0] === entry.file;

  if (isSingleFileRun) {
    const total = runTestTotal(run) ?? entry.test_count;
    const passed = live
      ? run.passed_count ?? 0
      : run.status === "passed"
        ? total
        : run.passed_count ?? 0;
    return buildLastRunPayload(run, passed, total, "file", { live });
  }

  if (moduleRun) {
    if (live) {
      return buildLastRunPayload(run, 0, entry.test_count, "module_file", {
        live: true,
        indeterminate: true,
      });
    }
    if (run.status === "passed") {
      return buildLastRunPayload(run, entry.test_count, entry.test_count, "module_file");
    }
    return buildLastRunPayload(run, 0, entry.test_count, "module_file");
  }

  if (run.selection_mode === "files" && files.includes(entry.file)) {
    const total = runTestTotal(run) ?? entry.test_count;
    const passed = live
      ? run.passed_count ?? 0
      : run.status === "passed"
        ? total
        : run.passed_count ?? 0;
    return buildLastRunPayload(run, passed, total, "file", { live });
  }

  return null;
}

export function applyRunToCatalog(catalog, run) {
  if (!catalog?.groups || !run) return catalog;

  const live = !TERMINAL_STATUSES.has(run.status);

  return {
    ...catalog,
    groups: catalog.groups.map((group) => {
      const moduleRun = moduleRunForGroup(group, run);
      let groupLastRun = group.last_run;

      if (moduleRun) {
        const total = runTestTotal(run) ?? group.test_count;
        const passed = live
          ? run.passed_count ?? 0
          : run.status === "passed"
            ? total
            : run.passed_count ?? 0;
        groupLastRun = buildLastRunPayload(run, passed, total, "module", { live });
      }

      const entries = (group.entries || []).map((entry) => {
        if (!fileIncludedInRun(entry, run, moduleRun)) return entry;
        const lastRun = fileLastRun(entry, run, moduleRun, live);
        return lastRun ? { ...entry, last_run: lastRun } : entry;
      });

      return { ...group, last_run: groupLastRun, entries };
    }),
  };
}
