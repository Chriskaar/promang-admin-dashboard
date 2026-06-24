import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Link, useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import {
  deleteClientApp,
  getClientApp,
  rollClientAppKeys,
  updateClientApp,
} from "../../api/clientApps";
import {
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  KeyIcon,
} from "@heroicons/react/24/outline";
import {
  CATEGORY_BADGES,
  GROUP_LABELS,
  formatAuditEntry,
  formatScopes,
  ownerLabel,
} from "./clientAppUtils";

const EMPTY_FORM = {
  name: "",
  redirect_uri: "",
  scopes: "",
  confidential: true,
};

function buildChangeSummary(original, next) {
  const changes = [];
  if (original.name !== next.name) changes.push(`Name: "${original.name}" → "${next.name}"`);
  if (original.redirect_uri !== next.redirect_uri) {
    changes.push(`Redirect URI: "${original.redirect_uri || "—"}" → "${next.redirect_uri || "—"}"`);
  }
  if (original.scopes !== next.scopes) {
    changes.push(`Scopes: "${formatScopes(original.scopes)}" → "${formatScopes(next.scopes)}"`);
  }
  if (Boolean(original.confidential) !== Boolean(next.confidential)) {
    changes.push(`Confidential: ${original.confidential ? "Yes" : "No"} → ${next.confidential ? "Yes" : "No"}`);
  }
  return changes;
}

