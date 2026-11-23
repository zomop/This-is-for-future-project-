import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/app-shell";

/** Split-screen auth layout: form on the left, key art on the right (desktop). */
export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-5 py-6 sm:px-10">
        <div className="flex items-center justify-between">
          <Logo />
          <Link href="/" className="text-xs font-semibold text-muted hover:text-foreground">
            ← Back to welcome
          </Link>
        </div>
        <div className="flex flex-1 items-center">
          <div className="w-full max-w-md">
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              {title}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted">{subtitle}</p>
            <div className="mt-7">{children}</div>
          </div>
        </div>
      </div>

      <div className="relative hidden border-l border-line lg:block">
        <Image
          src="/banners/field.png"
          alt="The Field of the Fallen Sword — NEXORA art"
          fill
          className="pixelated object-cover object-right"
          sizes="50vw"
          priority
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-graphite via-graphite/30 to-transparent"
          aria-hidden
        />
        <p className="absolute bottom-8 left-8 max-w-xs text-xs font-medium italic leading-relaxed text-[#aab6cc]">
          “Every traveler arrives for the sword. Legends stay for the people.”
        </p>
      </div>
    </main>
  );
}
