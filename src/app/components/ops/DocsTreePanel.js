import { useMemo, useState } from "react";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  FolderIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

function nodeMatchesSearch(node, query) {
  if (!query) return true;
  const q = query.toLowerCase();
  if (node.name.toLowerCase().includes(q)) return true;
  if (node.children?.some((child) => nodeMatchesSearch(child, query))) return true;
  return false;
}

function DocsTreeNode({ node, sourceId, depth, selected, onSelect, searchQuery }) {
  const [open, setOpen] = useState(depth < 2);

  if (node.type === "dir") {
    if (!nodeMatchesSearch(node, searchQuery)) return null;

    const hasSelectedChild =
      selected?.sourceId === sourceId &&
      selected?.relativePath?.startsWith(`${node.relative_path}/`);

    return (
      <div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={`flex w-full items-center gap-1 rounded px-2 py-1 text-left text-sm hover:bg-gray-100 ${
            hasSelectedChild ? "text-blue-600" : "text-gray-700"
          }`}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
        >
          {open ? (
            <ChevronDownIcon className="h-4 w-4 shrink-0" />
          ) : (
            <ChevronRightIcon className="h-4 w-4 shrink-0" />
          )}
          <FolderIcon className="h-4 w-4 shrink-0 text-amber-500" />
          <span className="truncate">{node.name}</span>
        </button>
        {open &&
          node.children?.map((child) => (
            <DocsTreeNode
              key={`${sourceId}:${child.relative_path}`}
              node={child}
              sourceId={sourceId}
              depth={depth + 1}
              selected={selected}
              onSelect={onSelect}
              searchQuery={searchQuery}
            />
          ))}
      </div>
    );
  }

  if (!nodeMatchesSearch(node, searchQuery)) return null;

  const isSelected =
    selected?.sourceId === sourceId && selected?.relativePath === node.relative_path;

  return (
    <button
      type="button"
      onClick={() => onSelect({ sourceId, relativePath: node.relative_path, name: node.name })}
      className={`flex w-full items-center gap-1 rounded px-2 py-1 text-left text-sm hover:bg-gray-100 ${
        isSelected ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-600"
      }`}
      style={{ paddingLeft: `${depth * 12 + 28}px` }}
    >
      {node.skill ? (
        <SparklesIcon className="h-4 w-4 shrink-0 text-purple-500" />
      ) : (
        <DocumentTextIcon className="h-4 w-4 shrink-0 text-gray-400" />
      )}
      <span className="truncate">{node.name}</span>
    </button>
  );
}

export default function DocsTreePanel({ sources, selected, onSelect, searchQuery }) {
  const [expandedSources, setExpandedSources] = useState(() =>
    Object.fromEntries((sources || []).map((s) => [s.id, true]))
  );

  const totalFiles = useMemo(() => {
    const countFiles = (nodes) =>
      (nodes || []).reduce(
        (sum, n) => sum + (n.type === "file" ? 1 : 0) + countFiles(n.children),
        0
      );
    return (sources || []).reduce((sum, s) => sum + countFiles(s.children), 0);
  }, [sources]);

  return (
    <div className="flex h-full flex-col border-r border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-900">Documentation</h2>
        <p className="text-xs text-gray-500">{totalFiles} markdown files</p>
      </div>
      <div className="flex-1 overflow-y-auto py-2">
        {(sources || []).map((source) => (
          <div key={source.id} className="mb-2">
            <button
              type="button"
              onClick={() =>
                setExpandedSources((prev) => ({ ...prev, [source.id]: !prev[source.id] }))
              }
              className="flex w-full items-center gap-1 px-3 py-1.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 hover:bg-gray-50"
            >
              {expandedSources[source.id] ? (
                <ChevronDownIcon className="h-3 w-3" />
              ) : (
                <ChevronRightIcon className="h-3 w-3" />
              )}
              {source.label}
            </button>
            {expandedSources[source.id] &&
              source.children?.map((node) => (
                <DocsTreeNode
                  key={`${source.id}:${node.relative_path}`}
                  node={node}
                  sourceId={source.id}
                  depth={0}
                  selected={selected}
                  onSelect={onSelect}
                  searchQuery={searchQuery}
                />
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}