export default function ClientAppDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
  const [rollConfirmOpen, setRollConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [rollUid, setRollUid] = useState(true);
  const [rollSecret, setRollSecret] = useState(true);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [rolledCredentials, setRolledCredentials] = useState(null);

  const loadApp = useCallback(async () => {
    setLoading(true);
    const response = await getClientApp(id);
    if (response.error) {
      toast.error(response.error.message || "Failed to load client app");
      navigate("/dashboard/applications/client-apps");
      return;
    }
    setApp(response.data);
    setForm({
      name: response.data.name || "",
      redirect_uri: response.data.redirect_uri || "",
      scopes: response.data.scopes || "",
      confidential: Boolean(response.data.confidential),
    });
    setLoading(false);
  }, [id, navigate]);

  useEffect(() => {
    loadApp();
  }, [loadApp]);

  const pendingChanges = useMemo(() => {
    if (!app) return [];
    return buildChangeSummary(app, form);
  }, [app, form]);

  const hasChanges = pendingChanges.length > 0;

  const onFieldChange = (field) => (event) => {
    const value = field === "confidential" ? event.target.checked : event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const onSave = async () => {
    setSaving(true);
    const response = await updateClientApp(id, form);
    if (response.error) {
      toast.error(response.error.message || "Failed to update client app");
    } else {
      toast.success("Client app updated");
      setSaveConfirmOpen(false);
      await loadApp();
    }
    setSaving(false);
  };

  const onRollKeys = async () => {
    setRolling(true);
    const response = await rollClientAppKeys(id, { rollUid, rollSecret });
    if (response.error) {
      toast.error(response.error.message || "Failed to roll keys");
    } else {
      toast.success("Client keys rolled. Active tokens and grants were revoked.");
      setRolledCredentials({
        uid: response.data.rolled_uid || null,
        secret: response.data.rolled_secret || null,
      });
      setRollConfirmOpen(false);
      await loadApp();
    }
    setRolling(false);
  };

  const onDelete = async () => {
    setDeleting(true);
    const response = await deleteClientApp(id, deleteConfirmName);
    if (response.error) {
      toast.error(response.error.message || "Failed to delete client app");
    } else {
      toast.success("Application marked as deleted");
      setDeleteConfirmOpen(false);
      setDeleteConfirmName("");
      await loadApp();
    }
    setDeleting(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-500">Loading client app...</div>
      </div>
    );
  }

  if (!app) return null;

  const isDeleted = Boolean(app.deleted);
  const deleteNameMatches = deleteConfirmName === app.name;
  const auditEntries = (app.audit_logs || []).map(formatAuditEntry);

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link
          to="/dashboard/applications/client-apps"
          className="mb-3 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Client apps
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold text-gray-900">{app.name}</h1>
          <span
            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
              CATEGORY_BADGES[app.category] || CATEGORY_BADGES.other
            }`}
          >
            {GROUP_LABELS[app.category] || app.category}
          </span>
          {isDeleted ? (
            <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
              Deleted
            </span>
          ) : null}
        </div>
        <p className="mt-1 font-mono text-sm text-gray-500">{app.uid}</p>
        {isDeleted ? (
          <p className="mt-2 text-sm text-red-700">
            This application is deleted and no longer accepts OAuth requests.
            {app.deleted_by?.name || app.deleted_by?.email
              ? ` Removed by ${app.deleted_by.name || app.deleted_by.email}.`
              : ""}
          </p>
        ) : null}
      </div>

      {isDeleted ? (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Editing, rolling keys, and deleting again are disabled for deleted applications. Audit history is kept below.
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className={`rounded-lg bg-white p-6 shadow ${isDeleted ? "opacity-60" : ""}`}>
            <h2 className="text-lg font-semibold text-gray-900">Application details</h2>
            <p className="mt-1 text-sm text-gray-500">
              {isDeleted
                ? "Deleted applications are read-only."
                : "Edit name, redirect URI, scopes, and confidentiality."}
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={form.name}
                  onChange={onFieldChange("name")}
                  disabled={isDeleted}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 disabled:bg-gray-100 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="redirect_uri" className="block text-sm font-medium text-gray-700">
                  Redirect URI
                </label>
                <input
                  id="redirect_uri"
                  type="text"
                  value={form.redirect_uri}
                  onChange={onFieldChange("redirect_uri")}
                  disabled={isDeleted}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 disabled:bg-gray-100 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="scopes" className="block text-sm font-medium text-gray-700">
                  Scopes
                </label>
                <input
                  id="scopes"
                  type="text"
                  value={form.scopes}
                  onChange={onFieldChange("scopes")}
                  disabled={isDeleted}
                  placeholder="read write public"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 disabled:bg-gray-100 sm:text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">Space-separated scopes. Displayed as: {formatScopes(form.scopes)}</p>
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={form.confidential}
                  onChange={onFieldChange("confidential")}
                  disabled={isDeleted}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:bg-gray-100"
                />
                Confidential client
              </label>
            </div>

            {!isDeleted ? (
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  disabled={!hasChanges || saving}
                  onClick={() => setSaveConfirmOpen(true)}
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Save changes
                </button>
              </div>
            ) : null}
          </section>

          {!isDeleted ? (
          <section className="rounded-lg border border-amber-200 bg-amber-50 p-6">
            <div className="flex items-start gap-3">
              <KeyIcon className="mt-0.5 h-5 w-5 text-amber-700" />
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-amber-900">Roll client keys</h2>
                <p className="mt-1 text-sm text-amber-800">
                  Generate a new client ID and/or secret. All active tokens and authorization grants for this app will be revoked.
                </p>

                <div className="mt-4 flex flex-wrap gap-4 text-sm text-amber-900">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={rollUid}
                      onChange={(event) => setRollUid(event.target.checked)}
                      className="rounded border-amber-300 text-amber-700 focus:ring-amber-500"
                    />
                    Roll client ID (uid)
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={rollSecret}
                      onChange={(event) => setRollSecret(event.target.checked)}
                      className="rounded border-amber-300 text-amber-700 focus:ring-amber-500"
                    />
                    Roll client secret
                  </label>
                </div>

                {rolledCredentials ? (
                  <div className="mt-4 rounded-md border border-amber-300 bg-white p-4 text-sm">
                    <p className="font-medium text-gray-900">New credentials (shown once)</p>
                    {rolledCredentials.uid ? (
                      <p className="mt-2 break-all font-mono text-xs text-gray-700">
                        Client ID: {rolledCredentials.uid}
                      </p>
                    ) : null}
                    {rolledCredentials.secret ? (
                      <p className="mt-2 break-all font-mono text-xs text-gray-700">
                        Client secret: {rolledCredentials.secret}
                      </p>
                    ) : null}
                    <p className="mt-2 text-xs text-gray-500">Copy these values now. The secret cannot be retrieved again.</p>
                  </div>
                ) : null}

                <div className="mt-4">
                  <button
                    type="button"
                    disabled={(!rollUid && !rollSecret) || rolling}
                    onClick={() => setRollConfirmOpen(true)}
                    className="rounded-md border border-amber-700 bg-white px-4 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Roll keys
                  </button>
                </div>
              </div>
            </div>
          </section>
          ) : null}

          {!isDeleted ? (
          <section className="rounded-lg border border-red-200 bg-red-50 p-6">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 text-red-700" />
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-red-900">Delete application</h2>
                <p className="mt-1 text-sm text-red-800">
                  Marks the application as deleted and revokes all active tokens. The record and audit history are kept. Type the full application name to confirm.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setDeleteConfirmName("");
                    setDeleteConfirmOpen(true);
                  }}
                  className="mt-4 rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800"
                >
                  Delete application
                </button>
              </div>
            </div>
          </section>
          ) : null}

          <section className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-lg font-semibold text-gray-900">Audit history</h2>
            <p className="mt-1 text-sm text-gray-500">
              Who changed, rolled keys, or deleted this application.
            </p>
            {auditEntries.length === 0 ? (
              <p className="mt-4 text-sm text-gray-500">No audit events recorded yet.</p>
            ) : (
              <ul className="mt-4 divide-y divide-gray-100">
                {auditEntries.map((entry, index) => (
                  <li key={`${entry.createdAt}-${index}`} className="py-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {entry.action}
                          <span className="font-normal text-gray-500"> · {entry.actor}</span>
                        </p>
                        {entry.summary ? (
                          <p className="mt-1 text-sm text-gray-600">{entry.summary}</p>
                        ) : null}
                        {entry.lines.length > 0 ? (
                          <ul className="mt-2 space-y-1 text-xs text-gray-600">
                            {entry.lines.map((line) => (
                              <li key={line}>{line}</li>
                            ))}
                          </ul>
                        ) : null}
                      </div>
                      <time className="shrink-0 text-xs text-gray-500">
                        {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : "—"}
                      </time>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg bg-white p-6 shadow">
            <h2 className="text-sm font-semibold text-gray-900">Overview</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="text-gray-500">Status</dt>
                <dd className={isDeleted ? "font-medium text-red-700" : "text-emerald-700"}>
                  {isDeleted ? "Deleted" : "Active"}
                </dd>
              </div>
              {isDeleted && app.deleted_at ? (
                <div>
                  <dt className="text-gray-500">Deleted at</dt>
                  <dd className="text-gray-900">{new Date(app.deleted_at).toLocaleString()}</dd>
                </div>
              ) : null}
              {isDeleted && app.deleted_by ? (
                <div>
                  <dt className="text-gray-500">Deleted by</dt>
                  <dd className="text-gray-900">
                    {app.deleted_by.name || app.deleted_by.email || `#${app.deleted_by.id}`}
                  </dd>
                </div>
              ) : null}
              <div>
                <dt className="text-gray-500">Owner</dt>
                <dd className="text-gray-900">{ownerLabel(app.owner)}</dd>
              </div>
              {app.company_id ? (
                <div>
                  <dt className="text-gray-500">Company ID</dt>
                  <dd className="text-gray-900">{app.company_id}</dd>
                </div>
              ) : null}
              <div>
                <dt className="text-gray-500">Scopes</dt>
                <dd className="text-gray-900">{formatScopes(app.scopes)}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Active grants</dt>
                <dd className="text-gray-900">{app.grants_count}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Active tokens</dt>
                <dd className="text-gray-900">{app.active_tokens_count}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Confidential</dt>
                <dd className="text-gray-900">{app.confidential ? "Yes" : "No"}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>

      <ConfirmDialog
        open={saveConfirmOpen}
        title="Confirm changes"
        description="Review the changes before saving."
        confirmLabel={saving ? "Saving…" : "Save changes"}
        confirmDisabled={saving}
        onClose={() => setSaveConfirmOpen(false)}
        onConfirm={onSave}
      >
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-700">
          {pendingChanges.map((change) => (
            <li key={change}>{change}</li>
          ))}
        </ul>
      </ConfirmDialog>

      <ConfirmDialog
        open={rollConfirmOpen}
        title="Roll client keys?"
        description="This will revoke all active tokens and authorization grants for this application."
        confirmLabel={rolling ? "Rolling…" : "Roll keys"}
        confirmDisabled={rolling || (!rollUid && !rollSecret)}
        onClose={() => setRollConfirmOpen(false)}
        onConfirm={onRollKeys}
      >
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-700">
          {rollUid ? <li>Generate a new client ID (uid)</li> : null}
          {rollSecret ? <li>Generate a new client secret</li> : null}
          <li>Revoke all active tokens and grants</li>
        </ul>
      </ConfirmDialog>

      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete application"
        description={`Type "${app.name}" exactly to mark this OAuth application as deleted.`}
        confirmLabel={deleting ? "Deleting…" : "Delete application"}
        confirmDisabled={deleting || !deleteNameMatches}
        confirmDanger
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={onDelete}
      >
        <input
          type="text"
          value={deleteConfirmName}
          onChange={(event) => setDeleteConfirmName(event.target.value)}
          placeholder={app.name}
          className="mt-3 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-red-500 focus:outline-none focus:ring-red-500 sm:text-sm"
        />
      </ConfirmDialog>
    </div>
  );
}

function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  confirmDisabled,
  confirmDanger = false,
  onClose,
  onConfirm,
  children,
}) {
  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75" />
        </Transition.Child>

        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <Dialog.Title className="text-lg font-semibold text-gray-900">{title}</Dialog.Title>
                <p className="mt-2 text-sm text-gray-600">{description}</p>
                {children}
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={confirmDisabled}
                    onClick={onConfirm}
                    className={`rounded-md px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 ${
                      confirmDanger
                        ? "bg-red-700 hover:bg-red-800"
                        : "bg-indigo-600 hover:bg-indigo-700"
                    }`}
                  >
                    {confirmLabel}
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
