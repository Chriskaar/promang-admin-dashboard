const ERROR_PATTERN =
  /\b(error|fatal|exception|failed|failure|panic|critical|segfault)\b|uncaught|stack trace|status=(5\d{2})\b|\b5\d{2}\s+(error|internal|bad gateway|service unavailable)/i;

const WARN_PATTERN = /\b(warn|warning|deprecated|retry|timeout|slow)\b|status=(4\d{2})\b/i;

const DEBUG_PATTERN = /\b(debug|trace|verbose)\b/i;

export function classifyLogLine(line) {
  const level = String(line?.level || "").toLowerCase();
  const message = String(line?.message || "");

  if (level === "error" || level === "fatal" || level === "critical") {
    return "error";
  }
  if (level === "warn" || level === "warning") {
    return "warn";
  }
  if (level === "debug" || level === "trace") {
    return "debug";
  }

  if (ERROR_PATTERN.test(message)) return "error";
  if (WARN_PATTERN.test(message)) return "warn";
  if (DEBUG_PATTERN.test(message)) return "debug";

  return "info";
}

export const LOG_LINE_STYLES = {
  error: {
    text: "text-red-300",
    row: "border-l-2 border-red-500/70 bg-red-950/25 pl-2",
  },
  warn: {
    text: "text-amber-200",
    row: "border-l-2 border-amber-500/60 bg-amber-950/20 pl-2",
  },
  debug: {
    text: "text-slate-400",
    row: "pl-2 opacity-80",
  },
  info: {
    text: "text-green-200",
    row: "pl-2",
  },
};

export function sortLinesChronological(lines) {
  return [...lines].sort((a, b) => {
    const ta = Date.parse(a?.timestamp || "") || 0;
    const tb = Date.parse(b?.timestamp || "") || 0;
    if (ta !== tb) return ta - tb;
    return String(a?.message || "").localeCompare(String(b?.message || ""));
  });
}
