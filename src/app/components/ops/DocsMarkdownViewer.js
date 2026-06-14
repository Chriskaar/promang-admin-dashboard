import { useEffect, useState } from "react";
import { marked } from "marked";

marked.setOptions({ breaks: true, gfm: true });

export default function DocsMarkdownViewer({ doc, loading, error }) {
  const [html, setHtml] = useState("");

  useEffect(() => {
    if (!doc?.content) {
      setHtml("");
      return;
    }
    setHtml(marked.parse(doc.content));
  }, [doc]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-gray-500">
        Loading…
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center text-gray-500">
        <p className="text-lg font-medium text-gray-700">Velg en fil i treet</p>
        <p className="mt-2 max-w-md text-sm">
          Bla gjennom Promang-dokumentasjon, Cursor skills og markdown-filer. Skills vises med
          lilla ikon (SKILL.md).
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-900">{doc.name}</h1>
        <p className="mt-1 text-xs text-gray-500">
          {doc.source_id} / {doc.relative_path}
          {doc.updated_at ? ` · ${new Date(doc.updated_at).toLocaleString()}` : ""}
        </p>
      </div>
      <article
        className="ops-docs-prose max-w-4xl px-6 py-8"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
