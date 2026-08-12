import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  showTagline?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: "w-7 h-7",
  md: "w-8 h-8",
  lg: "w-12 h-12",
};

export function Logo({ showTagline = true, size = "md", className }: LogoProps) {
  return (
    <Link
      href="/"
      className={cn("flex items-center gap-2.5 group", className)}
      aria-label="SageStudio home"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo.svg"
        alt="SageStudio"
        className={cn(sizes[size], "rounded-lg shrink-0")}
      />
      <div className="flex flex-col">
        <span className="text-base font-semibold tracking-tight text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
          SageStudio
        </span>
        {showTagline && (
          <span className="text-[10px] text-[var(--muted)] leading-none">by ZaheerJKLabs</span>
        )}
      </div>
    </Link>
  );
}
