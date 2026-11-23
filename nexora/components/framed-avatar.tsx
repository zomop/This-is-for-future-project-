import Image from "next/image";
import { cn } from "@/lib/utils";
import { getFrame } from "@/lib/frames";

/**
 * Avatar with an optional profile frame (Discord-style decoration).
 * Frame visuals are pure CSS (see globals.css) — no artwork required.
 * Default pixel-art avatars are rendered pixelated; uploaded photos are not.
 */
export function FramedAvatar({
  src,
  alt,
  size,
  frame,
  className,
  priority,
}: {
  src: string;
  alt: string;
  /** Rendered edge length in pixels. */
  size: number;
  frame?: string | null;
  className?: string;
  priority?: boolean;
}) {
  const def = getFrame(frame);
  const decorated = def.slug !== "none";
  const isUpload = /^https?:\/\//.test(src);

  const image = (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      priority={priority}
      unoptimized={isUpload}
      className={cn(
        "relative rounded-full object-cover",
        !isUpload && "pixelated",
        className
      )}
      style={{ width: size, height: size }}
    />
  );

  if (!decorated) return image;

  return (
    <span
      className="relative inline-flex shrink-0"
      style={{ width: size, height: size }}
      aria-label={`${alt} — frame: ${def.name}`}
    >
      <span aria-hidden className={cn("fr", `fr-${def.slug}`, "-inset-[4px]")} />
      {image}
    </span>
  );
}
