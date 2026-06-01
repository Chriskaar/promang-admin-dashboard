import { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import {
  confirmUpdateComplete,
  createPlatformNotice,
  createScheduledUpdate,
  fetchPlatformBroadcastState,
  fetchPlatformNoticesAdmin,
  fetchScheduledUpdatesHistory,
  startMaintenance,
  updatePlatformNotice,
} from "../../api/platformBroadcasts";

function localDatetimeValue(d) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export default function OpsBroadcasts() {
  const [state, setState] = useState(null);
  const [notices, setNotices] = useState([]);
  const [history, setHistory] = useState([]);
  const [busy, setBusy] = useState(false);

  const [suTitle, setSuTitle] = useState("");
  const [suDesc, setSuDesc] = useState("");
  const [suWhen, setSuWhen] = useState(() => localDatetimeValue(new Date()));
  const [maintEnd, setMaintEnd] = useState(() => localDatetimeValue(new Date()));
  const [nKind, setNKind] = useState("info");
  const [nTitle, setNTitle] = useState("");
  const [nDesc, setNDesc] = useState("");

  const refresh = useCallback(async () => {
    const [broadcast, noticeRes, histRes] = await Promise.all([
      fetchPlatformBroadcastState(),
      fetchPlatformNoticesAdmin(),
      fetchScheduledUpdatesHistory(),
    ]);
    setState(broadcast);
    if (noticeRes?.success) setNotices(noticeRes.data);
    if (histRes?.success) setHistory(histRes.data);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const activeSu = state?.scheduled_update;

  const submitSchedule = async () => {
    if (!suTitle.trim()) return toast.error("Title required");
    setBusy(true);
    try {
      const res = await createScheduledUpdate({
        title: suTitle.trim(),
        description: suDesc.trim() || undefined,
        scheduled_at: new Date(suWhen).toISOString(),
      });
      if (res.success) {
        toast.success("Scheduled update created");
        setSuTitle("");
        setSuDesc("");
        await refresh();
      } else toast.error("Failed");
    } catch {
      toast.error("Request failed");
    } finally {
      setBusy(false);
    }
  };

  const submitMaintain = async () => {
    if (!activeSu?.id) return;
    setBusy(true);
    try {
      const res = await startMaintenance(activeSu.id, new Date(maintEnd).toISOString());
      if (res.success) {
        toast.success("Maintenance started");
        await refresh();
      } else toast.error("Failed");
    } catch {
      toast.error("Request failed");
    } finally {
      setBusy(false);
    }
  };

  const submitConfirm = async () => {
    if (!activeSu?.id) return;
    if (!window.confirm("Confirm update complete?")) return;
    setBusy(true);
    try {
      const res = await confirmUpdateComplete(activeSu.id);
      if (res.success) {
        toast.success("Update confirmed");
        await refresh();
      }
    } catch {
      toast.error("Request failed");
    } finally {
      setBusy(false);
    }
  };

  const submitNotice = async () => {
    if (!nTitle.trim()) return toast.error("Title required");
    setBusy(true);
    try {
      const res = await createPlatformNotice({
        kind: nKind,
        title: nTitle.trim(),
        description: nDesc.trim() || undefined,
      });
      if (res.success) {
        toast.success("Notice created");
        setNTitle("");
        setNDesc("");
        await refresh();
      }
    } catch {
      toast.error("Request failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-2xl font-semibold text-gray-900">Platform broadcasts</h1>
      <p className="mt-1 text-sm text-gray-500">
        Scheduled updates, maintenance lock, and global notices
      </p>

      <div className="mt-6 rounded-xl bg-white p-5 shadow">
        <h2 className="font-semibold">Current status</h2>
        <p className="mt-2 text-sm text-gray-600">
          {activeSu
            ? `${activeSu.title} (${activeSu.phase})`
            : "No active scheduled update"}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy || !activeSu || activeSu.phase !== "announced"}
            onClick={submitMaintain}
            className="rounded bg-amber-600 px-3 py-1.5 text-sm text-white disabled:opacity-50"
          >
            Start maintenance
          </button>
          <button
            type="button"
            disabled={busy || !activeSu}
            onClick={submitConfirm}
            className="rounded bg-emerald-600 px-3 py-1.5 text-sm text-white disabled:opacity-50"
          >
            Confirm complete
          </button>
        </div>
        <label className="mt-4 block text-sm">
          Expected end (maintenance)
          <input
            type="datetime-local"
            className="mt-1 w-full max-w-xs rounded border px-2 py-1.5"
            value={maintEnd}
            onChange={(e) => setMaintEnd(e.target.value)}
          />
        </label>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-5 shadow">
          <h2 className="font-semibold">Schedule update</h2>
          <div className="mt-3 space-y-3 text-sm">
            <input
              className="w-full rounded border px-2 py-1.5"
              placeholder="Title"
              value={suTitle}
              onChange={(e) => setSuTitle(e.target.value)}
            />
            <textarea
              className="w-full rounded border px-2 py-1.5"
              rows={3}
              placeholder="Description"
              value={suDesc}
              onChange={(e) => setSuDesc(e.target.value)}
            />
            <input
              type="datetime-local"
              className="w-full rounded border px-2 py-1.5"
              value={suWhen}
              onChange={(e) => setSuWhen(e.target.value)}
            />
            <button
              type="button"
              disabled={busy}
              onClick={submitSchedule}
              className="rounded bg-slate-800 px-3 py-1.5 text-white"
            >
              Save
            </button>
          </div>
        </div>

        <div className="rounded-xl bg-white p-5 shadow">
          <h2 className="font-semibold">Add notice</h2>
          <div className="mt-3 space-y-3 text-sm">
            <select
              className="w-full rounded border px-2 py-1.5"
              value={nKind}
              onChange={(e) => setNKind(e.target.value)}
            >
              <option value="info">Info</option>
              <option value="warning">Warning</option>
            </select>
            <input
              className="w-full rounded border px-2 py-1.5"
              placeholder="Title"
              value={nTitle}
              onChange={(e) => setNTitle(e.target.value)}
            />
            <textarea
              className="w-full rounded border px-2 py-1.5"
              rows={3}
              placeholder="Description"
              value={nDesc}
              onChange={(e) => setNDesc(e.target.value)}
            />
            <button
              type="button"
              disabled={busy}
              onClick={submitNotice}
              className="rounded bg-sky-700 px-3 py-1.5 text-white"
            >
              Create notice
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl bg-white p-5 shadow">
        <h2 className="font-semibold">Notices</h2>
        <ul className="mt-3 divide-y text-sm">
          {notices.map((n) => (
            <li key={n.id} className="flex items-center justify-between py-2">
              <div>
                <div className="font-medium">{n.title}</div>
                <div className="text-xs text-gray-500">
                  {n.kind}
                  {n.hidden_at ? " · hidden" : ""}
                </div>
              </div>
              <button
                type="button"
                className="text-sky-700 hover:underline"
                onClick={() =>
                  updatePlatformNotice(n.id, !n.hidden_at).then(refresh)
                }
              >
                {n.hidden_at ? "Show" : "Hide"}
              </button>
            </li>
          ))}
        </ul>
        <h3 className="mt-6 font-medium text-gray-700">Recent updates</h3>
        <ul className="mt-2 space-y-1 text-xs text-gray-600">
          {history.slice(0, 8).map((r) => (
            <li key={r.id}>
              #{r.id} {r.title} ({r.phase})
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
