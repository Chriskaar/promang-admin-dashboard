import { useEffect, useState } from "react";
import { Link, Outlet } from "react-router-dom";
import toast from "react-hot-toast";
import { fetchOpsSession } from "../api/ops";

export default function OpsRoute() {
  const [state, setState] = useState({ loading: true, allowed: false, message: null });

  useEffect(() => {
    let active = true;
    fetchOpsSession()
      .then((res) => {
        if (!active) return;
        const allowed = Boolean(res?.success);
        const message = allowed ? null : res.message || "You do not have platform ops access.";
        if (!allowed) {
          toast.error(message);
        }
        setState({ loading: false, allowed, message, status: res.status });
      })
      .catch(() => {
        if (!active) return;
        const message = "Could not reach the Promang API. Is promang-api running on port 4000?";
        toast.error(message);
        setState({ loading: false, allowed: false, message });
      });
    return () => {
      active = false;
    };
  }, []);

  if (state.loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-gray-500">
        Checking platform ops access…
      </div>
    );
  }

  if (!state.allowed) {
    const showOpsEmailHint = state.status === 403;
    return (
      <div className="mx-auto max-w-lg p-6">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-950">
          <h2 className="text-lg font-semibold">Ops Center unavailable</h2>
          <p className="mt-2 text-sm">{state.message}</p>
          {showOpsEmailHint ? (
            <p className="mt-3 text-sm text-amber-900/80">
              Access requires your login email to match{" "}
              <code className="rounded bg-white/70 px-1">PLATFORM_OPS_EMAIL</code> or{" "}
              <code className="rounded bg-white/70 px-1">PLATFORM_SUPER_ADMIN_EMAILS</code> in
              promang-api, then restart the API server.
            </p>
          ) : null}
          <Link
            to="/dashboard/companies"
            className="mt-4 inline-block text-sm font-medium text-indigo-700 hover:text-indigo-900"
          >
            Back to Companies
          </Link>
        </div>
      </div>
    );
  }

  return <Outlet />;
}
