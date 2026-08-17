"use client";

import React, { useState, useEffect } from "react";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  FastForward,
  RotateCcw,
  Volume2,
  VolumeX,
  Camera,
  Download,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { soundManager } from "@/lib/audio";
import { cn } from "@/lib/utils";

export interface StepControllerProps {
  currentStep: number;
  maxSteps?: number;
  isRunning?: boolean;
  isPaused?: boolean;
  isConverged?: boolean;
  statusMessage?: string;
  stepPhase?: string;
  playbackSpeed?: number; // 0.25, 0.5, 1, 2, 5
  onStepForward?: () => void;
  onStepBackward?: () => void;
  onPlay?: () => void;
  onPause?: () => void;
  onFastForward?: () => void;
  onReset?: () => void;
  onSpeedChange?: (speed: number) => void;
  onExportSnapshot?: () => void;
  onExportData?: () => void;
  className?: string;
}

const SPEED_OPTIONS = [
  { label: "0.25x", value: 0.25 },
  { label: "0.5x", value: 0.5 },
  { label: "1x", value: 1 },
  { label: "2x", value: 2 },
  { label: "5x", value: 5 },
];

export function StepController({
  currentStep,
  maxSteps = 50,
  isRunning = false,
  isPaused = false,
  isConverged = false,
  statusMessage,
  stepPhase,
  playbackSpeed = 1,
  onStepForward,
  onStepBackward,
  onPlay,
  onPause,
  onFastForward,
  onReset,
  onSpeedChange,
  onExportSnapshot,
  onExportData,
  className,
}: StepControllerProps) {
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    setIsMuted(soundManager.isMuted());
  }, []);

  const toggleMute = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  const handleStep = () => {
    soundManager.playStepSound();
    onStepForward?.();
  };

  const progressPercent = Math.min(100, Math.max(0, (currentStep / maxSteps) * 100));

  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--border)] bg-[var(--card)]/90 backdrop-blur-md p-4 sm:p-5 shadow-xl transition-all",
        className
      )}
    >
      {/* Progress & Status Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[var(--accent)]/15 text-[var(--accent)] border border-[var(--accent)]/20">
            Step {currentStep} {maxSteps ? `/ ${maxSteps}` : ""}
          </span>

          {isConverged ? (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Converged
            </span>
          ) : isRunning && !isPaused ? (
            <span className="flex items-center gap-1.5 text-xs font-medium text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-full animate-pulse">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
              Computing...
            </span>
          ) : (
            <span className="text-xs font-medium text-[var(--muted-foreground)] bg-[var(--card-hover)] px-2.5 py-1 rounded-full">
              Ready
            </span>
          )}

          {stepPhase && (
            <span className="text-xs font-medium text-[var(--foreground)]/80 italic">
              {stepPhase}
            </span>
          )}
        </div>

        {/* Action Tools: Sound, Export */}
        <div className="flex items-center gap-1.5">
          {onExportSnapshot && (
            <button
              onClick={onExportSnapshot}
              title="Save Snapshot (PNG)"
              className="p-2 rounded-lg border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--card-hover)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors text-xs flex items-center gap-1.5"
            >
              <Camera className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Snapshot</span>
            </button>
          )}

          {onExportData && (
            <button
              onClick={onExportData}
              title="Export Dataset & Metrics"
              className="p-2 rounded-lg border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--card-hover)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors text-xs flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Data</span>
            </button>
          )}

          <button
            onClick={toggleMute}
            title={isMuted ? "Unmute Sound FX" : "Mute Sound FX"}
            className="p-2 rounded-lg border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--card-hover)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Interactive Step Progress Timeline */}
      <div className="w-full bg-[var(--border)]/50 rounded-full h-2 mb-4 overflow-hidden relative">
        <div
          className={cn(
            "h-full transition-all duration-300 rounded-full",
            isConverged
              ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]"
              : "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 shadow-[0_0_12px_rgba(99,102,241,0.5)]"
          )}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Control Buttons Suite */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          {/* Reset Button */}
          {onReset && (
            <button
              onClick={onReset}
              title="Reset Simulation (R)"
              className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--card-hover)] text-[var(--foreground)] hover:border-[var(--border-hover)] transition-all active:scale-95"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          {/* Step Backward Button */}
          {onStepBackward && (
            <button
              onClick={onStepBackward}
              disabled={currentStep <= 0 || isRunning}
              title="Step Backward (Left Arrow)"
              className={cn(
                "p-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] transition-all active:scale-95",
                currentStep <= 0 || isRunning
                  ? "opacity-40 cursor-not-allowed"
                  : "hover:bg-[var(--card-hover)] hover:border-[var(--border-hover)]"
              )}
            >
              <SkipBack className="w-4 h-4" />
            </button>
          )}

          {/* Play / Pause Toggle Button */}
          {(onPlay || onPause) && (
            <button
              onClick={isRunning && !isPaused ? onPause : onPlay}
              disabled={isConverged}
              title="Play / Pause (Space)"
              className={cn(
                "px-4 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all active:scale-95 shadow-md",
                isConverged
                  ? "opacity-50 cursor-not-allowed bg-emerald-600 text-white"
                  : isRunning && !isPaused
                  ? "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20"
                  : "bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white shadow-[var(--accent)]/25"
              )}
            >
              {isRunning && !isPaused ? (
                <>
                  <Pause className="w-4 h-4" /> Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" /> {currentStep > 0 ? "Resume" : "Auto-Step"}
                </>
              )}
            </button>
          )}

          {/* Step Forward Button */}
          {onStepForward && (
            <button
              onClick={handleStep}
              disabled={isConverged || (isRunning && !isPaused)}
              title="Step Forward (Right Arrow)"
              className={cn(
                "px-3.5 py-2.5 rounded-xl font-medium text-sm border border-[var(--border)] bg-[var(--background)] flex items-center gap-1.5 transition-all active:scale-95",
                isConverged || (isRunning && !isPaused)
                  ? "opacity-40 cursor-not-allowed"
                  : "hover:bg-[var(--card-hover)] hover:border-[var(--accent)] text-[var(--foreground)]"
              )}
            >
              <SkipForward className="w-4 h-4 text-[var(--accent)]" />
              <span>Step</span>
            </button>
          )}

          {/* Fast Forward / Run to Complete */}
          {onFastForward && (
            <button
              onClick={onFastForward}
              disabled={isConverged}
              title="Fast-Forward to Completion"
              className={cn(
                "p-2.5 rounded-xl border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] transition-all active:scale-95",
                isConverged
                  ? "opacity-40 cursor-not-allowed"
                  : "hover:bg-[var(--card-hover)] hover:border-[var(--accent)]"
              )}
            >
              <FastForward className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Speed Controls */}
        {onSpeedChange && (
          <div className="flex items-center gap-1.5 bg-[var(--background)] p-1 rounded-xl border border-[var(--border)]">
            <span className="text-[10px] uppercase font-bold text-[var(--muted-foreground)] px-2">
              Speed
            </span>
            {SPEED_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => onSpeedChange(opt.value)}
                className={cn(
                  "px-2 py-1 rounded-lg text-xs font-semibold transition-all",
                  playbackSpeed === opt.value
                    ? "bg-[var(--accent)] text-white shadow-sm"
                    : "text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)]"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Dynamic Status / Step Message Footer */}
      {statusMessage && (
        <div className="mt-3 text-xs text-[var(--muted-foreground)] flex items-center gap-2 border-t border-[var(--border)]/50 pt-2.5">
          <Sparkles className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}
    </div>
  );
}
