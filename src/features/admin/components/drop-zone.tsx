"use client";

import { useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { IconFile, IconLink, IconUpload } from "@/components/icons";

type DropZoneProps = {
  /** Input accept list, e.g. "application/pdf,.pdf". */
  accept: string;
  onFile: (file: File) => void;
  /** Name of the chosen file, shown inside the zone. */
  fileName?: string | null;
  label?: string;
  hint?: ReactNode;
  disabled?: boolean;
  busy?: boolean;
  id?: string;
  className?: string;
  /** Accessible name for the hidden file input. */
  inputLabel?: string;
};

/** Drag a file onto the box, or click it to choose one. */
export function DropZone({ accept, onFile, fileName, label = "Drag a file here", hint, disabled, busy, id, className, inputLabel }: DropZoneProps) {
  const auto = useId();
  const inputId = id ?? `drop-${auto}`;
  const [over, setOver] = useState(false);

  const take = (file: File | undefined) => {
    if (file && !disabled) onFile(file);
  };

  return (
    <label
      htmlFor={inputId}
      data-over={over || undefined}
      data-loading={busy || undefined}
      className={cn(
        "flex min-h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-line-2 bg-muted/50 px-4 py-4 text-center transition-colors hover:border-brand hover:bg-brand-soft/40",
        "data-[over]:border-brand data-[over]:bg-brand-soft",
        (disabled || busy) && "pointer-events-none opacity-60",
        className,
      )}
      onDragEnter={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        take(e.dataTransfer.files?.[0]);
      }}
    >
      {fileName ? <IconFile size={22} className="text-brand" /> : <IconUpload size={22} className="text-text-3" />}
      <span className="text-sm font-medium break-all">{fileName ?? label}</span>
      <span className="text-sm text-text-3">{fileName ? "Drop or click to change" : "or click to choose"}</span>
      {hint && <span className="text-xs text-text-3">{hint}</span>}
      <input
        id={inputId}
        type="file"
        accept={accept}
        aria-label={inputLabel ?? label}
        className="sr-only"
        disabled={disabled}
        onChange={(e) => {
          take(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </label>
  );
}

/** "Upload file" / "Paste link" switch, so every upload offers both. */
export function SourceTabs({ mode, onMode, label }: { mode: "file" | "link"; onMode: (m: "file" | "link") => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-md border border-line-2 bg-white p-0.5">
      {(["file", "link"] as const).map((m) => (
        <button
          key={m}
          type="button"
          role="radio"
          aria-checked={mode === m}
          onClick={() => onMode(m)}
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-[6px] px-2.5 text-sm font-medium whitespace-nowrap",
            mode === m ? "bg-brand text-white" : "text-text-2 hover:bg-muted hover:text-text",
          )}
        >
          {m === "file" ? <IconUpload size={15} /> : <IconLink size={15} />}
          {m === "file" ? "Upload file" : "Paste link"}
        </button>
      ))}
    </div>
  );
}

/**
 * Downloads a linked PDF, JSON or image through the admin-only fetch route
 * and returns it as a File, so it goes through the same checks as a picked file.
 */
export async function fetchLinkedFile(url: string, kind: "pdf" | "json" | "image"): Promise<File> {
  const res = await fetch(`/api/admin/fetch-file?kind=${kind}&url=${encodeURIComponent(url.trim())}`, { cache: "no-store" });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "That link could not be downloaded.");
  }
  const blob = await res.blob();
  const name = decodeURIComponent(res.headers.get("x-file-name") ?? `file.${kind}`);
  return new File([blob], name, { type: blob.type || (kind === "pdf" ? "application/pdf" : "application/json") });
}

/** A link field with a button: for PDFs and JSON that are downloaded, not hot-linked. */
export function LinkFetcher({
  id,
  label,
  placeholder,
  kind,
  onFile,
  buttonLabel = "Get file",
}: {
  id: string;
  label: string;
  placeholder: string;
  kind: "pdf" | "json" | "image";
  onFile: (file: File) => void | Promise<void>;
  buttonLabel?: string;
}) {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    if (!/^https?:\/\/\S+$/i.test(url.trim())) return setError("Paste a full https:// link.");
    setError(null);
    setBusy(true);
    try {
      await onFile(await fetchLinkedFile(url, kind));
    } catch (err) {
      setError(err instanceof Error ? err.message : "That link could not be downloaded.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          id={id}
          type="url"
          inputMode="url"
          className="input h-10 min-h-10 text-sm"
          placeholder={placeholder}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void go();
            }
          }}
        />
        <button type="button" className="btn btn-secondary btn-sm h-10 shrink-0" onClick={go} disabled={busy} data-loading={busy}>
          {buttonLabel}
        </button>
      </div>
      {error ? <p className="field-error">{error}</p> : <p className="field-hint">Google Drive and Dropbox share links work if the file is public.</p>}
    </div>
  );
}
