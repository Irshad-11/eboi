"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { mediaUrl } from "@/lib/media";
import type { MediaFolder } from "@/config/storage";
import { IconImage, IconTrash, IconUpload } from "@/components/icons";
import { checkMediaImage, uploadMedia } from "../uploads";

type Props = {
  id: string;
  label: string;
  folder: MediaFolder;
  ownerId: string;
  value: string | null;
  onChange: (path: string | null) => void;
  /** CSS aspect-ratio for the preview box, e.g. "16 / 5". */
  aspect?: string;
  hint?: string;
};

/**
 * Picks an image and uploads it straight to the private media bucket. The
 * form then saves the new path; the server verifies the file and deletes the
 * one it replaced.
 */
export function ImageUpload({ id, label, folder, ownerId, value, onChange, aspect = "16 / 9", hint }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const src = mediaUrl(value);

  return (
    <div>
      <p className="field-label">{label}</p>
      <div className="flex flex-wrap items-start gap-3">
        <div className={cn("relative w-40 overflow-hidden rounded-md border border-line bg-muted")} style={{ aspectRatio: aspect }}>
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element -- admin preview of a private media file
            <img src={src} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-text-3">
              <IconImage size={22} />
            </span>
          )}
        </div>
        <div className="space-y-2">
          <label htmlFor={id} className={cn("btn btn-secondary btn-sm cursor-pointer", busy && "pointer-events-none opacity-60")} data-loading={busy}>
            <IconUpload size={16} />
            {value ? "Replace" : "Upload"}
          </label>
          <input
            id={id}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              setError(null);
              const problem = await checkMediaImage(file);
              if (problem) return setError(problem);
              setBusy(true);
              try {
                onChange(await uploadMedia(folder, ownerId, file));
              } catch (err) {
                setError(err instanceof Error ? err.message : "Upload failed.");
              } finally {
                setBusy(false);
              }
            }}
          />
          {value && (
            <button type="button" className="btn btn-ghost btn-sm text-sale hover:text-sale" onClick={() => onChange(null)}>
              <IconTrash size={16} />
              Remove
            </button>
          )}
        </div>
      </div>
      {error ? <p className="field-error">{error}</p> : hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  );
}
