import axios from "./axios";

export async function fetchPlatformBroadcastState() {
  const res = await axios.get("/platform_broadcasts/state");
  if (!res.data?.success) return null;
  return res.data.data;
}

export async function createScheduledUpdate(body) {
  const res = await axios.post("/platform_ops/scheduled_updates", {
    scheduled_update: body,
  });
  return res.data;
}

export async function fetchScheduledUpdatesHistory() {
  const res = await axios.get("/platform_ops/scheduled_updates");
  return res.data;
}

export async function startMaintenance(id, expected_end_at) {
  const res = await axios.post(
    `/platform_ops/scheduled_updates/${id}/start_maintenance`,
    { expected_end_at }
  );
  return res.data;
}

export async function confirmUpdateComplete(id) {
  const res = await axios.post(
    `/platform_ops/scheduled_updates/${id}/confirm_complete`
  );
  return res.data;
}

export async function createPlatformNotice(body) {
  const res = await axios.post("/platform_ops/notices", { notice: body });
  return res.data;
}

export async function fetchPlatformNoticesAdmin() {
  const res = await axios.get("/platform_ops/notices");
  return res.data;
}

export async function updatePlatformNotice(id, hidden) {
  const res = await axios.patch(`/platform_ops/notices/${id}`, {
    notice: { hidden },
  });
  return res.data;
}
