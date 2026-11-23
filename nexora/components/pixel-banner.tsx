import { cn } from "@/lib/utils";
import type { BannerVariant } from "@/lib/types";

/**
 * Animated pixel-art banner — 100% hand-coded SVG pixels + CSS keyframes.
 * Provenance: generated in-repo (no AI image art), per the project art rule.
 * Variants: island (cute), sunset (warm), night (dreamy), arcade (cool).
 */

function Island() {
  return (
    <>
      {/* sky */}
      <rect x="0" y="0" width="320" height="32" fill="#6fc9ea" />
      <rect x="0" y="32" width="320" height="18" fill="#86d5ef" />
      <rect x="0" y="50" width="320" height="12" fill="#9fe0f4" />
      {/* sun */}
      <rect x="264" y="8" width="28" height="28" fill="#ffd76a" />
      <rect x="260" y="12" width="36" height="20" fill="#ffd76a" />
      <rect x="268" y="12" width="20" height="20" fill="#ffea9a" />
      {/* clouds */}
      <g className="pix-drift">
        <rect x="36" y="14" width="36" height="8" fill="#ffffff" />
        <rect x="44" y="8" width="20" height="8" fill="#ffffff" />
      </g>
      <g className="pix-drift-slow">
        <rect x="150" y="22" width="28" height="8" fill="#eef8ff" />
        <rect x="156" y="16" width="16" height="8" fill="#eef8ff" />
      </g>
      {/* sea */}
      <rect x="0" y="62" width="320" height="34" fill="#2b86c2" />
      <rect x="0" y="62" width="320" height="6" fill="#3fa8dd" />
      {/* rolling wave crests (tile = 64px, loops seamlessly) */}
      <g className="pix-wave">
        {Array.from({ length: 7 }, (_, i) => (
          <g key={i} transform={`translate(${i * 64 - 64} 0)`}>
            <rect x="0" y="62" width="24" height="4" fill="#7fd6f0" />
            <rect x="28" y="64" width="16" height="4" fill="#7fd6f0" />
            <rect x="48" y="62" width="16" height="4" fill="#7fd6f0" />
          </g>
        ))}
      </g>
      <g className="pix-wave-slow">
        {Array.from({ length: 7 }, (_, i) => (
          <g key={i} transform={`translate(${i * 64 - 40} 0)`}>
            <rect x="0" y="78" width="20" height="4" fill="#2e93cc" />
            <rect x="28" y="80" width="24" height="4" fill="#2e93cc" />
          </g>
        ))}
      </g>
      {/* island + palm */}
      <rect x="36" y="58" width="88" height="8" fill="#e8cf9a" />
      <rect x="48" y="54" width="64" height="8" fill="#f2dda8" />
      <rect x="76" y="34" width="6" height="24" fill="#8a5a33" />
      <rect x="64" y="28" width="22" height="8" fill="#2e9e63" />
      <rect x="80" y="24" width="22" height="8" fill="#57d99a" />
      <rect x="88" y="30" width="18" height="6" fill="#2e9e63" />
      <rect x="60" y="34" width="14" height="6" fill="#57d99a" />
      {/* bouncing slime */}
      <g className="pix-bounce">
        <rect x="150" y="52" width="16" height="10" fill="#57d99a" />
        <rect x="148" y="56" width="20" height="6" fill="#57d99a" />
        <rect x="153" y="55" width="3" height="3" fill="#123" />
        <rect x="160" y="55" width="3" height="3" fill="#123" />
        <rect x="152" y="50" width="12" height="4" fill="#7fe9b6" />
      </g>
      {/* sparkles */}
      <rect x="122" y="18" width="4" height="4" fill="#ffffff" className="pix-twinkle" />
      <rect x="206" y="38" width="4" height="4" fill="#ffffff" className="pix-twinkle-2" />
      <rect x="240" y="14" width="4" height="4" fill="#ffea9a" className="pix-twinkle-3" />
    </>
  );
}

