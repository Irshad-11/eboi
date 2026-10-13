"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { IMPORT } from "@/config/limits";
import { IconUpload } from "@/components/icons";
import { isValidImageUrl } from "@/lib/media";
import { prepareImport, saveBook, discardUploads, type ImportPlan } from "../actions/books";
import { checkCover, checkPreview, makePreviewThumbs, uploadCover, uploadPreview } from "../uploads";
import { AdminCard } from "./admin-page-head";
import { DropZone, LinkFetcher, SourceTabs } from "./drop-zone";
import { JsonBuilder } from "./json-builder";
import { Notice } from "./notice";

type Log = { tone: "ok" | "error" | "info"; text: string };

/**
 * One flow for "config JSON + cover + preview". The JSON is checked by the
 * server first (create or update?), then files upload into that book's
 * folder, then the same saveBook() as the form runs. An array JSON imports
 * metadata for many books at once (no files).
 */
export function ImportPanel({ collections = [], categories = [] }: { collections?: { slug: string; name: string }[]; categories?: string[] }) {
  const router = useRouter();
  const [json, setJson] = useState<unknown>(null);
  const [jsonName, setJsonName] = useState("");
  const [cover, setCover] = useState<File | null>(null);
  const [preview, setPreview] = useState<File | null>(null);
  const [plan, setPlan] = useState<ImportPlan | null>(null);
  const [hints, setHints] = useState<{ cover?: string; preview?: string }>({});
  const [log, setLog] = useState<Log[]>([]);
  const [busy, setBusy] = useState(false);
  const [pasted, setPasted] = useState("");
  const [coverMode, setCoverMode] = useState<"file" | "link">("file");
  const [coverLink, setCoverLink] = useState("");
  const [previewMode, setPreviewMode] = useState<"file" | "link">("file");

  const add = (l: Log) => setLog((prev) => [...prev, l]);

  async function onJson(file: File | undefined) {
    if (!file) return;
    if (file.size > IMPORT.maxJsonBytes) return add({ tone: "error", text: "That JSON file is too large." });
    await loadJson(await file.text(), file.name);
  }

  /** From a file, pasted text or the builder below: check it and show what will happen. */
  async function loadJson(raw: string | unknown, name: string) {
    setPlan(null);
    setLog([]);
    setJson(null);
    try {
      const data = typeof raw === "string" ? JSON.parse(raw) : raw;
      setJson(data);
      setJsonName(name);
      if (!Array.isArray(data)) {
        setHints({ cover: data?.files?.cover, preview: data?.files?.preview });
        // A cover given as a full link in the JSON is used as the link.
        if (typeof data?.files?.cover === "string" && isValidImageUrl(data.files.cover)) {
          setCoverMode("link");
          setCoverLink(data.files.cover);
        }
        const res = await prepareImport(data);
        if (!res.ok) {
          add({ tone: "error", text: res.error });
          for (const [k, v] of Object.entries(res.fieldErrors ?? {})) add({ tone: "error", text: `${k}: ${v}` });
          return;
        }
        setPlan(res.data);
      } else {
        add({ tone: "info", text: `${data.length} books in this file. Files cannot be attached in a bulk import; covers and previews are kept for books that already have them.` });
      }
    } catch {
      add({ tone: "error", text: "That is not valid JSON. Check for a missing comma or quote." });
    }
  }

  async function importOne(data: unknown, files: { cover: File | null; preview: File | null; coverLink?: string }): Promise<boolean> {
    const prep = await prepareImport(data);
    if (!prep.ok) {
      add({ tone: "error", text: `${(data as { slug?: string })?.slug ?? "?"}: ${prep.error} ${Object.entries(prep.fieldErrors ?? {}).map(([k, v]) => `${k}: ${v}`).join("; ")}` });
      return false;
    }
    const p = prep.data;
    const uploaded: { cover?: string; preview?: string; thumbs?: string[] } = {};
    try {
      if (files.cover) {
        const c = await checkCover(files.cover);
        if (!c.ok) throw new Error(c.error);
        uploaded.cover = await uploadCover(p.id, files.cover);
      }
      if (files.preview) {
        const c = await checkPreview(files.preview);
        if (!c.ok) throw new Error(c.error);
        uploaded.preview = await uploadPreview(p.id, files.preview);
        uploaded.thumbs = await makePreviewThumbs(p.id, files.preview).catch(() => []);
      }
      const res = await saveBook({
        id: p.id,
        isNew: p.mode === "create",
        bookCode: p.bookCode,
        values: p.values,
        collectionIds: p.collectionIds,
        cover: uploaded.cover ? { path: uploaded.cover } : files.coverLink ? { path: files.coverLink } : null,
        preview: uploaded.preview ? { path: uploaded.preview } : null,
        thumbs: uploaded.thumbs ?? null,
        reviews: p.reviews ?? null,
      });
      if (!res.ok) throw new Error(`${res.error} ${Object.entries(res.fieldErrors ?? {}).map(([k, v]) => `${k}: ${v}`).join("; ")}`);
      add({ tone: "ok", text: `${p.mode === "create" ? "Created" : "Updated"} “${p.values.title}”.` });
      if (p.unknownCollections.length) add({ tone: "info", text: `Unknown collection slugs skipped: ${p.unknownCollections.join(", ")}` });
      return true;
    } catch (err) {
      await discardUploads(p.id, uploaded).catch(() => undefined);
      add({ tone: "error", text: `“${p.values.title}”: ${err instanceof Error ? err.message : "failed"}` });
      return false;
    }
  }

  async function run() {
    if (!json) return;
    setBusy(true);
    setLog([]);
    if (Array.isArray(json)) {
      let ok = 0;
      for (const item of json) if (await importOne(item, { cover: null, preview: null })) ok++;
      add({ tone: ok === json.length ? "ok" : "info", text: `${ok} of ${json.length} imported.` });
    } else {
      const link = coverMode === "link" && isValidImageUrl(coverLink.trim()) ? coverLink.trim() : undefined;
      await importOne(json, { cover: coverMode === "file" ? cover : null, preview, coverLink: link });
    }
    setBusy(false);
    router.refresh();
  }

  const mismatch = (hint: string | undefined, file: File | null) => hint && file && hint !== file.name;

  const bulk = Array.isArray(json);

  return (
    <div className="grid gap-4 lg:grid-cols-12">
      <AdminCard title="Import books" className="lg:col-span-7">
        <div className="space-y-5">
          <Step n={1} title="Book JSON" hint="One book (object) with files, or many books (array) without files. Make one with the form below.">
            <DropZone accept="application/json,.json" onFile={onJson} fileName={jsonName || null} label="Drag the .json file here" inputLabel="Book JSON file" />
            <details className="mt-2">
              <summary className="cursor-pointer text-sm font-medium text-brand">Paste JSON text instead</summary>
              <label htmlFor="imp-paste" className="sr-only">
                Book JSON text
              </label>
              <textarea id="imp-paste" rows={6} className="textarea mt-2 font-mono text-sm" placeholder='{ "title": "…", "slug": "…", "price": 200 }' value={pasted} onChange={(e) => setPasted(e.target.value)} />
              <button type="button" className="btn btn-secondary btn-sm mt-2" disabled={!pasted.trim()} onClick={() => loadJson(pasted, "Pasted JSON")}>
                Use pasted JSON
              </button>
            </details>
          </Step>
          <Step n={2} title="Cover (optional)" hint={hints.cover && !isValidImageUrl(hints.cover) ? `The JSON expects “${hints.cover}”.` : "Upload an image (2:3) or paste a link to one."}>
            <div className="space-y-2">
              <SourceTabs mode={coverMode} onMode={setCoverMode} label="Cover: upload or link" />
              {coverMode === "file" ? (
                <DropZone accept="image/jpeg,image/png,image/webp,image/gif" onFile={setCover} fileName={cover?.name} disabled={bulk} label="Drag the cover here" inputLabel="Cover image" />
              ) : (
                <div>
                  <label htmlFor="imp-cover-link" className="sr-only">
                    Cover image link
                  </label>
                  <input id="imp-cover-link" type="url" inputMode="url" className="input h-10 min-h-10 text-sm" placeholder="https://… (.jpg, .png, .webp or .gif)" value={coverLink} disabled={bulk} onChange={(e) => setCoverLink(e.target.value)} />
                  {coverLink.trim() && !isValidImageUrl(coverLink.trim()) && <p className="field-error">Paste a full https:// image link.</p>}
                </div>
              )}
            </div>
            {coverMode === "file" && mismatch(hints.cover, cover) && <p className="mt-1.5 text-sm text-warn">File name differs from the JSON. Check it is the right cover.</p>}
          </Step>
          <Step n={3} title="Preview PDF (optional)" hint={hints.preview ? `The JSON expects “${hints.preview}”.` : "The first pages only. Upload it or paste a link."}>
            <div className="space-y-2">
              <SourceTabs mode={previewMode} onMode={setPreviewMode} label="Preview PDF: upload or link" />
              {previewMode === "file" ? (
                <DropZone accept="application/pdf,.pdf" onFile={setPreview} fileName={preview?.name} disabled={bulk} label="Drag the preview PDF here" inputLabel="Preview PDF" />
              ) : (
                <LinkFetcher
                  id="imp-preview-link"
                  label="Preview PDF link"
                  placeholder="https://… link to a PDF"
                  kind="pdf"
                  buttonLabel="Get PDF"
                  onFile={(f) => {
                    setPreview(f);
                    setPreviewMode("file");
                  }}
                />
              )}
            </div>
            {mismatch(hints.preview, preview) && <p className="mt-1.5 text-sm text-warn">File name differs from the JSON. Check it is the right preview.</p>}
          </Step>

          {plan && (
            <div className="rounded-md border border-line bg-muted p-3">
              <p className="text-sm text-text-3">{jsonName}</p>
              <p className="mt-1 text-md font-semibold">{plan.values.title}</p>
              <p className="mt-1 text-sm text-text-2">
                Will <strong>{plan.mode === "create" ? "create a new book" : "update the existing book"}</strong>
                {plan.bookCode ? ` with Book ID ${plan.bookCode}` : ""}. Collections: {plan.collectionIds.length}
                {plan.unknownCollections.length ? ` (unknown: ${plan.unknownCollections.join(", ")})` : ""}.
              </p>
            </div>
          )}

          <button type="button" onClick={run} disabled={!json || busy || (!Array.isArray(json) && !plan)} data-loading={busy} className="btn btn-primary">
            <IconUpload size={18} />
            {Array.isArray(json) ? `Import ${json.length} books` : "Import this book"}
          </button>

          {log.length > 0 && (
            <div className="space-y-2" aria-live="polite">
              {log.map((l, i) => (
                <Notice key={i} tone={l.tone}>
                  {l.text}
                </Notice>
              ))}
            </div>
          )}
        </div>
      </AdminCard>

      <AdminCard title="Format and export" className="self-start lg:col-span-5">
        <p className="text-sm text-text-2">
          Books are matched by <code>book_code</code> first, then <code>slug</code>. A match is updated, otherwise a new book is created. Collections are listed by
          slug.
        </p>
        <ul className="mt-3 space-y-2 text-sm">
          <li>
            <a href="/sample-book.json" download className="link">
              Download the sample book JSON
            </a>
          </li>
          <li>
            <a href="/book-import.schema.json" target="_blank" className="link">
              JSON Schema
            </a>
          </li>
          <li>
            <a href="/api/admin/export" className="link">
              Export every book as JSON
            </a>
          </li>
          <li className="text-text-2">
            One book: use <strong>Export JSON</strong> on its{" "}
            <Link href="/admin/books" className="link">
              edit page
            </Link>
            .
          </li>
        </ul>
      </AdminCard>

      <div className="lg:col-span-12">
        <JsonBuilder
          collections={collections}
          categories={categories}
          onUse={(data, name) => {
            void loadJson(data, name);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        />
      </div>
    </div>
  );
}

function Step({ n, title, hint, children }: { n: number; title: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand-ink">{n}</span>
      <div className="min-w-0 flex-1">
        <p className="text-base font-semibold">{title}</p>
        <p className="mb-2 text-sm text-text-3">{hint}</p>
        {children}
      </div>
    </div>
  );
}
