export const GROUP_LABELS = {
  promang_integration: "Promang integration apps",
  company_grant: "Company integration grants",
  promang_own: "Promang own apps",
  company_webshop: "Company webshops",
  other: "Other",
};

export const CATEGORY_BADGES = {
  promang_integration: "bg-violet-100 text-violet-800",
  company_grant: "bg-amber-100 text-amber-800",
  promang_own: "bg-sky-100 text-sky-800",
  company_webshop: "bg-emerald-100 text-emerald-800",
  other: "bg-gray-100 text-gray-800",
};

export function formatScopes(scopes) {
  if (!scopes || typeof scopes !== "string") return "—";
  const parts = scopes.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "—";
  return parts.join(", ");
}

export const AUDIT_ACTION_LABELS = {
  update: "Updated",
  roll_keys: "Rolled keys",
  delete: "Deleted",
};

export function formatAuditChange(field, change) {
  if (!change || typeof change !== "object") return null;
  if (change.redacted) return `${field}: [redacted]`;

  const from = change.from ?? "—";
  const to = change.to ?? "—";
  if (field === "scopes") {
    return `${field}: ${formatScopes(from)} → ${formatScopes(to)}`;
  }
  if (field === "confidential") {
    return `${field}: ${from ? "Yes" : "No"} → ${to ? "Yes" : "No"}`;
  }
  return `${field}: ${from} → ${to}`;
}

export function formatAuditEntry(entry) {
  const actor = entry.user?.name || entry.user?.email || `User #${entry.user?.id || "?"}`;
  const lines = Object.entries(entry.changes || {})
    .map(([field, change]) => formatAuditChange(field, change))
    .filter(Boolean);

  return {
    actor,
    action: AUDIT_ACTION_LABELS[entry.action] || entry.action,
    summary: entry.summary,
    lines,
    createdAt: entry.created_at,
  };
}

export function ownerLabel(owner) {
  if (!owner) return "Platform (no owner)";
  if (owner.type === "Company") return owner.name || `Company #${owner.id}`;
  if (owner.type === "User") {
    const company = owner.company_name ? ` · ${owner.company_name}` : "";
    return `${owner.name || owner.email || `User #${owner.id}`}${company}`;
  }
  return `${owner.type || "Owner"} #${owner.id}`;
}