function Sunset() {
  return (
    <>
      {/* sky bands */}
      <rect x="0" y="0" width="320" height="18" fill="#4a2a68" />
      <rect x="0" y="18" width="320" height="14" fill="#8a3a74" />
      <rect x="0" y="32" width="320" height="12" fill="#d4566e" />
      <rect x="0" y="44" width="320" height="12" fill="#f2874f" />
      <rect x="0" y="56" width="320" height="10" fill="#ffc46b" />
      {/* half sun on the horizon */}
      <rect x="120" y="42" width="48" height="14" fill="#ffd07a" />
      <rect x="112" y="48" width="64" height="8" fill="#ffd07a" />
      <rect x="132" y="44" width="24" height="10" fill="#ffea9a" />
      {/* birds */}
      <g className="pix-fly">
        <rect x="0" y="22" width="4" height="4" fill="#2c1640" />
        <rect x="4" y="18" width="4" height="4" fill="#2c1640" />
        <rect x="8" y="22" width="4" height="4" fill="#2c1640" />
      </g>
      <g className="pix-fly-slow">
        <rect x="0" y="32" width="4" height="4" fill="#2c1640" />
        <rect x="4" y="28" width="4" height="4" fill="#2c1640" />
        <rect x="8" y="32" width="4" height="4" fill="#2c1640" />
      </g>
      {/* sea + sun glint */}
      <rect x="0" y="66" width="320" height="30" fill="#7a2f5e" />
      <rect x="136" y="66" width="16" height="4" fill="#ffb26b" />
      <rect x="132" y="72" width="24" height="4" fill="#e89a6b" />
      <rect x="138" y="78" width="12" height="4" fill="#d4728f" />
      <rect x="134" y="86" width="20" height="4" fill="#b95a7d" />
      {/* island silhouettes */}
      <rect x="0" y="60" width="56" height="10" fill="#2c1640" />
      <rect x="12" y="54" width="32" height="8" fill="#2c1640" />
      <rect x="264" y="62" width="56" height="8" fill="#2c1640" />
      <rect x="280" y="56" width="28" height="8" fill="#2c1640" />
    </>
  );
}

function Night() {
  return (
    <>
      {/* sky */}
      <rect x="0" y="0" width="320" height="34" fill="#0b1230" />
      <rect x="0" y="34" width="320" height="16" fill="#101a3e" />
      <rect x="0" y="50" width="320" height="12" fill="#16224c" />
      {/* moon */}
      <rect x="252" y="10" width="28" height="28" fill="#ffe9a8" />
      <rect x="248" y="14" width="36" height="20" fill="#ffe9a8" />
      <rect x="258" y="16" width="6" height="6" fill="#e8cf9a" />
      <rect x="268" y="26" width="4" height="4" fill="#e8cf9a" />
      {/* stars */}
      <rect x="18" y="10" width="4" height="4" fill="#dfe9ff" className="pix-twinkle" />
      <rect x="58" y="24" width="4" height="4" fill="#dfe9ff" className="pix-twinkle-2" />
      <rect x="96" y="8" width="4" height="4" fill="#dfe9ff" className="pix-twinkle-3" />
      <rect x="132" y="20" width="4" height="4" fill="#dfe9ff" className="pix-twinkle" />
      <rect x="170" y="12" width="4" height="4" fill="#dfe9ff" className="pix-twinkle-2" />
      <rect x="206" y="26" width="4" height="4" fill="#dfe9ff" className="pix-twinkle-3" />
      <rect x="228" y="6" width="4" height="4" fill="#dfe9ff" className="pix-twinkle" />
      <rect x="304" y="18" width="4" height="4" fill="#dfe9ff" className="pix-twinkle-2" />
      {/* aurora shimmer */}
      <g className="pix-shimmer">
        <rect x="30" y="38" width="90" height="6" fill="#2fd8a0" opacity="0.5" />
        <rect x="110" y="34" width="70" height="6" fill="#41d4f4" opacity="0.45" />
        <rect x="170" y="40" width="60" height="6" fill="#2fd8a0" opacity="0.4" />
      </g>
      {/* sea */}
      <rect x="0" y="62" width="320" height="34" fill="#0e2a4a" />
      <rect x="256" y="62" width="12" height="4" fill="#ffe9a8" opacity="0.8" />
      <rect x="252" y="70" width="20" height="4" fill="#ffe9a8" opacity="0.5" />
      <rect x="258" y="78" width="10" height="4" fill="#ffe9a8" opacity="0.35" />
      <g className="pix-wave-slow">
        {Array.from({ length: 7 }, (_, i) => (
          <g key={i} transform={`translate(${i * 64 - 32} 0)`}>
            <rect x="0" y="62" width="24" height="4" fill="#2b5b90" />
            <rect x="32" y="64" width="18" height="4" fill="#2b5b90" />
          </g>
        ))}
      </g>
    </>
  );
}

