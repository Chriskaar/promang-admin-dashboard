import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getClientApps } from "../../api/clientApps";
import { Squares2X2Icon, ArrowLeftIcon } from "@heroicons/react/24/outline";
import toast from "react-hot-toast";
import {
  CATEGORY_BADGES,
  GROUP_LABELS,
  formatScopes,
  ownerLabel,
} from "./clientAppUtils";

function ClientAppRow({ app }) {
  const navigate = useNavigate();

  return (
    <li>
      <button
        type="button"
        onClick={() => navigate(`/dashboard/applications/client-apps/${app.id}`)}
        className="block w-full px-4 py-4 text-left hover:bg-gray-50 sm:px-6"
      >
        <div className={`flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between ${app.deleted ? "opacity-70" : ""}`}>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-indigo-600 truncate">{app.name}</p>
            <span
              className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                CATEGORY_BADGES[app.category] || CATEGORY_BADGES.other
              }`}
            >
              {GROUP_LABELS[app.category] || app.category}
            </span>
            {app.deleted ? (
              <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                Deleted
              </span>
            ) : null}
          </div>
          <p className="mt-1 truncate font-mono text-xs text-gray-500">{app.uid}</p>
            <p className="mt-2 text-sm text-gray-600">{ownerLabel(app.owner)}</p>
            {app.redirect_uri ? (
              <p className="mt-1 truncate text-xs text-gray-500">{app.redirect_uri}</p>
            ) : null}
          </div>
          <div className="shrink-0 text-right text-xs text-gray-500">
            <div>Scopes: {formatScopes(app.scopes)}</div>
            <div className="mt-1">{app.grants_count} active grants</div>
            <div>{app.active_tokens_count} active tokens</div>
            <div className="mt-1 capitalize">{app.confidential ? "Confidential" : "Public"}</div>
          </div>
        </div>
      </button>
    </li>
  );
}

function ClientAppsList() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClientApps();
  }, []);

  const loadClientApps = async () => {
    setLoading(true);
    const response = await getClientApps();
    if (response.error) {
      toast.error(response.error.message || "Failed to load client apps");
      setGroups([]);
    } else {
      setGroups(response.data?.groups || []);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading client apps...</div>
      </div>
    );
  }

  const totalApps = groups.reduce((sum, group) => sum + (group.apps?.length || 0), 0);

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          to="/dashboard/applications"
          className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Applications (integrations)
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Client apps</h1>
        <p className="mt-1 text-sm text-gray-500">
          OAuth clients sorted by Promang integrations, company grants, first-party apps, and webshops
        </p>
      </div>

      {totalApps === 0 ? (
        <div className="text-center py-12">
          <Squares2X2Icon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No client apps</h3>
          <p className="mt-1 text-sm text-gray-500">No OAuth applications found in the system.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.key}>
              <div className="mb-3">
                <h2 className="text-lg font-semibold text-gray-900">
                  {GROUP_LABELS[group.key] || group.key}
                </h2>
                <p className="text-sm text-gray-500">
                  {group.apps.length} app{group.apps.length === 1 ? "" : "s"}
                </p>
              </div>
              <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                  {group.apps.map((app) => (
                    <ClientAppRow key={app.id} app={app} />
                  ))}
                </ul>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

export default ClientAppsList;
