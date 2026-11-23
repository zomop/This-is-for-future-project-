import Link from "next/link";
import { Hammer, ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * Honest placeholder-free "phase gate" panel: explains exactly what will land
 * in this section and which milestone ships it. No dead controls — only
 * working navigation.
 */
export function PhaseNotice({
  phase,
  title,
  blurb,
  includes,
}: {
  phase: number;
  title: string;
  blurb: string;
  includes: string[];
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <Card className="overflow-hidden">
        <div className="flex items-center gap-3 border-b border-line bg-panel2/50 px-6 py-4">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-accentdim/60 bg-accent/10 text-accent">
            <Hammer size={20} strokeWidth={1.8} />
          </span>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-accent">
              Phase {phase} · In development
            </p>
            <h1 className="text-lg font-bold text-foreground">{title}</h1>
          </div>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm leading-relaxed text-muted">{blurb}</p>
          <ul className="mt-4 space-y-2">
            {includes.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-foreground/90">
                <span
                  aria-hidden
                  className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-[2px] bg-gold"
                />
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-6 border-t border-line pt-4">
            <p className="text-xs text-muted">
              Nothing here is faked or stubbed — this section simply hasn&apos;t shipped yet.
              It will unlock with Phase {phase}.
            </p>
            <Link href="/home" className="mt-4 inline-block">
              <Button variant="outline" size="sm">
                <ArrowLeft size={15} /> Back to Home
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