function Arcade() {
  return (
    <>
      {/* sky */}
      <rect x="0" y="0" width="320" height="30" fill="#140b2e" />
      <rect x="0" y="30" width="320" height="24" fill="#241246" />
      {/* skyline */}
      <rect x="8" y="34" width="36" height="46" fill="#2e1a56" />
      <rect x="52" y="22" width="28" height="58" fill="#241246" />
      <rect x="88" y="40" width="40" height="40" fill="#2e1a56" />
      <rect x="136" y="28" width="24" height="52" fill="#241246" />
      <rect x="168" y="44" width="44" height="36" fill="#2e1a56" />
      <rect x="220" y="30" width="30" height="50" fill="#241246" />
      <rect x="258" y="42" width="48" height="38" fill="#2e1a56" />
      {/* neon windows */}
      <rect x="16" y="42" width="6" height="6" fill="#41d4f4" className="pix-blink" />
      <rect x="28" y="42" width="6" height="6" fill="#f5a3cd" className="pix-blink-2" />
      <rect x="16" y="54" width="6" height="6" fill="#e8c15a" className="pix-blink-2" />
      <rect x="60" y="30" width="6" height="6" fill="#f5a3cd" className="pix-blink" />
      <rect x="68" y="42" width="6" height="6" fill="#41d4f4" className="pix-blink-2" />
      <rect x="60" y="54" width="6" height="6" fill="#57d99a" className="pix-blink" />
      <rect x="96" y="48" width="6" height="6" fill="#e8c15a" className="pix-blink-2" />
      <rect x="108" y="60" width="6" height="6" fill="#41d4f4" className="pix-blink" />
      <rect x="144" y="36" width="6" height="6" fill="#f5a3cd" className="pix-blink-2" />
      <rect x="152" y="48" width="6" height="6" fill="#e8c15a" className="pix-blink" />
      <rect x="178" y="52" width="6" height="6" fill="#41d4f4" className="pix-blink-2" />
      <rect x="192" y="64" width="6" height="6" fill="#f5a3cd" className="pix-blink" />
      <rect x="228" y="38" width="6" height="6" fill="#57d99a" className="pix-blink-2" />
      <rect x="238" y="50" width="6" height="6" fill="#e8c15a" className="pix-blink" />
      <rect x="270" y="50" width="6" height="6" fill="#41d4f4" className="pix-blink-2" />
      <rect x="286" y="62" width="6" height="6" fill="#f5a3cd" className="pix-blink" />
      {/* neon sign: bars + heart */}
      <rect x="120" y="8" width="80" height="4" fill="#41d4f4" className="pix-blink" />
      <rect x="120" y="16" width="56" height="4" fill="#f5a3cd" className="pix-blink-2" />
      <rect x="188" y="12" width="6" height="6" fill="#f2695c" className="pix-blink" />
      <rect x="196" y="12" width="6" height="6" fill="#f2695c" className="pix-blink" />
      <rect x="186" y="18" width="20" height="6" fill="#f2695c" className="pix-blink" />
      <rect x="190" y="24" width="12" height="4" fill="#f2695c" className="pix-blink" />
      <rect x="194" y="28" width="4" height="4" fill="#f2695c" className="pix-blink" />
      {/* road with moving dashes */}
      <rect x="0" y="80" width="320" height="16" fill="#0d0820" />
      <g className="pix-wave">
        {Array.from({ length: 7 }, (_, i) => (
          <rect key={i} x={i * 64 - 64} y="88" width="28" height="4" fill="#e8c15a" />
        ))}
      </g>
    </>
  );
}

export function PixelBanner({
  variant = "island",
  className,
}: {
  variant?: BannerVariant;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "pointer-events-none overflow-hidden rounded-2xl border border-line bg-[#0b1230]",
        className
      )}
      aria-hidden
    >
      <svg
        viewBox="0 0 320 96"
        preserveAspectRatio="xMidYMid slice"
        className="block h-full w-full"
        shapeRendering="crispEdges"
      >
        {variant === "island" ? (
          <Island />
        ) : variant === "sunset" ? (
          <Sunset />
        ) : variant === "night" ? (
          <Night />
        ) : (
          <Arcade />
        )}
      </svg>
    </div>
  );
}
