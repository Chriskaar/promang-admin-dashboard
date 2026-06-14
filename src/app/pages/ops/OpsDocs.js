import { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { fetchDocsContent, fetchDocsTree } from "../../api/ops";
import DocsTreePanel from "../../components/ops/DocsTreePanel";
import DocsMarkdownViewer from "../../components/ops/DocsMarkdownViewer";

export default function OpsDocs() {
  const [sources, setSources] = useState([]);
  const [fileCount, setFileCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [doc, setDoc] = useState(null);
  const [loadingTree, setLoadingTree] = useState(true);
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [docError, setDocError] = useState(null);

  const loadTree = useCallback(async () => {
    setLoadingTree(true);
    try {
      const res = await fetchDocsTree();
      if (res?.success) {
        setSources(res.data?.sources || []);
        setFileCount(res.data?.file_count || 0);
      } else {
        toast.error(res?.message || "Could not load documentation tree");
      }
    } catch {
      toast.error("Could not load documentation tree");
    } finally {
      setLoadingTree(false);
    }
  }, []);

  useEffect(() => {
    loadTree();
  }, [loadTree]);

  const onSelectFile = useCallback(async ({ sourceId, relativePath, name }) => {
    setSelected({ sourceId, relativePath, name });
    setLoadingDoc(true);
    setDocError(null);
    try {
      const res = await fetchDocsContent(sourceId, relativePath);
      if (res?.success) {
        setDoc(res.data);
      } else {
        setDoc(null);
        setDocError(res?.message || "Could not load file");
      }
    } catch {
      setDoc(null);
      setDocError("Could not load file");
    } finally {
      setLoadingDoc(false);
    }
  }, []);

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-[1600px] flex-col px-4 py-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documentation Library</h1>
          <p className="text-sm text-gray-600">
            Full trestruktur over markdown og skills ({fileCount} filer fra API)
          </p>
        </div>
        <input
          type="search"
          placeholder="Søk i treet…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full max-w-xs rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      <div className="flex min-h-0 flex-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="w-80 shrink-0 overflow-hidden">
          {loadingTree ? (
            <div className="flex h-full items-center justify-center text-sm text-gray-500">
              Loading tree…
            </div>
          ) : (
            <DocsTreePanel
              sources={sources}
              selected={selected}
              onSelect={onSelectFile}
              searchQuery={searchQuery.trim()}
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <DocsMarkdownViewer doc={doc} loading={loadingDoc} error={docError} />
        </div>
      </div>
    </div>
  );
}
