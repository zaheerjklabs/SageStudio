import { cn } from "@/lib/utils";
import { Info } from "lucide-react";

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  tooltip?: string;
  formatValue?: (value: number) => string;
  className?: string;
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 0.01,
  onChange,
  tooltip,
  formatValue,
  className,
}: SliderProps) {
  const display = formatValue ? formatValue(value) : value.toFixed(step < 1 ? 2 : 0);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-[var(--foreground)] flex items-center gap-1.5">
          {label}
          {tooltip && (
            <span title={tooltip} className="text-[var(--muted)] cursor-help">
              <Info className="w-3.5 h-3.5" />
            </span>
          )}
        </label>
        <span className="text-xs font-mono text-[var(--accent)] tabular-nums">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-[var(--border)] accent-[var(--accent)]"
        aria-label={label}
      />
      <div className="flex justify-between text-[10px] text-[var(--muted)] font-mono">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
