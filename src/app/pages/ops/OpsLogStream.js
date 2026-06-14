import { useEffect, useMemo, useRef, useState } from "react";
import {
  classifyLogLine,
  LOG_LINE_STYLES,
  sortLinesChronological,
} from "./opsLogUtils";

const STICK_THRESHOLD_PX = 56;

export default function OpsLogStream({
  lines,
  paused = false,
  className = "",
  emptyMessage = "No log lines yet.",
  onFlagLine,
  busyKey,
}) {
  const containerRef = useRef(null);
  const stickToBottomRef = useRef(true);
  const [showJumpToLatest, setShowJumpToLatest] = useState(false);

  const orderedLines = useMemo(() => sortLinesChronological(lines), [lines]);

  const scrollToBottom = (behavior = "auto") => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  };

  useEffect(() => {
    if (paused || !stickToBottomRef.current) return;
    scrollToBottom("auto");
  }, [orderedLines, paused]);

  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;

    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const nearBottom = distanceFromBottom <= STICK_THRESHOLD_PX;
    stickToBottomRef.current = nearBottom;
    setShowJumpToLatest(!nearBottom);
  };

  const handleJumpToLatest = () => {
    stickToBottomRef.current = true;
    setShowJumpToLatest(false);
    scrollToBottom("smooth");
  };

  return (
    <div className={`relative min-h-0 ${className}`}>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-auto font-mono text-xs"
      >
        {orderedLines.length === 0 ? (
          <div className="text-slate-400">{emptyMessage}</div>
        ) : (
          orderedLines.map((line, idx) => {
            const kind = classifyLogLine(line);
            const styles = LOG_LINE_STYLES[kind] || LOG_LINE_STYLES.info;
            const lineKey = `${line.timestamp}-${idx}-${line.message?.slice(0, 24)}`;
            const flaggable = Boolean(onFlagLine) && (kind === "error" || kind === "warn");

            return (
              <div
                key={lineKey}
                className={`group whitespace-pre-wrap break-words py-0.5 ${styles.row}`}
              >
                <span className="text-slate-500">{line.timestamp} </span>
                <span className={styles.text}>{line.message}</span>
                {flaggable ? (
                  <span className="ml-2 inline-flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => onFlagLine(line, true)}
                      disabled={busyKey === `${line.timestamp}-${line.message?.slice(0, 24)}-cursor`}
                      className="rounded border border-sky-500/60 px-1.5 py-0.5 text-[10px] text-sky-200 hover:bg-sky-950 disabled:opacity-50"
                    >
                      Cursor fix
                    </button>
                    <button
                      type="button"
                      onClick={() => onFlagLine(line, false)}
                      disabled={busyKey === `${line.timestamp}-${line.message?.slice(0, 24)}-incident`}
                      className="rounded border border-slate-500/60 px-1.5 py-0.5 text-[10px] text-slate-200 hover:bg-slate-900 disabled:opacity-50"
                    >
                      Flag incident
                    </button>
                  </span>
                ) : null}
              </div>
            );
          })
        )}
      </div>

      {showJumpToLatest && !paused ? (
        <button
          type="button"
          onClick={handleJumpToLatest}
          className="absolute bottom-3 right-3 rounded-full border border-slate-600 bg-slate-900/95 px-3 py-1.5 text-xs text-slate-100 shadow-lg hover:bg-slate-800"
        >
          Jump to latest
        </button>
      ) : null}
    </div>
  );
}
