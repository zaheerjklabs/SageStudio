"use client";

import "katex/dist/katex.min.css";
import { BlockMath, InlineMath } from "react-katex";

interface FormulaProps {
  children: string;
  block?: boolean;
  className?: string;
}

export function Formula({ children, block = true, className }: FormulaProps) {
  try {
    if (block) {
      return (
        <div className={`overflow-x-auto py-2 ${className ?? ""}`}>
          <BlockMath math={children} />
        </div>
      );
    }
    return <InlineMath math={children} />;
  } catch {
    return <code className="text-sm text-[var(--muted-foreground)]">{children}</code>;
  }
}
