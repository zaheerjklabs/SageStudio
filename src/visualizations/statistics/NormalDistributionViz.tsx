"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { LabLayout } from "@/components/visualization/LabLayout";
import { Slider } from "@/components/controls/Slider";
import { NormalDistribution } from "@/algorithms/statistics/normal-distribution";
import { formatNumber } from "@/lib/utils";
import {
  drawGrid,
  drawAxes,
  createCoordSystem,
  clearCanvas,
  drawGlowCircle,
} from "@/lib/canvas";

const PSEUDOCODE = [
  "1. Define theoretical Gaussian PDF: f(x; μ, σ) = (1 / (σ√(2π))) * exp(-0.5 * ((x - μ)/σ)²)",
  "2. Sample random variables from distribution using Box-Muller transform",
  "3. Partition sample domain into discrete bins and accumulate empirical histogram",
  "4. Central Limit Theorem: As sample size N → ∞, sample mean distribution converges to Normal",
  "5. Compute cumulative probability integral: P(a ≤ X ≤ b) = Φ((b-μ)/σ) - Φ((a-μ)/σ)",
];

export default function NormalDistributionViz() {
  const [mean, setMean] = useState(0.0);
  const [stdDev, setStdDev] = useState(1.2);
  const [samples, setSamples] = useState<number[]>([]);
  const [showShadedSigma, setShowShadedSigma] = useState(true);
  const [probeZ, setProbeZ] = useState(1.0);
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(1);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const distributionRef = useRef(new NormalDistribution(mean, stdDev));
  const animTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    distributionRef.current = new NormalDistribution(mean, stdDev);
  }, [mean, stdDev]);

  // Step: accumulate 50 new samples
  const step = useCallback(() => {
    const newBatch = distributionRef.current.generateSamples(50);
    setSamples((prev) => [...prev, ...newBatch]);
    setCurrentStep((s) => s + 1);
  }, []);

  const stepBackward = useCallback(() => {
    setSamples((prev) => prev.slice(0, Math.max(0, prev.length - 50)));
    setCurrentStep((s) => Math.max(0, s - 1));
  }, []);

  // Auto-sampling loop
  useEffect(() => {
    if (isRunning && !isPaused && samples.length < 2500) {
      const delay = Math.max(30, 250 / speed);
      animTimerRef.current = setTimeout(() => {
        step();
      }, delay);
    } else if (samples.length >= 2500) {
      setIsRunning(false);
    }
    return () => {
      if (animTimerRef.current) clearTimeout(animTimerRef.current);
    };
  }, [isRunning, isPaused, samples.length, speed, step]);

  const handlePlay = () => {
    setIsRunning(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    setIsPaused(true);
    setIsRunning(false);
  };

  const handleReset = () => {
    setSamples([]);
    setCurrentStep(0);
    setIsRunning(false);
    setIsPaused(false);
  };

  // Draw Visuals
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const padding = 45;
    const xRange: [number, number] = [mean - 4 * stdDev, mean + 4 * stdDev];
    const maxPdf = distributionRef.current.pdf(mean);
    const yRange: [number, number] = [0, maxPdf * 1.25];
    const { toCanvas } = createCoordSystem(w, h, padding, xRange, yRange);

    clearCanvas(ctx, w, h);
    drawGrid(ctx, w, h, padding, xRange, yRange);
    drawAxes(ctx, w, h, padding, xRange, yRange);

    const dist = distributionRef.current;

    // Empirical Histogram of Accumulated Samples
    if (samples.length > 0) {
      const bins = 36;
      const binW = (xRange[1] - xRange[0]) / bins;
      const counts = new Array(bins).fill(0);

      samples.forEach((s) => {
        const bIdx = Math.floor((s - xRange[0]) / binW);
        if (bIdx >= 0 && bIdx < bins) counts[bIdx]++;
      });

      const maxCount = Math.max(...counts, 1);
      const scale = (maxPdf * 0.95) / maxCount;

      counts.forEach((c, i) => {
        const bx = xRange[0] + i * binW;
        const bHeight = c * scale;
        const p1 = toCanvas(bx, 0);
        const p2 = toCanvas(bx + binW, bHeight);

        ctx.fillStyle = "rgba(16, 185, 129, 0.25)";
        ctx.strokeStyle = "rgba(16, 185, 129, 0.6)";
        ctx.lineWidth = 1;

        const rx = p1.cx;
        const ry = p2.cy;
        const rw = Math.abs(toCanvas(bx + binW, 0).cx - p1.cx);
        const rh = Math.abs(p1.cy - p2.cy);

        ctx.fillRect(rx, ry, rw, rh);
        ctx.strokeRect(rx, ry, rw, rh);
      });
    }

    // Shaded Empirical Rule Sigma Regions (±1σ = 68.2%, ±2σ = 95.4%)
    if (showShadedSigma) {
      // ±1σ Region (Emerald)
      ctx.beginPath();
      let started = false;
      for (let x = mean - stdDev; x <= mean + stdDev; x += 0.05) {
        const y = dist.pdf(x);
        const { cx, cy } = toCanvas(x, y);
        if (!started) {
          ctx.moveTo(toCanvas(mean - stdDev, 0).cx, toCanvas(mean - stdDev, 0).cy);
          ctx.lineTo(cx, cy);
          started = true;
        } else {
          ctx.lineTo(cx, cy);
        }
      }
      ctx.lineTo(toCanvas(mean + stdDev, 0).cx, toCanvas(mean + stdDev, 0).cy);
      ctx.closePath();
      ctx.fillStyle = "rgba(99, 102, 241, 0.15)";
      ctx.fill();
    }

    // Theoretical Continuous Gaussian Bell Curve
    ctx.save();
    ctx.shadowColor = "rgba(99, 102, 241, 0.7)";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    let started = false;
    for (let x = xRange[0]; x <= xRange[1]; x += (xRange[1] - xRange[0]) / 200) {
      const y = dist.pdf(x);
      const { cx, cy } = toCanvas(x, y);
      if (!started) {
        ctx.moveTo(cx, cy);
        started = true;
      } else {
        ctx.lineTo(cx, cy);
      }
    }
    ctx.strokeStyle = "#6366f1";
    ctx.lineWidth = 3.5;
    ctx.stroke();
    ctx.restore();

    // Center Mean Line (μ)
    const mBot = toCanvas(mean, 0);
    const mTop = toCanvas(mean, maxPdf);
    ctx.beginPath();
    ctx.moveTo(mBot.cx, mBot.cy);
    ctx.lineTo(mTop.cx, mTop.cy);
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Sigma Marker Lines
    [-2, -1, 1, 2].forEach((k) => {
      const sx = mean + k * stdDev;
      const sy = dist.pdf(sx);
      const pt = toCanvas(sx, sy);
      drawGlowCircle(
        ctx,
        pt.cx,
        pt.cy,
        4,
        Math.abs(k) === 1 ? "#6366f1" : "#ec4899",
        "rgba(99, 102, 241, 0.6)",
        "#ffffff"
      );
    });

    // Inset Empirical Stats Box
    const boxW = 140;
    const boxH = 65;
    const boxX = w - padding - boxW;
    const boxY = padding + 8;

    ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
    ctx.strokeStyle = "rgba(148, 163, 184, 0.25)";
    ctx.lineWidth = 1;
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 9.5px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Empirical 68-95-99 Rule", boxX + 8, boxY + 14);

    ctx.fillStyle = "#6366f1";
    ctx.font = "9px monospace";
    ctx.fillText("±1σ: 68.27% (μ ± σ)", boxX + 8, boxY + 29);

    ctx.fillStyle = "#ec4899";
    ctx.fillText("±2σ: 95.45% (μ ± 2σ)", boxX + 8, boxY + 44);

    ctx.fillStyle = "rgba(148, 163, 184, 0.9)";
    ctx.fillText("±3σ: 99.73% (μ ± 3σ)", boxX + 8, boxY + 58);
  }, [mean, stdDev, samples, showShadedSigma]);

  useEffect(() => {
    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [draw]);

  // Compute Empirical Sample Mean & Variance
  const empiricalMean =
    samples.length > 0 ? samples.reduce((a, b) => a + b, 0) / samples.length : mean;
  const empiricalStd =
    samples.length > 1
      ? Math.sqrt(
          samples.reduce((acc, s) => acc + (s - empiricalMean) ** 2, 0) / (samples.length - 1)
        )
      : stdDev;

  const probWithin1Sigma =
    distributionRef.current.cdf(mean + stdDev) - distributionRef.current.cdf(mean - stdDev);
  const probWithin2Sigma =
    distributionRef.current.cdf(mean + 2 * stdDev) - distributionRef.current.cdf(mean - 2 * stdDev);

  return (
    <LabLayout
      algorithmId="normal-distribution"
      title="Normal (Gaussian) Distribution"
      subtitle="Explore continuous probability densities, empirical sample convergence, and the 68-95-99.7 rule."
      currentStep={currentStep}
      maxSteps={50}
      isConverged={samples.length >= 2000}
      statusMessage={`Accumulated ${samples.length} Samples · Sample Mean x̄ = ${formatNumber(empiricalMean, 3)} (True μ = ${mean}) · Sample s = ${formatNumber(empiricalStd, 3)}`}
      stepPhase={`Sample Accumulation: ${samples.length} draws`}
      playbackSpeed={speed}
      onStep={step}
      onStepBackward={stepBackward}
      onRun={handlePlay}
      onPause={handlePause}
      onReset={handleReset}
      onSpeedChange={setSpeed}
      pseudocode={PSEUDOCODE}
      activePseudocodeLine={samples.length > 0 ? 3 : 0}
      canvasRef={canvasRef}
      datasetToExport={{
        mean,
        stdDev,
        sampleCount: samples.length,
        empiricalMean,
        empiricalStd,
        samples,
      }}
      visualization={
        <div className="relative w-full h-full">
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            aria-label="Normal distribution density canvas"
          />
          <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] text-slate-300 pointer-events-none border border-white/10">
            Blue Curve = Theoretical PDF · Green Bars = Sample Histogram
          </div>
        </div>
      }
      controls={
        <>
          <Slider
            label="Distribution Mean (μ)"
            value={mean}
            min={-3}
            max={3}
            step={0.1}
            onChange={setMean}
            tooltip="Center of probability mass / expected value"
          />
          <Slider
            label="Standard Deviation (σ)"
            value={stdDev}
            min={0.4}
            max={2.5}
            step={0.1}
            onChange={setStdDev}
            tooltip="Spread / variance parameter controlling bell curve width"
          />
          <div className="pt-2 border-t border-[var(--border)]">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
              <input
                type="checkbox"
                checked={showShadedSigma}
                onChange={(e) => setShowShadedSigma(e.target.checked)}
                className="rounded text-[var(--accent)]"
              />
              Shade ±1σ Confidence Interval (68.2%)
            </label>
          </div>
        </>
      }
      metrics={[
        { label: "Sample Count", value: samples.length, highlight: true },
        { label: "Sample Mean x̄", value: formatNumber(empiricalMean, 3), highlight: true },
        { label: "Sample Std Dev (s)", value: formatNumber(empiricalStd, 3) },
        { label: "P(μ-σ ≤ X ≤ μ+σ)", value: `${(probWithin1Sigma * 100).toFixed(1)}%` },
      ]}
      explanations={[
        {
          title: "Gaussian Probability Density Function (PDF)",
          content:
            "The bell-shaped normal distribution is parameterized by its mean μ and variance σ². Total area under the curve equals 1.",
          latex: "f(x; \\mu, \\sigma) = \\frac{1}{\\sigma \\sqrt{2\\pi}} \\exp\\left( -\\frac{1}{2}\\left( \\frac{x - \\mu}{\\sigma} \\right)^2 \\right)",
        },
        {
          title: "Central Limit Theorem (CLT)",
          content:
            "The distribution of sample means approximates a normal distribution as sample size increases, regardless of the underlying population distribution.",
          latex: "\\bar{X}_n \\xrightarrow{d} \\mathcal{N}\\left( \\mu, \\frac{\\sigma^2}{n} \\right)",
        },
      ]}
    />
  );
}
