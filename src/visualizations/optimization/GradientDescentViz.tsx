"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { LabLayout } from "@/components/visualization/LabLayout";
import { Slider } from "@/components/controls/Slider";
import { formatNumber } from "@/lib/utils";
import { drawGrid, drawAxes, createCoordSystem, clearCanvas, drawVectorArrow, drawGlowCircle } from "@/lib/canvas";

export type OptimizerType = "gd" | "sgd" | "momentum" | "rmsprop" | "adam";
export type LossSurface = "quadratic" | "rosenbrock" | "saddle" | "beale";

interface LandscapePoint {
  x: number;
  y: number;
  z: number;
}

const SURFACES: { label: string; value: LossSurface; desc: string }[] = [
  { label: "Anisotropic Bowl", value: "quadratic", desc: "f(x,y) = x² + 10y² (Ill-conditioned valley)" },
  { label: "Rosenbrock (Banana)", value: "rosenbrock", desc: "f(x,y) = (1-x)² + 10(y-x²)² (Curved narrow valley)" },
  { label: "Saddle Point", value: "saddle", desc: "f(x,y) = x² - y² (Escaping zero-gradient inflection)" },
  { label: "Beale Function", value: "beale", desc: "Multi-modal landscape with flat regions & sharp corners" },
];

const OPTIMIZERS: { label: string; value: OptimizerType }[] = [
  { label: "Vanilla GD", value: "gd" },
  { label: "SGD + Noise", value: "sgd" },
  { label: "Momentum (β=0.9)", value: "momentum" },
  { label: "RMSProp (β=0.99)", value: "rmsprop" },
  { label: "Adam", value: "adam" },
];

const PSEUDOCODE = [
  "1. Evaluate loss J(θ_t) and compute gradient g_t = ∇_θ J(θ_t)",
  "2. Update first moment (velocity): m_t = β_1 * m_{t-1} + (1 - β_1) * g_t",
  "3. Update second moment (variance): v_t = β_2 * v_{t-1} + (1 - β_2) * g_t²",
  "4. Compute bias-corrected estimates: m̂_t = m_t / (1 - β_1^t),  v̂_t = v_t / (1 - β_2^t)",
  "5. Update parameters: θ_{t+1} = θ_t - (α / (√v̂_t + ε)) * m̂_t",
];

function evaluateSurface(x: number, y: number, surface: LossSurface): { z: number; gx: number; gy: number } {
  if (surface === "quadratic") {
    return {
      z: x * x + 10 * y * y,
      gx: 2 * x,
      gy: 20 * y,
    };
  } else if (surface === "rosenbrock") {
    // Scaled Rosenbrock for stability
    const a = 1;
    const b = 10;
    const z = (a - x) ** 2 + b * (y - x ** 2) ** 2;
    const gx = -2 * (a - x) - 4 * b * x * (y - x ** 2);
    const gy = 2 * b * (y - x ** 2);
    return { z, gx, gy };
  } else if (surface === "saddle") {
    return {
      z: x * x - y * y,
      gx: 2 * x,
      gy: -2 * y,
    };
  } else {
    // Beale function
    const t1 = 1.5 - x + x * y;
    const t2 = 2.25 - x + x * y * y;
    const t3 = 2.625 - x + x * y * y * y;
    const z = (t1 * t1 + t2 * t2 + t3 * t3) * 0.1;
    const gx = (2 * t1 * (-1 + y) + 2 * t2 * (-1 + y * y) + 2 * t3 * (-1 + y * y * y)) * 0.1;
    const gy = (2 * t1 * x + 2 * t2 * (2 * x * y) + 2 * t3 * (3 * x * y * y)) * 0.1;
    return { z, gx, gy };
  }
}

interface StepHistory {
  x: number;
  y: number;
  loss: number;
  vx: number;
  vy: number;
  sx: number;
  sy: number;
}

