import Link from "next/link";

export function Logo({ showTagline = true }: { showTagline?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5 group">
      <div className="relative w-8 h-8">
        <svg viewBox="0 0 32 32" fill="none" className="w-8 h-8">
          <path
            d="M6 24 C6 24 8 8 16 8 C24 8 26 24 26 24"
            stroke="url(#footerLogoGrad)"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="10" cy="16" r="2" fill="var(--accent)" opacity="0.8" />
          <circle cx="16" cy="12" r="2" fill="var(--sage)" opacity="0.8" />
          <circle cx="22" cy="16" r="2" fill="var(--accent)" opacity="0.8" />
          <defs>
            <linearGradient id="footerLogoGrad" x1="6" y1="8" x2="26" y2="24">
              <stop stopColor="var(--accent)" />
              <stop offset="1" stopColor="var(--sage)" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      <div className="flex flex-col">
        <span className="text-base font-semibold tracking-tight text-[var(--foreground)]">
          SageStudio
        </span>
        {showTagline && (
          <span className="text-[10px] text-[var(--muted)] leading-none">by ZaheerJKLabs</span>
        )}
      </div>
    </Link>
  );
}
