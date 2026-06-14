import React, { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import "./App.css";
import { DashboardLayout } from "./app/components/dashboard/dashboard-layout";
import PrivateRoute from "./app/routes/privateRoute";
import PublicOnlyRoute from "./app/routes/publicOnlyRoute";
import PersistLogin from "./app/components/authentication/persistLogin";
import { HomePage } from "./app/pages/HomePage";
import NotFound from "./app/pages/NotFound";
import Login from "./app/pages/authentication/Login";
import Logout from "./app/pages/authentication/Logout";
import CompaniesList from "./app/pages/dashboard/CompaniesList";
import CompanyDetail from "./app/pages/dashboard/CompanyDetail";
import OpsRoute from "./app/routes/opsRoute";
import OpsHome from "./app/pages/ops/OpsHome";
import OpsLogs from "./app/pages/ops/OpsLogs";
import OpsErrors from "./app/pages/ops/OpsErrors";
import OpsTv from "./app/pages/ops/OpsTv";
import OpsBroadcasts from "./app/pages/ops/OpsBroadcasts";
import OpsDocs from "./app/pages/ops/OpsDocs";
import OpsHealth from "./app/pages/ops/OpsHealth";
import OpsBugs from "./app/pages/ops/OpsBugs";
import OpsAgents from "./app/pages/ops/OpsAgents";
import OpsActivity from "./app/pages/ops/OpsActivity";
import OpsTelemetry from "./app/pages/ops/OpsTelemetry";
import OpsAiUsage from "./app/pages/ops/OpsAiUsage";
import OpsAiUsageByCompany from "./app/pages/ops/OpsAiUsageByCompany";
import OpsReports from "./app/pages/ops/OpsReports";
import OpsCommunity from "./app/pages/ops/OpsCommunity";
import HealthPage from "./app/pages/HealthPage";
import { Toaster } from "react-hot-toast";

function App() {
  useEffect(() => {
    document.body.classList.add("h-full", "bg-gray-100");
  });

  return (
    <>
      <Toaster position="top-right" />
      <Routes>
        <Route path="*" element={<NotFound />} />
        <Route element={<PersistLogin />}>
          <Route
            path="/dashboard/ops/tv"
            element={
              <PrivateRoute>
                <OpsRoute />
              </PrivateRoute>
            }
          >
            <Route index element={<OpsTv />} />
          </Route>

          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <DashboardLayout />
              </PrivateRoute>
            }
          >
            <Route path="/dashboard/companies" element={<CompaniesList />} />
            <Route path="/dashboard/companies/:id" element={<CompanyDetail />} />
            <Route path="/dashboard/ops" element={<OpsRoute />}>
              <Route index element={<OpsHome />} />
              <Route path="logs" element={<OpsLogs />} />
              <Route path="errors" element={<OpsErrors />} />
              <Route path="bugs" element={<OpsBugs />} />
              <Route path="agents" element={<OpsAgents />} />
              <Route path="activity" element={<OpsActivity />} />
              <Route path="health" element={<OpsHealth />} />
              <Route path="telemetry" element={<OpsTelemetry />} />
              <Route path="ai-usage" element={<OpsAiUsage />} />
              <Route path="ai-usage/companies" element={<OpsAiUsageByCompany />} />
              <Route path="reports" element={<OpsReports />} />
              <Route path="community" element={<OpsCommunity />} />
              <Route path="broadcasts" element={<OpsBroadcasts />} />
              <Route path="docs" element={<OpsDocs />} />
            </Route>
          </Route>

          <Route path="/" element={<HomePage />} />
          <Route path="/health" element={<HealthPage />} />
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            }
          />
          <Route path="/logout" element={<Logout />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
