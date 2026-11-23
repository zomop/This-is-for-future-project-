"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Check, Upload, CircleUserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { AVATARS } from "@/lib/types";
import { FramedAvatar } from "@/components/framed-avatar";

const FALLBACK_DEFAULT = "/avatars/hooded.png";

/**
 * Shared avatar picker: the 4 bundled pixel avatars or an upload from the
 * device (PNG/JPEG/WebP/GIF, max 2 MB — enforced server-side too).
 *
 * - Emits a hidden `avatar_url` input (a bundled path — the server swaps in
 *   the uploaded file's URL when a file is present) plus the `avatarFile`
 *   file input itself.
 * - `requireChoice` (registration) reports via `onChosen` whether the user
 *   has made any selection, so the parent can gate the submit button.
 */
export function AvatarPicker({
  current,
  frame,
  requireChoice = false,
  onChosen,
}: {
  /** Existing avatar_url; "" when none chosen yet. */
  current: string;
  /** Frame to show in the live preview (purely cosmetic here). */
  frame?: string | null;
  requireChoice?: boolean;
  onChosen?: (chosen: boolean) => void;
}) {
  const isUploadedCurrent = /^https?:\/\//.test(current);
  const [selected, setSelected] = useState<string>(current);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Revoke object URLs to avoid leaking memory.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const pickDefault = (path: string) => {
    setSelected(path);
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    onChosen?.(true);
  };

  const pickUpload = (f: File | null) => {
    if (!f) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    // Hidden avatar_url must still satisfy the server schema; the file wins.
    setSelected(FALLBACK_DEFAULT);
    onChosen?.(true);
  };

  const pickCurrentUpload = () => {
    setSelected(current);
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    onChosen?.(true);
  };

  const effectivePreview = previewUrl ?? (selected || null);
  const uploadSelected = file !== null;

  return (
    <fieldset>
      <div className="flex items-start gap-5">
        {/* live preview */}
        <div className="flex flex-col items-center gap-2">
          {effectivePreview ? (
            <FramedAvatar
              src={effectivePreview}
              alt="Avatar preview"
              size={84}
              frame={frame}
              priority
              className="border-2 border-line bg-panel2"
            />
          ) : (
            <span className="flex h-[84px] w-[84px] items-center justify-center rounded-full border-2 border-dashed border-line bg-panel2 text-muted">
              <CircleUserRound size={40} strokeWidth={1.4} />
            </span>
          )}
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted">
            Preview
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-3">
            {/* upload tile */}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              aria-pressed={uploadSelected}
              className={cn(
                "relative flex h-[72px] w-[72px] cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border transition-all",
                uploadSelected
                  ? "border-accent bg-accent/10 ring-2 ring-accent/40"
                  : "border-dashed border-line bg-panel2 text-muted hover:border-panel3 hover:text-foreground"
              )}
              title="Upload your own image"
            >
              {uploadSelected && previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
                <img src={previewUrl} alt="Uploaded avatar" className="h-full w-full rounded-2xl object-cover" />
              ) : (
                <>
                  <Upload size={20} strokeWidth={1.8} />
                  <span className="px-1 text-center text-[8px] font-bold uppercase leading-tight tracking-wider">
                    Upload
                  </span>
                </>
              )}
              {uploadSelected && (
                <span className="absolute -right-1.5 -top-1.5 rounded-full bg-accent p-1 text-[#062630]">
                  <Check size={11} strokeWidth={3.5} />
                </span>
              )}
            </button>

            {/* keep-current-upload tile (only when the stored avatar is an upload) */}
            {isUploadedCurrent && (
              <label
                className={cn(
                  "relative cursor-pointer rounded-2xl border p-1 transition-all",
                  !uploadSelected && selected === current
                    ? "border-accent bg-accent/10 ring-2 ring-accent/40"
                    : "border-line bg-panel2 hover:border-panel3"
                )}
              >
                <input
                  type="radio"
                  name="__avatar_choice"
                  className="sr-only"
                  checked={!uploadSelected && selected === current}
                  onChange={pickCurrentUpload}
                />
                <FramedAvatar src={current} alt="Current uploaded avatar" size={64} frame={frame} className="rounded-xl" />
                <span className="mt-1 block text-center text-[8px] font-bold uppercase tracking-wider text-muted">
                  Current
                </span>
                {!uploadSelected && selected === current && (
                  <span className="absolute -right-1.5 -top-1.5 rounded-full bg-accent p-1 text-[#062630]">
                    <Check size={11} strokeWidth={3.5} />
                  </span>
                )}
              </label>
            )}

            {/* bundled defaults */}
            {AVATARS.map((src) => {
              const isSelected = !uploadSelected && selected === src;
              return (
                <label
                  key={src}
                  className={cn(
                    "relative cursor-pointer rounded-2xl border p-1 transition-all",
                    isSelected
                      ? "border-accent bg-accent/10 ring-2 ring-accent/40"
                      : "border-line bg-panel2 hover:border-panel3"
                  )}
                >
                  <input
                    type="radio"
                    name="__avatar_choice"
                    value={src}
                    className="sr-only"
                    checked={isSelected}
                    onChange={() => pickDefault(src)}
                  />
                  <Image
                    src={src}
                    alt={`Avatar ${src.split("/").pop()}`}
                    width={64}
                    height={64}
                    className="pixelated h-16 w-16 rounded-xl object-cover"
                  />
                  {isSelected && (
                    <span className="absolute -right-1.5 -top-1.5 rounded-full bg-accent p-1 text-[#062630]">
                      <Check size={11} strokeWidth={3.5} />
                    </span>
                  )}
                </label>
              );
            })}
          </div>

          <input
            ref={fileRef}
            type="file"
            name="avatarFile"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="sr-only"
            onChange={(e) => pickUpload(e.target.files?.[0] ?? null)}
            aria-label="Upload your own avatar image"
          />
          <input type="hidden" name="avatar_url" value={selected || FALLBACK_DEFAULT} />
          <p className="mt-2 text-[11px] leading-snug text-muted">
            Pick a bundled traveler{requireChoice ? " — required" : ""}, or upload your own
            PNG, JPEG, WebP or GIF (max 2 MB). Uploads live in your own storage folder.
          </p>
        </div>
      </div>
    </fieldset>
  );
}
