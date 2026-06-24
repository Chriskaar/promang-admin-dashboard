import { Link } from "react-router-dom";
import { Squares2X2Icon } from "@heroicons/react/24/outline";

export default function ApplicationsHome() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Applications (integrations)</h1>
        <p className="mt-1 text-sm text-gray-500">
          OAuth client applications and integration grants across the Promang platform
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          to="/dashboard/applications/client-apps"
          className="rounded-xl bg-white p-5 shadow hover:ring-2 hover:ring-sky-200"
        >
          <div className="flex items-start gap-3">
            <Squares2X2Icon className="h-8 w-8 shrink-0 text-gray-400" />
            <div>
              <h2 className="font-semibold text-gray-900">Client apps</h2>
              <p className="mt-1 text-sm text-gray-500">
                Doorkeeper OAuth clients — Promang apps, integrations, company webshops, and grants
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
