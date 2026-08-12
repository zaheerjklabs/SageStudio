import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function Card({ children, className, hover }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--border)] bg-[var(--card)] p-5",
        hover && "transition-colors hover:bg-[var(--card-hover)] hover:border-[var(--accent)]/30 cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string | number;
  highlight?: boolean;
}

export function MetricCard({ label, value, highlight }: MetricCardProps) {
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3">
      <p className="text-xs text-[var(--muted-foreground)] mb-1">{label}</p>
      <p
        className={cn(
          "text-lg font-mono font-semibold tabular-nums",
          highlight ? "text-[var(--accent)]" : "text-[var(--foreground)]"
        )}
      >
        {value}
      </p>
    </div>
  );
}
