import { cn } from "@/lib/utils";
import type { BannerVariant } from "@/lib/types";

/**
 * Animated pixel-art banners, 100% code-drawn SVG (no raster artwork to
 * license). Each variant is a 320x96 pixel scene scaled up with crisp edges.
 *
 * Animation structure (IMPORTANT): CSS `transform` animations override the SVG
 * `transform` attribute, so every animated tile is a child of a *positioned*
 * wrapper `<g transform="translate(...)">` and the animation class lives on the
 * inner element. Positioning lives on the wrapper, motion on the child — never
 * both on the same node. Loops are seamless: `pix-wave` translates exactly one
 * tile width (64px), and tile chains cover -64..384 so the full 0..320 viewBox
 * stays covered at every point of the loop.
 */

const WAVE_PATH = "M0 0 Q8 -5 16 0 T32 0 T48 0 T64 0";

function WaveLayer({
  y,
  color,
  anim,
}: {
  y: number;
  color: string;
  anim: string;
}) {
  // 7 tiles at x = -64..320 (outer wrapper), covering -64..384 before the
  // animation shifts them — the visible 0..320 window is never empty.
  return (
    <g stroke={color} strokeWidth={2} fill="none" strokeLinecap="square">
      {Array.from({ length: 7 }).map((_, i) => (
        <g key={i} transform={`translate(${i * 64 - 64} ${y})`}>
          <path d={WAVE_PATH} className={anim} />
        </g>
      ))}
    </g>
  );
}

function IslandScene() {
  return (
    <>
      <rect width={320} height={96} fill="#8ee3f2" />
      <rect y={52} width={320} height={44} fill="#2b86c2" />
      {/* drifting clouds */}
      <g fill="#ffffff">
        <g className="pix-drift">
          <rect x={40} y={14} width={26} height={6} />
          <rect x={46} y={10} width={14} height={4} />
        </g>
        <g className="pix-drift-slow">
          <rect x={200} y={22} width={30} height={6} />
          <rect x={208} y={18} width={12} height={4} />
        </g>
      </g>
      {/* sun */}
      <g>
        <rect x={258} y={12} width={22} height={22} fill="#ffd76a" />
        <rect x={252} y={18} width={4} height={10} fill="#ffd76a" />
        <rect x={280} y={18} width={4} height={10} fill="#ffd76a" />
        <rect x={264} y={6} width={10} height={4} fill="#ffd76a" />
        <rect x={264} y={34} width={10} height={4} fill="#ffd76a" />
      </g>
      {/* palm island */}
      <g>
        <rect x={62} y={52} width={40} height={10} fill="#e8c15a" />
        <rect x={68} y={62} width={28} height={6} fill="#c79b3f" />
        <rect x={82} y={28} width={6} height={26} fill="#7a4f26" />
        <g fill="#2e9e63">
          <rect x={58} y={22} width={22} height={6} />
          <rect x={52} y={26} width={16} height={5} />
          <rect x={90} y={22} width={22} height={6} />
          <rect x={98} y={26} width={16} height={5} />
          <rect x={66} y={16} width={34} height={6} />
          <rect x={76} y={12} width={16} height={5} />
        </g>
        <rect x={64} y={20} width={6} height={6} fill="#8a5a2b" />
        <rect x={94} y={22} width={6} height={6} fill="#8a5a2b" />
      </g>
      {/* sea waves (positioned tiles + animated child) */}
      <WaveLayer y={60} color="#6fc9ea" anim="pix-wave" />
      <WaveLayer y={76} color="#1e6fa8" anim="pix-wave-slow" />
      <g fill="#bdeef8" className="pix-shimmer">
        <rect x={180} y={68} width={22} height={3} />
        <rect x={214} y={82} width={16} height={3} />
      </g>
      {/* boat */}
      <g>
        <rect x={168} y={54} width={22} height={5} fill="#7a4f26" />
        <rect x={177} y={38} width={3} height={16} fill="#5c3c1e" />
        <rect x={180} y={40} width={11} height={10} fill="#fff6cf" />
      </g>
    </>
  );
}

function SunsetScene() {
  return (
    <>
      <rect width={320} height={96} fill="#f2874f" />
      <rect y={36} width={320} height={22} fill="#e2603f" />
      <rect y={58} width={320} height={38} fill="#7a2f5e" />
      {/* setting sun */}
      <g>
        <rect x={120} y={34} width={56} height={24} fill="#ffd76a" />
        <rect x={112} y={40} width={72} height={12} fill="#ffd76a" />
        <rect x={130} y={28} width={36} height={6} fill="#ffe9a8" />
      </g>
      {/* striped clouds */}
      <g fill="#ffb27a">
        <rect x={30} y={18} width={70} height={5} />
        <rect x={44} y={26} width={42} height={4} />
        <rect x={226} y={14} width={62} height={5} />
        <rect x={240} y={22} width={34} height={4} />
      </g>
      {/* gulls */}
      <g stroke="#3a1d2e" strokeWidth={2} fill="none" strokeLinecap="square">
        <path d="M70 12 l4 -3 l4 3" />
        <path d="M240 34 l4 -3 l4 3" />
      </g>
      {/* water bands sliding */}
      <g stroke="#c96a86" strokeWidth={3} fill="none" strokeLinecap="square">
        {Array.from({ length: 7 }).map((_, i) => (
          <g key={i} transform={`translate(${i * 64 - 64} 72)`}>
            <path d="M0 0 Q16 -6 32 0 T64 0" className="pix-wave-slow" />
          </g>
        ))}
      </g>
      <g stroke="#ff9d6a" strokeWidth={3} fill="none" strokeLinecap="square">
        {Array.from({ length: 7 }).map((_, i) => (
          <g key={i} transform={`translate(${i * 64 - 64} 84)`}>
            <path d="M0 0 Q16 -6 32 0 T64 0" className="pix-wave" />
          </g>
        ))}
      </g>
    </>
  );
}

