import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { fetchOpsSession } from "../api/ops";

export default function OpsRoute() {
  const [state, setState] = useState({ loading: true, allowed: false });

  useEffect(() => {
    let active = true;
    fetchOpsSession()
      .then((res) => {
        if (!active) return;
        setState({ loading: false, allowed: Boolean(res?.success) });
      })
      .catch(() => {
        if (!active) return;
        setState({ loading: false, allowed: false });
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
    return <Navigate to="/dashboard/companies" replace />;
  }

  return <Outlet />;
}
