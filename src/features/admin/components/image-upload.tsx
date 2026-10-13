"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { isExternalUrl, isValidImageUrl, mediaUrl } from "@/lib/media";
import type { MediaFolder } from "@/config/storage";
import { IconImage, IconTrash } from "@/components/icons";
import { checkMediaImage, uploadMedia } from "../uploads";
import { DropZone, SourceTabs } from "./drop-zone";

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
 * An image field: drag or pick a file (JPG, PNG, WebP or GIF) to upload it
 * straight to the private media bucket, or paste a link to an image hosted
 * anywhere. The
 * form saves the path or link; the server verifies it and deletes a file it
 * replaced.
 */
export function ImageUpload({ id, label, folder, ownerId, value, onChange, aspect = "16 / 9", hint }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urlMode, setUrlMode] = useState(isExternalUrl(value));
  const [url, setUrl] = useState<string>(isExternalUrl(value) && value ? value : "");
  const src = mediaUrl(value);

  async function onFile(file: File) {
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
  }

  const applyLink = () => {
    const v = url.trim();
    if (!v) return;
    if (!isValidImageUrl(v)) return setError("Paste a full https:// link to an image.");
    setError(null);
    onChange(v);
  };

  return (
    <div>
      <p className="field-label">{label}</p>
      <div className="flex flex-wrap items-start gap-3">
        <div className={cn("relative w-32 shrink-0 overflow-hidden rounded-md border border-line bg-muted")} style={{ aspectRatio: aspect }}>
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element -- admin preview of a private media file
            <img src={src} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-text-3">
              <IconImage size={22} />
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1 basis-56 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <SourceTabs mode={urlMode ? "link" : "file"} onMode={(m) => setUrlMode(m === "link")} label={`${label}: upload or link`} />
            {value && (
              <button
                type="button"
                className="btn btn-ghost btn-sm text-sale hover:text-sale"
                onClick={() => {
                  onChange(null);
                  setUrl("");
                }}
              >
                <IconTrash size={16} />
                Remove
              </button>
            )}
          </div>
          {urlMode ? (
            <div className="flex gap-2">
              <label htmlFor={`${id}-url`} className="sr-only">
                Image link for {label}
              </label>
              <input
                id={`${id}-url`}
                type="url"
                inputMode="url"
                className="input h-10 min-h-10 text-sm"
                placeholder="https://… (.jpg, .png, .webp or .gif)"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    e.currentTarget.blur();
                  }
                }}
                onBlur={applyLink}
              />
              <button type="button" className="btn btn-secondary btn-sm h-10 shrink-0" onClick={applyLink}>
                Use
              </button>
            </div>
          ) : (
            <DropZone
              id={id}
              accept="image/jpeg,image/png,image/webp,image/gif"
              onFile={onFile}
              busy={busy}
              label={value ? "Drag a new image here" : "Drag an image or GIF here"}
              inputLabel={`Upload ${label}`}
              className="min-h-20 py-3"
            />
          )}
        </div>
      </div>
      {error ? <p className="field-error">{error}</p> : hint ? <p className="field-hint">{hint}</p> : null}
    </div>
  );
}
