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

            return (
              <div
                key={`${line.timestamp}-${idx}-${line.message?.slice(0, 24)}`}
                className={`whitespace-pre-wrap break-words py-0.5 ${styles.row}`}
              >
                <span className="text-slate-500">{line.timestamp} </span>
                <span className={styles.text}>{line.message}</span>
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
