"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { IMPORT } from "@/config/limits";
import { IconUpload } from "@/components/icons";
import { prepareImport, saveBook, discardUploads, type ImportPlan } from "../actions/books";
import { checkCover, checkPreview, uploadCover, uploadPreview } from "../uploads";
import { Notice } from "./notice";

type Log = { tone: "ok" | "error" | "info"; text: string };

/**
 * One flow for "config JSON + cover + preview". The JSON is checked by the
 * server first (create or update?), then files upload into that book's
 * folder, then the same saveBook() as the form runs. An array JSON imports
 * metadata for many books at once (no files).
 */
export function ImportPanel() {
  const router = useRouter();
  const [json, setJson] = useState<unknown>(null);
  const [jsonName, setJsonName] = useState("");
  const [cover, setCover] = useState<File | null>(null);
  const [preview, setPreview] = useState<File | null>(null);
  const [plan, setPlan] = useState<ImportPlan | null>(null);
  const [hints, setHints] = useState<{ cover?: string; preview?: string }>({});
  const [log, setLog] = useState<Log[]>([]);
  const [busy, setBusy] = useState(false);

  const add = (l: Log) => setLog((prev) => [...prev, l]);

  async function onJson(file: File | undefined) {
    setPlan(null);
    setLog([]);
    setJson(null);
    if (!file) return;
    if (file.size > IMPORT.maxJsonBytes) return add({ tone: "error", text: "That JSON file is too large." });
    try {
      const data = JSON.parse(await file.text());
      setJson(data);
      setJsonName(file.name);
      if (!Array.isArray(data)) {
        setHints({ cover: data?.files?.cover, preview: data?.files?.preview });
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
      add({ tone: "error", text: "That file is not valid JSON." });
    }
  }

  async function importOne(data: unknown, files: { cover: File | null; preview: File | null }): Promise<boolean> {
    const prep = await prepareImport(data);
    if (!prep.ok) {
      add({ tone: "error", text: `${(data as { slug?: string })?.slug ?? "?"}: ${prep.error} ${Object.entries(prep.fieldErrors ?? {}).map(([k, v]) => `${k}: ${v}`).join("; ")}` });
      return false;
    }
    const p = prep.data;
    const uploaded: { cover?: string; preview?: string } = {};
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
      }
      const res = await saveBook({
        id: p.id,
        isNew: p.mode === "create",
        bookCode: p.bookCode,
        values: p.values,
        collectionIds: p.collectionIds,
        cover: uploaded.cover ? { path: uploaded.cover } : null,
        preview: uploaded.preview ? { path: uploaded.preview } : null,
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
      await importOne(json, { cover, preview });
    }
    setBusy(false);
    router.refresh();
  }

  const mismatch = (hint: string | undefined, file: File | null) => hint && file && hint !== file.name;

  return (
    <div className="grid gap-10 lg:grid-cols-12">
      <div className="space-y-6 lg:col-span-7">
        <Step n={1} title="Book JSON" hint="One book (object) with files, or many books (array) without files.">
          <input type="file" accept="application/json,.json" onChange={(e) => onJson(e.target.files?.[0])} className="block w-full text-small file:mr-3 file:min-h-11 file:border-2 file:border-ink file:bg-paper-raised file:px-3 file:font-semibold" />
        </Step>
        <Step n={2} title="Cover (optional)" hint={hints.cover ? `The JSON expects “${hints.cover}”.` : "JPG or PNG, 2:3."}>
          <input type="file" accept="image/jpeg,image/png" disabled={Array.isArray(json)} onChange={(e) => setCover(e.target.files?.[0] ?? null)} className="block w-full text-small file:mr-3 file:min-h-11 file:border-2 file:border-ink file:bg-paper-raised file:px-3 file:font-semibold" />
          {mismatch(hints.cover, cover) && <p className="field-hint text-ochre-ink">File name differs from the JSON. Check it is the right cover.</p>}
        </Step>
        <Step n={3} title="Preview PDF (optional)" hint={hints.preview ? `The JSON expects “${hints.preview}”.` : "The first pages only."}>
          <input type="file" accept="application/pdf,.pdf" disabled={Array.isArray(json)} onChange={(e) => setPreview(e.target.files?.[0] ?? null)} className="block w-full text-small file:mr-3 file:min-h-11 file:border-2 file:border-ink file:bg-paper-raised file:px-3 file:font-semibold" />
          {mismatch(hints.preview, preview) && <p className="field-hint text-ochre-ink">File name differs from the JSON. Check it is the right preview.</p>}
        </Step>

        {plan && (
          <div className="border-2 border-ink bg-paper-raised p-5">
            <p className="label text-ink-3">{jsonName}</p>
            <p className="mt-2 text-title font-semibold">{plan.values.title}</p>
            <p className="mt-1 text-small">
              Will <strong>{plan.mode === "create" ? "create a new book" : "update the existing book"}</strong>
              {plan.bookCode ? ` with Book ID ${plan.bookCode}` : ""}. Collections: {plan.collectionIds.length}
              {plan.unknownCollections.length ? ` (unknown: ${plan.unknownCollections.join(", ")})` : ""}.
            </p>
          </div>
        )}

        <button type="button" onClick={run} disabled={!json || busy || (!Array.isArray(json) && !plan)} className="btn btn-primary">
          <IconUpload size={18} />
          {busy ? "Importing…" : Array.isArray(json) ? `Import ${json.length} books` : "Import this book"}
        </button>

        <div className="space-y-2" aria-live="polite">
          {log.map((l, i) => (
            <Notice key={i} tone={l.tone}>
              {l.text}
            </Notice>
          ))}
        </div>
      </div>

      <aside className="space-y-4 lg:col-span-5">
        <div className="border-t-[3px] border-ink pt-4">
          <h2 className="text-title font-semibold">The format</h2>
          <p className="mt-2 text-small text-ink-2">
            Match by <span className="font-mono">book_code</span> first, then <span className="font-mono">slug</span>. A match is updated, otherwise a
            new book is created. Collections are listed by slug.
          </p>
          <ul className="mt-4 space-y-2 text-small">
            <li>
              <a href="/sample-book.json" download className="link">
                Download the sample book JSON
              </a>
            </li>
            <li>
              <a href="/book-import.schema.json" target="_blank" className="link">
                JSON Schema (for editors that validate)
              </a>
            </li>
            <li>
              <a href="/api/admin/export" className="link">
                Export every book as JSON (backup)
              </a>
            </li>
            <li>
              Single-book export: the <span className="font-mono">JSON</span> button on each <Link href="/admin/books" className="link">book page</Link>.
            </li>
          </ul>
        </div>
      </aside>
    </div>
  );
}

function Step({ n, title, hint, children }: { n: number; title: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3 border-t border-ink pt-4">
      <span className="text-[2rem] leading-none font-medium text-green-700 italic tnum">{n}</span>
      <div className="min-w-0">
        <p className="font-semibold">{title}</p>
        <p className="field-hint mt-0 mb-3">{hint}</p>
        {children}
      </div>
    </div>
  );
}
