"use client";

import { useEffect, useState, useRef, useCallback, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { MetricCard } from "@/components/ui/Card";
import { Formula } from "@/components/ui/Formula";
import {
  RotateCcw,
  Shuffle,
  Play,
  Pause,
  SkipForward,
  BookOpen,
  ChevronRight,
  Star,
  Camera,
  Download,
  Code2,
  Trophy,
  Sparkles,
  Info,
} from "lucide-react";
import { useFavoritesStore } from "@/store/favorites";
import type { MetricItem, ExplanationSection, StepItem } from "@/types";
import { cn } from "@/lib/utils";
import { StepController } from "./StepController";
import { exportCanvasAsPNG, exportSVGAsPNG, exportDataAsJSON } from "@/lib/export";
import { soundManager } from "@/lib/audio";

interface LabLayoutProps {
  algorithmId: string;
  title: string;
  subtitle: string;
  visualization: ReactNode;
  controls: ReactNode;
  metrics: MetricItem[];
  explanations: ExplanationSection[];
  pseudocode?: string[];
  activePseudocodeLine?: number;
  steps?: StepItem[];
  currentStep?: number;
  maxSteps?: number;
  isRunning?: boolean;
  isPaused?: boolean;
  isConverged?: boolean;
  statusMessage?: string;
  stepPhase?: string;
  playbackSpeed?: number;
  onNextStep?: () => void;
  onReset?: () => void;
  onRandomize?: () => void;
  onRun?: () => void;
  onPause?: () => void;
  onStep?: () => void;
  onStepBackward?: () => void;
  onFastForward?: () => void;
  onSpeedChange?: (speed: number) => void;
  isTraining?: boolean;
  showStepMode?: boolean;
  stepModeActive?: boolean;
  onToggleStepMode?: () => void;
  canvasRef?: React.RefObject<HTMLCanvasElement | null>;
  svgRef?: React.RefObject<SVGSVGElement | null>;
  datasetToExport?: unknown;
}

export function LabLayout({
  algorithmId,
  title,
  subtitle,
  visualization,
  controls,
  metrics,
  explanations,
  pseudocode,
  activePseudocodeLine = -1,
  steps,
  currentStep = 0,
  maxSteps = 50,
  isRunning = false,
  isPaused = false,
  isConverged = false,
  statusMessage,
  stepPhase,
  playbackSpeed = 1,
  onNextStep,
  onReset,
  onRandomize,
  onRun,
  onPause,
  onStep,
  onStepBackward,
  onFastForward,
  onSpeedChange,
  isTraining,
  showStepMode,
  stepModeActive,
  onToggleStepMode,
  canvasRef,
  svgRef,
  datasetToExport,
}: LabLayoutProps) {
  const { isFavorite, addFavorite, removeFavorite, addRecentlyViewed } = useFavoritesStore();
  const favorited = isFavorite(algorithmId);
  const [activeTab, setActiveTab] = useState<"theory" | "code">("theory");
  const [hasCelebrated, setHasCelebrated] = useState(false);

  useEffect(() => {
    addRecentlyViewed(algorithmId);
  }, [algorithmId, addRecentlyViewed]);

  useEffect(() => {
    if (isConverged && !hasCelebrated) {
      soundManager.playConvergenceSound();
      setHasCelebrated(true);
    } else if (!isConverged) {
      setHasCelebrated(false);
    }
  }, [isConverged, hasCelebrated]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or select
      if (
        document.activeElement?.tagName === "INPUT" ||
        document.activeElement?.tagName === "SELECT" ||
        document.activeElement?.tagName === "TEXTAREA"
      ) {
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        if (isRunning || isTraining) {
          onPause?.();
        } else {
          onRun?.();
        }
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        onStep?.();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        onStepBackward?.();
      } else if (e.code === "KeyR" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        onReset?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRunning, isTraining, onPause, onRun, onStep, onStepBackward, onReset]);

  const toggleFavorite = () => {
    if (favorited) removeFavorite(algorithmId);
    else addFavorite(algorithmId);
  };

  const handleExportSnapshot = () => {
    if (canvasRef?.current) {
      exportCanvasAsPNG(canvasRef.current, `${algorithmId}-snapshot.png`);
    } else if (svgRef?.current) {
      exportSVGAsPNG(svgRef.current, `${algorithmId}-diagram.png`);
    } else {
      // Look for first canvas or svg on page
      const c = document.querySelector("canvas");
      if (c) exportCanvasAsPNG(c, `${algorithmId}-snapshot.png`);
    }
  };

  const handleExportData = () => {
    const exportPayload = {
      algorithm: algorithmId,
      title,
      timestamp: new Date().toISOString(),
      currentStep,
      metrics,
      data: datasetToExport || null,
    };
    exportDataAsJSON(exportPayload, `${algorithmId}-data.json`);
  };

  const activeRunning = isRunning || (isTraining ?? false);

  return (
    <div className="min-h-screen pt-16 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header Bar */}
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

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {onRandomize && (
                <Button variant="outline" size="sm" onClick={onRandomize}>
                  <Shuffle className="w-3.5 h-3.5" />
                  Randomize Data
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleExportSnapshot} title="Export PNG Snapshot (E)">
                <Camera className="w-3.5 h-3.5" />
                Snapshot
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportData} title="Export Dataset as JSON">
                <Download className="w-3.5 h-3.5" />
                Export
              </Button>
              {showStepMode && onToggleStepMode && (
                <Button
                  variant={stepModeActive ? "primary" : "outline"}
                  size="sm"
                  onClick={onToggleStepMode}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Guided Mode
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Guided Step Walkthrough (Optional Step Mode) */}
        {stepModeActive && steps && steps.length > 0 && (
          <div className="mb-6 rounded-2xl border border-[var(--accent)]/40 bg-[var(--accent-muted)] p-5 shadow-lg animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-[var(--accent)] text-white text-xs font-bold">
                  Step {currentStep + 1} / {steps.length}
                </span>
                <h3 className="text-base font-semibold">{steps[currentStep]?.title}</h3>
              </div>
              {onNextStep && currentStep < steps.length - 1 && (
                <Button variant="primary" size="sm" onClick={onNextStep}>
                  Next Concept <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
            <p className="text-sm text-[var(--muted-foreground)] leading-relaxed mb-2">
              {steps[currentStep]?.description}
            </p>
            {steps[currentStep]?.latex && <Formula>{steps[currentStep].latex!}</Formula>}
          </div>
        )}

        {/* Convergence Celebration Card */}
        {isConverged && (
          <div className="mb-6 rounded-2xl border border-emerald-500/40 bg-emerald-950/20 backdrop-blur-md p-5 shadow-xl flex items-center justify-between flex-wrap gap-4 animate-in zoom-in-95 duration-300">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-emerald-300 flex items-center gap-2">
                  Optimization Converged! <Sparkles className="w-4 h-4 text-emerald-400" />
                </h3>
                <p className="text-xs text-emerald-200/80">
                  Target criteria or loss tolerance reached at step {currentStep}.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {onReset && (
                <Button variant="outline" size="sm" onClick={onReset} className="border-emerald-500/30 hover:bg-emerald-500/10">
                  <RotateCcw className="w-3.5 h-3.5" /> Re-run
                </Button>
              )}
              {onRandomize && (
                <Button variant="primary" size="sm" onClick={onRandomize} className="bg-emerald-600 hover:bg-emerald-500 text-white">
                  <Shuffle className="w-3.5 h-3.5" /> Try New Dataset
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Step-by-Step Interactive Controller Suite */}
        <div className="mb-6">
          <StepController
            currentStep={currentStep}
            maxSteps={maxSteps}
            isRunning={activeRunning}
            isPaused={isPaused}
            isConverged={isConverged}
            statusMessage={statusMessage}
            stepPhase={stepPhase}
            playbackSpeed={playbackSpeed}
            onStepForward={onStep}
            onStepBackward={onStepBackward}
            onPlay={onRun}
            onPause={onPause}
            onFastForward={onFastForward}
            onReset={onReset}
            onSpeedChange={onSpeedChange}
            onExportSnapshot={handleExportSnapshot}
            onExportData={handleExportData}
          />
        </div>

        {/* Main Content - Side by Side Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
          {/* Left Column (5 cols) - Controls & Metrics */}
          <div className="lg:col-span-5 space-y-6">
            {/* Controls Panel */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-md">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)] mb-4 flex items-center gap-2">
                <span>Simulation Hyperparameters</span>
              </h3>
              <div className="space-y-4">{controls}</div>
            </div>

            {/* Metrics Panel */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-md">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted-foreground)] mb-4 flex items-center gap-2">
                <span>Real-Time State & Metrics</span>
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {metrics.map((m) => (
                  <MetricCard key={m.label} label={m.label} value={m.value} highlight={m.highlight} />
                ))}
              </div>
            </div>
          </div>

          {/* Right Column (7 cols) - Visual Canvas */}
          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden shadow-xl sticky top-20">
              <div className="aspect-square relative w-full flex items-center justify-center bg-[var(--background)]">
                {visualization}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Theory & Pseudocode Tabs */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-md">
          {/* Tabs Navigation */}
          <div className="flex items-center gap-3 border-b border-[var(--border)] pb-4 mb-6">
            <button
              onClick={() => setActiveTab("theory")}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all",
                activeTab === "theory"
                  ? "bg-[var(--accent)] text-white shadow-md shadow-[var(--accent)]/20"
                  : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)]"
              )}
            >
              <Info className="w-4 h-4" />
              Mathematical Theory & Mechanics
            </button>

            {pseudocode && pseudocode.length > 0 && (
              <button
                onClick={() => setActiveTab("code")}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 transition-all",
                  activeTab === "code"
                    ? "bg-[var(--accent)] text-white shadow-md shadow-[var(--accent)]/20"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)]"
                )}
              >
                <Code2 className="w-4 h-4" />
                Live Pseudocode Execution
              </button>
            )}
          </div>

          {/* Theory Tab */}
          {activeTab === "theory" && (
            <div className="space-y-6">
              {explanations.map((section) => (
                <div key={section.title} className="rounded-xl border border-[var(--border)]/70 bg-[var(--background)]/60 p-5">
                  <h3 className="text-base font-bold mb-2 text-[var(--foreground)]">{section.title}</h3>
                  <p className="text-sm text-[var(--muted-foreground)] leading-relaxed mb-3">{section.content}</p>
                  {section.latex && <Formula>{section.latex}</Formula>}
                </div>
              ))}
            </div>
          )}

          {/* Live Pseudocode Tab */}
          {activeTab === "code" && pseudocode && (
            <div className="rounded-xl border border-[var(--border)] bg-[#0d1117] p-5 font-mono text-xs overflow-x-auto text-slate-200">
              <div className="space-y-1.5">
                {pseudocode.map((line, idx) => {
                  const isCurrent = activePseudocodeLine === idx;
                  return (
                    <div
                      key={idx}
                      className={cn(
                        "px-3 py-1.5 rounded-lg flex items-center gap-3 transition-all",
                        isCurrent
                          ? "bg-indigo-600/30 border border-indigo-500 text-indigo-200 font-bold shadow-[0_0_12px_rgba(99,102,241,0.3)]"
                          : "opacity-75 hover:opacity-100"
                      )}
                    >
                      <span className="text-slate-500 select-none w-6 text-right">{idx + 1}</span>
                      <span>{line}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
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