export default function GradientDescentViz() {
  const [learningRate, setLearningRate] = useState(0.04);
  const [optimizer, setOptimizer] = useState<OptimizerType>("adam");
  const [surface, setSurface] = useState<LossSurface>("quadratic");
  const [startX, setStartX] = useState(3.2);
  const [startY, setStartY] = useState(2.2);

  const [currentX, setCurrentX] = useState(3.2);
  const [currentY, setCurrentY] = useState(2.2);
  const [path, setPath] = useState<{ x: number; y: number; loss: number }[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isConverged, setIsConverged] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [activeCodeLine, setActiveCodeLine] = useState(0);

  // Optimizer state accumulators
  const optState = useRef({
    vx: 0,
    vy: 0,
    sx: 0,
    sy: 0,
    t: 0,
  });

  const historyStackRef = useRef<StepHistory[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetSimulation = useCallback(() => {
    if (animTimerRef.current) clearTimeout(animTimerRef.current);
    setIsRunning(false);
    setIsPaused(false);
    setIsConverged(false);
    setCurrentStep(0);
    setActiveCodeLine(0);

    setCurrentX(startX);
    setCurrentY(startY);
    const { z } = evaluateSurface(startX, startY, surface);
    setPath([{ x: startX, y: startY, loss: z }]);
    optState.current = { vx: 0, vy: 0, sx: 0, sy: 0, t: 0 };
    historyStackRef.current = [];
  }, [startX, startY, surface]);

  useEffect(() => {
    resetSimulation();
  }, [resetSimulation]);

  // Execute 1 Optimization Step
  const step = useCallback(() => {
    if (isConverged) return;

    const { z, gx: rawGx, gy: rawGy } = evaluateSurface(currentX, currentY, surface);
    let gx = rawGx;
    let gy = rawGy;

    // Add noise for SGD
    if (optimizer === "sgd") {
      gx += (Math.random() - 0.5) * 1.5;
      gy += (Math.random() - 0.5) * 1.5;
    }

    // Save history snapshot
    historyStackRef.current.push({
      x: currentX,
      y: currentY,
      loss: z,
      vx: optState.current.vx,
      vy: optState.current.vy,
      sx: optState.current.sx,
      sy: optState.current.sy,
    });

    let nextX = currentX;
    let nextY = currentY;

    if (optimizer === "gd" || optimizer === "sgd") {
      nextX = currentX - learningRate * gx;
      nextY = currentY - learningRate * gy;
      setActiveCodeLine(4);
    } else if (optimizer === "momentum") {
      const beta = 0.9;
      optState.current.vx = beta * optState.current.vx + learningRate * gx;
      optState.current.vy = beta * optState.current.vy + learningRate * gy;
      nextX = currentX - optState.current.vx;
      nextY = currentY - optState.current.vy;
      setActiveCodeLine(1);
    } else if (optimizer === "rmsprop") {
      const beta = 0.99;
      const eps = 1e-8;
      optState.current.sx = beta * optState.current.sx + (1 - beta) * (gx * gx);
      optState.current.sy = beta * optState.current.sy + (1 - beta) * (gy * gy);
      nextX = currentX - (learningRate / Math.sqrt(optState.current.sx + eps)) * gx;
      nextY = currentY - (learningRate / Math.sqrt(optState.current.sy + eps)) * gy;
      setActiveCodeLine(2);
    } else if (optimizer === "adam") {
      const b1 = 0.9;
      const b2 = 0.999;
      const eps = 1e-8;
      optState.current.t += 1;
      const t = optState.current.t;

      optState.current.vx = b1 * optState.current.vx + (1 - b1) * gx;
      optState.current.vy = b1 * optState.current.vy + (1 - b1) * gy;
      optState.current.sx = b2 * optState.current.sx + (1 - b2) * (gx * gx);
      optState.current.sy = b2 * optState.current.sy + (1 - b2) * (gy * gy);

      const mHatX = optState.current.vx / (1 - Math.pow(b1, t));
      const mHatY = optState.current.vy / (1 - Math.pow(b1, t));
      const vHatX = optState.current.sx / (1 - Math.pow(b2, t));
      const vHatY = optState.current.sy / (1 - Math.pow(b2, t));

      nextX = currentX - (learningRate / (Math.sqrt(vHatX) + eps)) * mHatX;
      nextY = currentY - (learningRate / (Math.sqrt(vHatY) + eps)) * mHatY;
      setActiveCodeLine(4);
    }

    // Clamp coordinates to bounding domain [-5, 5]
    nextX = Math.max(-5, Math.min(5, nextX));
    nextY = Math.max(-5, Math.min(5, nextY));

    const nextEval = evaluateSurface(nextX, nextY, surface);
    setCurrentX(nextX);
    setCurrentY(nextY);
    setPath((prev) => [...prev, { x: nextX, y: nextY, loss: nextEval.z }]);
    const newStep = currentStep + 1;
    setCurrentStep(newStep);

    // Check convergence
    const gradNorm = Math.sqrt(gx * gx + gy * gy);
    if (gradNorm < 0.005 || newStep >= 80) {
      setIsConverged(true);
      setIsRunning(false);
      setActiveCodeLine(0);
    }
  }, [currentX, currentY, isConverged, currentStep, learningRate, optimizer, surface]);

  // Step Backward
  const stepBackward = useCallback(() => {
    if (historyStackRef.current.length === 0) return;
    const prev = historyStackRef.current.pop()!;
    setCurrentX(prev.x);
    setCurrentY(prev.y);
    optState.current.vx = prev.vx;
    optState.current.vy = prev.vy;
    optState.current.sx = prev.sx;
    optState.current.sy = prev.sy;
    setPath((prevPath) => prevPath.slice(0, -1));
    setCurrentStep((s) => Math.max(0, s - 1));
    setIsConverged(false);
  }, []);

  // Auto-play loop
  useEffect(() => {
    if (isRunning && !isPaused && !isConverged) {
      const delay = Math.max(30, 350 / speed);
      animTimerRef.current = setTimeout(() => {
        step();
      }, delay);
    }
    return () => {
      if (animTimerRef.current) clearTimeout(animTimerRef.current);
    };
  }, [isRunning, isPaused, isConverged, currentStep, speed, step]);

  const handlePlay = () => {
    if (isConverged) resetSimulation();
    setIsRunning(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    setIsPaused(true);
    setIsRunning(false);
  };

  const handleFastForward = () => {
    setIsRunning(false);
    setIsPaused(false);
    for (let i = 0; i < 50; i++) {
      if (isConverged) break;
      step();
    }
  };

  // Click on landscape to set new starting point
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const xRange: [number, number] = [-4.5, 4.5];
    const yRange: [number, number] = [-4.5, 4.5];
    const { fromCanvas } = createCoordSystem(rect.width, rect.height, 40, xRange, yRange);
    const coords = fromCanvas(cx, cy);

    setStartX(coords.x);
    setStartY(coords.y);
    setCurrentX(coords.x);
    setCurrentY(coords.y);
    const { z } = evaluateSurface(coords.x, coords.y, surface);
    setPath([{ x: coords.x, y: coords.y, loss: z }]);
    optState.current = { vx: 0, vy: 0, sx: 0, sy: 0, t: 0 };
    setCurrentStep(0);
    setIsConverged(false);
  };

  // Draw 2D Contour Heatmap Landscape & Optimization Path
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
    const padding = 40;
    const xRange: [number, number] = [-4.5, 4.5];
    const yRange: [number, number] = [-4.5, 4.5];
    const { toCanvas } = createCoordSystem(w, h, padding, xRange, yRange);

    clearCanvas(ctx, w, h);

    // Heatmap contour background
    const gridRes = 45;
    const cellW = (w - padding * 2) / gridRes;
    const cellH = (h - padding * 2) / gridRes;

    for (let i = 0; i < gridRes; i++) {
      for (let j = 0; j < gridRes; j++) {
        const x = xRange[0] + (i / gridRes) * (xRange[1] - xRange[0]);
        const y = yRange[0] + (j / gridRes) * (yRange[1] - yRange[0]);
        const { z } = evaluateSurface(x, y, surface);

        // Normalize z for logarithmic/power color intensity
        const normZ = Math.min(1, Math.log1p(Math.max(0, z)) / 4.5);
        const { cx, cy } = toCanvas(x, y);

        // Deep blue -> Purple -> Amber color gradient
        const r = Math.floor(normZ * 220);
        const g = Math.floor((1 - normZ) * 80 + normZ * 30);
        const b = Math.floor((1 - normZ) * 200 + 40);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.22)`;
        ctx.fillRect(cx, cy - cellH, cellW + 1, cellH + 1);
      }
    }

    drawGrid(ctx, w, h, padding, xRange, yRange);
    drawAxes(ctx, w, h, padding, xRange, yRange);

    // Global minimum target marker (at (0,0) or (1,1) for Rosenbrock)
    const minTarget = surface === "rosenbrock" ? { x: 1, y: 1 } : { x: 0, y: 0 };
    const minPos = toCanvas(minTarget.x, minTarget.y);
    drawGlowCircle(ctx, minPos.cx, minPos.cy, 6, "#f59e0b", "rgba(245, 158, 11, 0.6)", "#ffffff");

    // Trajectory Path with glowing line
    if (path.length > 1) {
      ctx.save();
      ctx.shadowColor = "rgba(16, 185, 129, 0.6)";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      const first = toCanvas(path[0].x, path[0].y);
      ctx.moveTo(first.cx, first.cy);
      for (let i = 1; i < path.length; i++) {
        const p = toCanvas(path[i].x, path[i].y);
        ctx.lineTo(p.cx, p.cy);
      }
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();

      // Step dots
      path.forEach((p, idx) => {
        const pt = toCanvas(p.x, p.y);
        ctx.beginPath();
        ctx.arc(pt.cx, pt.cy, idx === 0 || idx === path.length - 1 ? 4 : 2, 0, Math.PI * 2);
        ctx.fillStyle = idx === 0 ? "#38bdf8" : idx === path.length - 1 ? "#ec4899" : "#10b981";
        ctx.fill();
      });
    }

    // Current optimizer head & Gradient vector arrow
    const curPos = toCanvas(currentX, currentY);
    const { gx, gy } = evaluateSurface(currentX, currentY, surface);
    const gradScale = 0.15;
    const gradEnd = toCanvas(currentX - gx * gradScale, currentY - gy * gradScale);

    // Gradient Arrow (Red)
    drawVectorArrow(ctx, curPos.cx, curPos.cy, gradEnd.cx, gradEnd.cy, "#ef4444", 2, 7);

    // Active Head Marker
    drawGlowCircle(ctx, curPos.cx, curPos.cy, 8, "#6366f1", "rgba(99, 102, 241, 0.8)", "#ffffff");

    // Inset Loss History Chart (Top-Right)
    if (path.length > 1) {
      const graphW = 140;
      const graphH = 65;
      const graphX = w - padding - graphW;
      const graphY = padding + 10;

      ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
      ctx.strokeStyle = "rgba(148, 163, 184, 0.25)";
      ctx.lineWidth = 1;
      ctx.fillRect(graphX, graphY, graphW, graphH);
      ctx.strokeRect(graphX, graphY, graphW, graphH);

      ctx.fillStyle = "rgba(148, 163, 184, 0.8)";
      ctx.font = "9px monospace";
      ctx.textAlign = "left";
      ctx.fillText("Loss Landscape Height", graphX + 6, graphY + 12);

      const losses = path.map((p) => p.loss);
      const maxLoss = Math.max(...losses, 1);
      const minLoss = Math.min(...losses, 0);
      const range = Math.max(0.001, maxLoss - minLoss);

      ctx.beginPath();
      losses.forEach((l, idx) => {
        const lx = graphX + 6 + (idx / (losses.length - 1)) * (graphW - 12);
        const ly = graphY + graphH - 6 - ((l - minLoss) / range) * (graphH - 22);
        if (idx === 0) ctx.moveTo(lx, ly);
        else ctx.lineTo(lx, ly);
      });
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }, [currentX, currentY, path, surface]);

  useEffect(() => {
    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [draw]);

  const currentLoss = path.length > 0 ? path[path.length - 1].loss : 0;
  const { gx, gy } = evaluateSurface(currentX, currentY, surface);
  const gradMagnitude = Math.sqrt(gx * gx + gy * gy);

  return (
    <LabLayout
      algorithmId="gradient-descent"
      title="Gradient Descent & Optimizers"
      subtitle="Navigate loss surfaces step-by-step comparing GD, SGD, Momentum, RMSProp, and Adam."
      currentStep={currentStep}
      maxSteps={80}
      isRunning={isRunning}
      isPaused={isPaused}
      isConverged={isConverged}
      statusMessage={
        isConverged
          ? `Local minimum reached at (x=${currentX.toFixed(3)}, y=${currentY.toFixed(3)}) with Loss = ${formatNumber(currentLoss, 5)}`
          : `Step ${currentStep}: ||∇f|| = ${formatNumber(gradMagnitude, 4)}, Loss = ${formatNumber(currentLoss, 4)}`
      }
      stepPhase={`Optimizer: ${optimizer.toUpperCase()} · Loss = ${formatNumber(currentLoss, 3)}`}
      playbackSpeed={speed}
      onStep={step}
      onStepBackward={stepBackward}
      onRun={handlePlay}
      onPause={handlePause}
      onFastForward={handleFastForward}
      onReset={resetSimulation}
      onRandomize={() => {
        setStartX((Math.random() - 0.5) * 6);
        setStartY((Math.random() - 0.5) * 6);
      }}
      onSpeedChange={setSpeed}
      pseudocode={PSEUDOCODE}
      activePseudocodeLine={activeCodeLine}
      canvasRef={canvasRef}
      datasetToExport={{
        optimizer,
        surface,
        learningRate,
        trajectory: path,
      }}
      visualization={
        <div className="relative w-full h-full">
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="w-full h-full cursor-crosshair"
            aria-label="Gradient descent loss landscape visualization"
          />
          <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] text-slate-300 pointer-events-none border border-white/10">
            Tip: Click anywhere to set start position · Red arrow = -∇f
          </div>
        </div>
      }
      controls={
        <>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              Loss Landscape
            </label>
            <select
              value={surface}
              onChange={(e) => setSurface(e.target.value as LossSurface)}
              className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm font-medium focus:ring-2 focus:ring-[var(--accent)]"
            >
              {SURFACES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              Optimization Algorithm
            </label>
            <select
              value={optimizer}
              onChange={(e) => setOptimizer(e.target.value as OptimizerType)}
              className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm font-medium focus:ring-2 focus:ring-[var(--accent)]"
            >
              {OPTIMIZERS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <Slider
            label="Learning Rate (α)"
            value={learningRate}
            min={0.005}
            max={0.15}
            step={0.005}
            onChange={setLearningRate}
            tooltip="Step size multiplier for weight updates"
            formatValue={(v) => v.toFixed(3)}
          />
          <Slider
            label="Start X Coordinate"
            value={startX}
            min={-4}
            max={4}
            step={0.1}
            onChange={setStartX}
          />
          <Slider
            label="Start Y Coordinate"
            value={startY}
            min={-4}
            max={4}
            step={0.1}
            onChange={setStartY}
          />
        </>
      }
      metrics={[
        { label: "Position (X, Y)", value: `(${currentX.toFixed(2)}, ${currentY.toFixed(2)})`, highlight: true },
        { label: "Loss f(x, y)", value: formatNumber(currentLoss, 4), highlight: true },
        { label: "Gradient Norm", value: formatNumber(gradMagnitude, 4) },
        { label: "Optimizer", value: optimizer.toUpperCase() },
      ]}
      explanations={[
        {
          title: "First-Order Gradient Vector Field",
          content:
            "The gradient vector ∇f points in the direction of steepest ascent. Gradient descent takes steps in the negative gradient direction to descend to minimum loss.",
          latex: "\\nabla f(x, y) = \\begin{bmatrix} \\frac{\\partial f}{\\partial x} \\\\ \\frac{\\partial f}{\\partial y} \\end{bmatrix}, \\quad \\theta_{t+1} = \\theta_t - \\alpha \\nabla f(\\theta_t)",
        },
        {
          title: "Adaptive Momentum & Adam",
          content:
            "Momentum maintains an exponentially decaying moving average of past gradients to accelerate through ravines and escape saddle points. Adam combines momentum with per-parameter second moment scaling.",
          latex: "m_t = \\beta_1 m_{t-1} + (1-\\beta_1)g_t, \\quad v_t = \\beta_2 v_{t-1} + (1-\\beta_2)g_t^2, \\quad \\theta_{t+1} = \\theta_t - \\frac{\\alpha}{\\sqrt{\\hat{v}_t} + \\epsilon} \\hat{m}_t",
        },
      ]}
    />
  );
}