function NightScene() {
  return (
    <>
      <rect width={320} height={96} fill="#0b1230" />
      <rect y={62} width={320} height={34} fill="#101a3e" />
      {/* stars */}
      <g fill="#d7e6ff">
        <rect x={22} y={12} width={3} height={3} className="pix-twinkle" />
        <rect x={66} y={26} width={3} height={3} className="pix-twinkle-2" />
        <rect x={118} y={10} width={3} height={3} className="pix-twinkle-3" />
        <rect x={150} y={30} width={3} height={3} className="pix-twinkle-2" />
        <rect x={196} y={8} width={3} height={3} className="pix-twinkle" />
        <rect x={236} y={28} width={3} height={3} className="pix-twinkle-3" />
        <rect x={292} y={16} width={3} height={3} className="pix-twinkle-2" />
        <rect x={304} y={38} width={3} height={3} className="pix-twinkle" />
      </g>
      {/* crescent moon */}
      <g>
        <rect x={266} y={14} width={16} height={16} fill="#f4ecd0" />
        <rect x={272} y={12} width={12} height={20} fill="#0b1230" />
      </g>
      {/* sea */}
      <WaveLayer y={68} color="#2b4a8a" anim="pix-wave" />
      <WaveLayer y={84} color="#1b2f63" anim="pix-wave-slow" />
      {/* fireflies: position on wrapper, motion on the child */}
      {[0, 1, 2, 3].map((f) => (
        <g key={f} transform={`translate(${30 + f * 46} 40)`}>
          <rect
            width={4}
            height={4}
            fill="#ffe98a"
            className={f % 2 ? "pix-fly-slow" : "pix-fly"}
          />
        </g>
      ))}
      {/* moonlit boat */}
      <g>
        <rect x={62} y={58} width={26} height={5} fill="#22305c" />
        <rect x={72} y={42} width={3} height={16} fill="#2c3c6e" />
        <rect x={75} y={44} width={12} height={10} fill="#aebfe8" />
      </g>
    </>
  );
}

function ArcadeScene() {
  return (
    <>
      <rect width={320} height={96} fill="#0d0820" />
      {/* perspective grid floor — rows extend past the frame so the wave loop
          never exposes an empty edge */}
      <g stroke="#3cf2ff" strokeWidth={1.5} fill="none">
        {[62, 72, 84, 96].map((y, i) => (
          <rect
            key={y}
            x={-64}
            y={y}
            width={448}
            height={0}
            className={i % 2 ? "pix-wave-slow" : "pix-wave"}
          />
        ))}
        <rect x={60} y={58} width={3} height={38} />
        <rect x={128} y={58} width={3} height={38} />
        <rect x={192} y={58} width={3} height={38} />
        <rect x={260} y={58} width={3} height={38} />
      </g>
      {/* neon skyline */}
      <g>
        <rect x={18} y={30} width={22} height={30} fill="#241246" />
        <rect x={24} y={36} width={4} height={4} fill="#ff4fd8" className="pix-blink" />
        <rect x={32} y={44} width={4} height={4} fill="#3cf2ff" />
        <rect x={54} y={18} width={18} height={42} fill="#2c1658" />
        <rect x={58} y={24} width={4} height={4} fill="#ffe98a" className="pix-blink-2" />
        <rect x={64} y={32} width={4} height={4} fill="#3cf2ff" className="pix-blink" />
        <rect x={244} y={24} width={20} height={36} fill="#241246" />
        <rect x={250} y={30} width={4} height={4} fill="#3cf2ff" className="pix-blink-2" />
        <rect x={258} y={38} width={4} height={4} fill="#ff4fd8" />
        <rect x={282} y={12} width={16} height={48} fill="#2c1658" />
        <rect x={286} y={18} width={4} height={4} fill="#ffe98a" className="pix-blink" />
        <rect x={294} y={28} width={4} height={4} fill="#ff4fd8" className="pix-blink-2" />
      </g>
      {/* floating coin */}
      <g>
        <rect x={162} y={30} width={12} height={12} fill="#ffd76a" className="pix-bounce" />
        <rect x={166} y={33} width={4} height={6} fill="#8a5a00" className="pix-bounce" />
      </g>
      {/* radar spinner */}
      <g stroke="#3cf2ff" strokeWidth={2} fill="none" strokeLinecap="square">
        <path d="M32 26 v8 M28 30 h8" className="pix-spin" />
      </g>
      {/* laser scan */}
      <rect x={0} y={54} width={320} height={2} fill="#ff4fd8" opacity={0.5} className="pix-scan" />
    </>
  );
}

export function PixelBanner({
  variant,
  className,
  title,
}: {
  variant: BannerVariant;
  className?: string;
  /** Accessible label; when omitted the banner is purely decorative. */
  title?: string;
}) {
  const scene =
    variant === "sunset" ? (
      <SunsetScene />
    ) : variant === "night" ? (
      <NightScene />
    ) : variant === "arcade" ? (
      <ArcadeScene />
    ) : (
      <IslandScene />
    );

  return (
    <div
      className={cn(
        "pointer-events-none overflow-hidden rounded-2xl border border-line bg-[#0b1230]",
        className
      )}
    >
      <svg
        viewBox="0 0 320 96"
        preserveAspectRatio="xMidYMid slice"
        className="block h-full w-full"
        role={title ? "img" : undefined}
        aria-label={title}
        aria-hidden={title ? undefined : true}
        shapeRendering="crispEdges"
      >
        {scene}
      </svg>
    </div>
  );
}
