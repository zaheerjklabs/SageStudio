"use client";

import { useRef, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { MetricCard } from "@/components/ui/Card";
import { Formula } from "@/components/ui/Formula";
import {
  RotateCcw,
  Shuffle,
  Play,
  Pause,
  SkipForward,
  Square,
  BookOpen,
  ChevronRight,
  Star,
} from "lucide-react";
import { useFavoritesStore } from "@/store/favorites";
import type { MetricItem, ExplanationSection, StepItem } from "@/types";
import { cn } from "@/lib/utils";

interface LabLayoutProps {
  algorithmId: string;
  title: string;
  subtitle: string;
  visualization: ReactNode;
  controls: ReactNode;
  metrics: MetricItem[];
  explanations: ExplanationSection[];
  steps?: StepItem[];
  currentStep?: number;
  onNextStep?: () => void;
  onReset?: () => void;
  onRandomize?: () => void;
  onRun?: () => void;
  onPause?: () => void;
  onStep?: () => void;
  onRestart?: () => void;
  isTraining?: boolean;
  isPaused?: boolean;
  showStepMode?: boolean;
  stepModeActive?: boolean;
  onToggleStepMode?: () => void;
}

export function LabLayout({
  algorithmId,
  title,
  subtitle,
  visualization,
  controls,
  metrics,
  explanations,
  steps,
  currentStep = 0,
  onNextStep,
  onReset,
  onRandomize,
  onRun,
  onPause,
  onStep,
  onRestart,
  isTraining,
  isPaused,
  showStepMode,
  stepModeActive,
  onToggleStepMode,
}: LabLayoutProps) {
  const { isFavorite, addFavorite, removeFavorite, addRecentlyViewed } =
    useFavoritesStore();
  const favorited = isFavorite(algorithmId);

  useEffect(() => {
    addRecentlyViewed(algorithmId);
  }, [algorithmId, addRecentlyViewed]);

  const toggleFavorite = () => {
    if (favorited) removeFavorite(algorithmId);
    else addFavorite(algorithmId);
  };

  return (
    <div className="min-h-screen pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
                <button
                  onClick={toggleFavorite}
                  className="p-1.5 rounded-lg hover:bg-[var(--card-hover)] transition-colors"
                  aria-label={favorited ? "Remove from favorites" : "Add to favorites"}
                >
                  <Star
                    className={cn(
                      "w-5 h-5",
                      favorited ? "fill-[var(--warning)] text-[var(--warning)]" : "text-[var(--muted)]"
                    )}
                  />
                </button>
              </div>
              <p className="mt-1 text-[var(--muted-foreground)]">{subtitle}</p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {onReset && (
                <Button variant="outline" size="sm" onClick={onReset}>
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset
                </Button>
              )}
              {onRandomize && (
                <Button variant="outline" size="sm" onClick={onRandomize}>
                  <Shuffle className="w-3.5 h-3.5" />
                  Randomize
                </Button>
              )}
              {onRun && (
                <Button variant="primary" size="sm" onClick={isTraining && !isPaused ? onPause : onRun}>
                  {isTraining && !isPaused ? (
                    <><Pause className="w-3.5 h-3.5" /> Pause</>
                  ) : (
                    <><Play className="w-3.5 h-3.5" /> Run</>
                  )}
                </Button>
              )}
              {onStep && (
                <Button variant="outline" size="sm" onClick={onStep}>
                  <SkipForward className="w-3.5 h-3.5" />
                  Step
                </Button>
              )}
              {onRestart && (
                <Button variant="ghost" size="sm" onClick={onRestart}>
                  <Square className="w-3.5 h-3.5" />
                  Restart
                </Button>
              )}
              {showStepMode && onToggleStepMode && (
                <Button
                  variant={stepModeActive ? "primary" : "outline"}
                  size="sm"
                  onClick={onToggleStepMode}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Learn Step-by-Step
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Step-by-step mode */}
        {stepModeActive && steps && steps.length > 0 && (
          <div className="mb-6 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent-muted)] p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold">
                Step {currentStep + 1} of {steps.length}: {steps[currentStep]?.title}
              </h3>
              {onNextStep && currentStep < steps.length - 1 && (
                <Button variant="primary" size="sm" onClick={onNextStep}>
                  Next Step <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
            <p className="text-sm text-[var(--muted-foreground)]">{steps[currentStep]?.description}</p>
            {steps[currentStep]?.latex && <Formula>{steps[currentStep].latex!}</Formula>}
          </div>
        )}

        {/* Main visualization */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] overflow-hidden mb-6">
          <div className="aspect-[16/10] sm:aspect-[16/9] relative">
            {visualization}
          </div>
        </div>

        {/* Controls + Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <h3 className="text-sm font-semibold mb-4 text-[var(--muted-foreground)] uppercase tracking-wider">
              Controls
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">{controls}</div>
          </div>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5">
            <h3 className="text-sm font-semibold mb-4 text-[var(--muted-foreground)] uppercase tracking-wider">
              Metrics
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {metrics.map((m) => (
                <MetricCard key={m.label} label={m.label} value={m.value} highlight={m.highlight} />
              ))}
            </div>
          </div>
        </div>

        {/* Explanations */}
        <div className="space-y-4">
          {explanations.map((section) => (
            <div
              key={section.title}
              className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5"
            >
              <h3 className="text-sm font-semibold mb-2">{section.title}</h3>
              <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">{section.content}</p>
              {section.latex && <Formula>{section.latex}</Formula>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function useCanvas(
  draw: (ctx: CanvasRenderingContext2D, width: number, height: number) => void,
  deps: unknown[]
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    draw(ctx, rect.width, rect.height);
  }, [draw]);

  useEffect(() => {
    render();
    const onResize = () => render();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [render, ...deps]);

  const startAnimation = useCallback(
    (loop: (ctx: CanvasRenderingContext2D, w: number, h: number, t: number) => void) => {
      const animate = (t: number) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const rect = canvas.getBoundingClientRect();
        loop(ctx, rect.width, rect.height, t);
        animRef.current = requestAnimationFrame(animate);
      };
      animRef.current = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(animRef.current);
    },
    []
  );

  const stopAnimation = useCallback(() => {
    cancelAnimationFrame(animRef.current);
  }, []);

  return { canvasRef, render, startAnimation, stopAnimation };
}
