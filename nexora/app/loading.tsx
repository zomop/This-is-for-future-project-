export default function Loading() {
  return (
    <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4" aria-live="polite" aria-busy="true">
      <svg
        width="44"
        height="44"
        viewBox="0 0 34 34"
        fill="none"
        aria-hidden
        className="animate-pulse"
      >
        <path
          d="M17 1.5 31 9.6v15.2L17 32.9 3 24.8V9.6L17 1.5Z"
          stroke="#41d4f4"
          strokeWidth="2.2"
          strokeLinejoin="round"
          fill="#131a26"
        />
        <path
          d="M11.5 23.5V10.5l11 13V10.5"
          stroke="#e8c15a"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted">
        Entering NEXORA…
      </p>
    </main>
  );
}
