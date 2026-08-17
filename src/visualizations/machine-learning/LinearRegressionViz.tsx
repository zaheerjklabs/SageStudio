"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { LabLayout } from "@/components/visualization/LabLayout";
import { Slider } from "@/components/controls/Slider";
import { LinearRegressionEngine } from "@/algorithms/regression/linear-regression";
import { generateRegressionData } from "@/algorithms/datasets";
import { formatNumber } from "@/lib/utils";
import {
  drawGrid,
  drawAxes,
  createCoordSystem,
  clearCanvas,
  drawGlowCircle,
} from "@/lib/canvas";
import type { DataPoint } from "@/types";

const PSEUDOCODE = [
  "1. Initialize weight w and bias b",
  "2. For each sample x_i: compute prediction ŷ_i = w * x_i + b",
  "3. Compute error residual e_i = (y_i - ŷ_i) and Loss = (1/n) Σ e_i²",
  "4. Compute analytical gradients: ∂L/∂w = -(2/n) Σ e_i * x_i,  ∂L/∂b = -(2/n) Σ e_i",
  "5. Update parameters: w ← w - α(∂L/∂w),  b ← b - α(∂L/∂b)",
  "6. Repeat until gradient norm ||∇L|| < ε or max epochs reached",
];

interface HistoryState {
  weight: number;
  bias: number;
  loss: number;
  lossHistory: number[];
  epoch: number;
}

export default function LinearRegressionViz() {
  const [dataSize, setDataSize] = useState(50);
  const [noise, setNoise] = useState(1.8);
  const [learningRate, setLearningRate] = useState(0.02);
  const [initialSlope, setInitialSlope] = useState(0.5);
  const [initialIntercept, setInitialIntercept] = useState(0.0);
  const [data, setData] = useState<DataPoint[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [currentStep, setCurrentStep] = useState(0);
  const [isConverged, setIsConverged] = useState(false);
  const [seed, setSeed] = useState(42);
  const [activeCodeLine, setActiveCodeLine] = useState(0);
  const [showErrorSquares, setShowErrorSquares] = useState(true);
  const [showResiduals, setShowResiduals] = useState(true);

  const engineRef = useRef(new LinearRegressionEngine(initialSlope, initialIntercept, learningRate));
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animTimerRef = useRef<NodeJS.Timeout | null>(null);
  const historyStackRef = useRef<HistoryState[]>([]);

  const regenerate = useCallback(() => {
    if (animTimerRef.current) clearTimeout(animTimerRef.current);
    setIsRunning(false);
    setIsPaused(false);
    setIsConverged(false);
    setCurrentStep(0);
    setActiveCodeLine(0);

    const newData = generateRegressionData(dataSize, 1.4, 0.8, noise, seed);
    setData(newData);

    engineRef.current = new LinearRegressionEngine(initialSlope, initialIntercept, learningRate);
    engineRef.current.reset(initialSlope, initialIntercept);
    historyStackRef.current = [];
  }, [dataSize, noise, initialSlope, initialIntercept, learningRate, seed]);

  useEffect(() => {
    regenerate();
  }, [regenerate]);

  // Execute 1 Step of Gradient Descent
  const step = useCallback(() => {
    if (isConverged) return;

    const engine = engineRef.current;
    const oldState = engine.getState(data);

    // Save history snapshot
    historyStackRef.current.push({
      weight: oldState.weight,
      bias: oldState.bias,
      loss: oldState.loss,
      lossHistory: [...engine.lossHistory],
      epoch: currentStep,
    });

    engine.learningRate = learningRate;
    engine.gradientStep(data);
    const newState = engine.getState(data);
    const newStep = currentStep + 1;
    setCurrentStep(newStep);

    // Check convergence: small gradient or plateaued loss
    const history = engine.lossHistory;
    if (history.length > 5) {
      const recentLossDelta = Math.abs(history[history.length - 1] - history[history.length - 5]);
      if (recentLossDelta < 0.0001 || newStep >= 100) {
        setIsConverged(true);
        setIsRunning(false);
        setActiveCodeLine(5);
        return;
      }
    }

    setActiveCodeLine(4);
  }, [data, isConverged, currentStep, learningRate]);

  // Step Backward
  const stepBackward = useCallback(() => {
    if (historyStackRef.current.length === 0) return;
    const prevState = historyStackRef.current.pop()!;
    engineRef.current.weight = prevState.weight;
    engineRef.current.bias = prevState.bias;
    engineRef.current.lossHistory = [...prevState.lossHistory];

    setCurrentStep(prevState.epoch);
    setIsConverged(false);
    setActiveCodeLine(3);
  }, []);

  // Auto-step loop
  useEffect(() => {
    if (isRunning && !isPaused && !isConverged) {
      const delay = Math.max(40, 400 / speed);
      animTimerRef.current = setTimeout(() => {
        step();
      }, delay);
    }
    return () => {
      if (animTimerRef.current) clearTimeout(animTimerRef.current);
    };
  }, [isRunning, isPaused, isConverged, currentStep, speed, step]);

  const handlePlay = () => {
    if (isConverged) regenerate();
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
    for (let i = 0; i < 80; i++) {
      engineRef.current.gradientStep(data);
    }
    setCurrentStep((s) => s + 80);
    setIsConverged(true);
    setActiveCodeLine(5);
  };

  // Add custom point on canvas click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const xRange: [number, number] = [-6, 6];
    const yRange: [number, number] = [-6, 6];
    const { fromCanvas } = createCoordSystem(rect.width, rect.height, 40, xRange, yRange);
    const coords = fromCanvas(cx, cy);

    setData((prev) => [...prev, { x: coords.x, y: coords.y }]);
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
    const padding = 40;
    const xRange: [number, number] = [-6, 6];
    const yRange: [number, number] = [-6, 6];
    const { toCanvas } = createCoordSystem(w, h, padding, xRange, yRange);

    clearCanvas(ctx, w, h);
    drawGrid(ctx, w, h, padding, xRange, yRange);
    drawAxes(ctx, w, h, padding, xRange, yRange);

    const engine = engineRef.current;

    // Visual Squared Error Boxes (Residual Squares)
    if (showErrorSquares) {
      data.forEach((p) => {
        const pred = engine.predict(p.x);
        const actual = toCanvas(p.x, p.y);
        const predicted = toCanvas(p.x, pred);
        const diffPx = Math.abs(actual.cy - predicted.cy);

        if (diffPx > 1) {
          ctx.fillStyle = "rgba(239, 68, 68, 0.08)";
          ctx.strokeStyle = "rgba(239, 68, 68, 0.25)";
          ctx.lineWidth = 1;
          const left = actual.cx;
          const top = Math.min(actual.cy, predicted.cy);
          ctx.fillRect(left, top, diffPx, diffPx);
          ctx.strokeRect(left, top, diffPx, diffPx);
        }
      });
    }

    // Residual Vertical Error Bars
    if (showResiduals) {
      data.forEach((p) => {
        const pred = engine.predict(p.x);
        const actual = toCanvas(p.x, p.y);
        const predicted = toCanvas(p.x, pred);
        ctx.beginPath();
        ctx.moveTo(actual.cx, actual.cy);
        ctx.lineTo(predicted.cx, predicted.cy);
        ctx.strokeStyle = "rgba(239, 68, 68, 0.6)";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });
    }

    // Glowing Fitted Regression Line
    const x1 = xRange[0];
    const x2 = xRange[1];
    const p1 = toCanvas(x1, engine.predict(x1));
    const p2 = toCanvas(x2, engine.predict(x2));

    ctx.save();
    ctx.shadowColor = "rgba(99, 102, 241, 0.7)";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(p1.cx, p1.cy);
    ctx.lineTo(p2.cx, p2.cy);
    ctx.strokeStyle = "#6366f1";
    ctx.lineWidth = 3.5;
    ctx.stroke();
    ctx.restore();

    // Data Points
    data.forEach((p) => {
      const { cx, cy } = toCanvas(p.x, p.y);
      drawGlowCircle(ctx, cx, cy, 4.5, "#10b981", "rgba(16, 185, 129, 0.5)", "#ffffff");
    });

    // Inset Mini Loss vs Iteration Graph (Top-Right)
    const lossHistory = engine.lossHistory;
    if (lossHistory.length > 1) {
      const graphW = 140;
      const graphH = 65;
      const graphX = w - padding - graphW;
      const graphY = padding + 10;

      ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
      ctx.strokeStyle = "rgba(148, 163, 184, 0.25)";
      ctx.lineWidth = 1;
      ctx.fillRect(graphX, graphY, graphW, graphH);
      ctx.strokeRect(graphX, graphY, graphW, graphH);

      ctx.fillStyle = "rgba(148, 163, 184, 0.8)";
      ctx.font = "9px monospace";
      ctx.textAlign = "left";
      ctx.fillText("MSE Loss History", graphX + 6, graphY + 12);

      const maxLoss = Math.max(...lossHistory, 1);
      const minLoss = Math.min(...lossHistory, 0);
      const range = Math.max(0.001, maxLoss - minLoss);

      ctx.beginPath();
      lossHistory.forEach((l, idx) => {
        const lx = graphX + 6 + (idx / (lossHistory.length - 1)) * (graphW - 12);
        const ly = graphY + graphH - 6 - ((l - minLoss) / range) * (graphH - 22);
        if (idx === 0) ctx.moveTo(lx, ly);
        else ctx.lineTo(lx, ly);
      });
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }, [data, currentStep, showErrorSquares, showResiduals]);

  useEffect(() => {
    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [draw]);

  const state = engineRef.current.getState(data);

  // Compute R^2 score
  const yMean = data.length > 0 ? data.reduce((a, b) => a + b.y, 0) / data.length : 0;
  const ssTotal = data.reduce((acc, p) => acc + (p.y - yMean) ** 2, 0);
  const ssRes = data.reduce((acc, p) => acc + (p.y - engineRef.current.predict(p.x)) ** 2, 0);
  const r2Score = ssTotal > 0 ? Math.max(0, 1 - ssRes / ssTotal) : 0;

  return (
    <LabLayout
      algorithmId="linear-regression"
      title="Linear Regression"
      subtitle="Optimize weight and bias step-by-step via analytical Mean Squared Error gradient descent."
      currentStep={currentStep}
      maxSteps={100}
      isRunning={isRunning}
      isPaused={isPaused}
      isConverged={isConverged}
      statusMessage={
        isConverged
          ? `Optimal fit achieved with MSE = ${formatNumber(state.loss, 4)} (R² = ${(r2Score * 100).toFixed(1)}%)`
          : `Step ${currentStep}: w = ${formatNumber(state.weight, 3)}, b = ${formatNumber(state.bias, 3)}`
      }
      stepPhase={`w = ${formatNumber(state.weight, 3)}, b = ${formatNumber(state.bias, 3)}`}
      playbackSpeed={speed}
      onStep={step}
      onStepBackward={stepBackward}
      onRun={handlePlay}
      onPause={handlePause}
      onFastForward={handleFastForward}
      onReset={regenerate}
      onRandomize={() => setSeed(Math.floor(Math.random() * 10000))}
      onSpeedChange={setSpeed}
      pseudocode={PSEUDOCODE}
      activePseudocodeLine={activeCodeLine}
      canvasRef={canvasRef}
      datasetToExport={{
        weight: state.weight,
        bias: state.bias,
        mse: state.loss,
        r2: r2Score,
        lossHistory: engineRef.current.lossHistory,
        dataPoints: data,
      }}
      visualization={
        <div className="relative w-full h-full">
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="w-full h-full cursor-crosshair"
            aria-label="Linear regression interactive canvas"
          />
          <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] text-slate-300 pointer-events-none border border-white/10">
            Tip: Click to add points · Red boxes = Squared errors (y - ŷ)²
          </div>
        </div>
      }
      controls={
        <>
          <Slider
            label="Learning Rate (α)"
            value={learningRate}
            min={0.001}
            max={0.08}
            step={0.001}
            onChange={setLearningRate}
            tooltip="Gradient step size scalar"
            formatValue={(v) => v.toFixed(3)}
          />
          <Slider
            label="Dataset Size (N)"
            value={dataSize}
            min={15}
            max={150}
            step={5}
            onChange={setDataSize}
            tooltip="Number of training samples"
          />
          <Slider
            label="Noise Dispersion (σ)"
            value={noise}
            min={0}
            max={4}
            step={0.1}
            onChange={setNoise}
            tooltip="Standard deviation of Gaussian noise added to ground truth"
          />
          <Slider
            label="Initial Weight (Slope)"
            value={initialSlope}
            min={-3}
            max={3}
            step={0.1}
            onChange={setInitialSlope}
          />
          <Slider
            label="Initial Bias (Intercept)"
            value={initialIntercept}
            min={-3}
            max={3}
            step={0.1}
            onChange={setInitialIntercept}
          />
          <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
              <input
                type="checkbox"
                checked={showErrorSquares}
                onChange={(e) => setShowErrorSquares(e.target.checked)}
                className="rounded text-[var(--accent)]"
              />
              Show Error Squares (y-ŷ)²
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
              <input
                type="checkbox"
                checked={showResiduals}
                onChange={(e) => setShowResiduals(e.target.checked)}
                className="rounded text-[var(--accent)]"
              />
              Show Residual Lines
            </label>
          </div>
        </>
      }
      metrics={[
        { label: "Weight (w)", value: formatNumber(state.weight, 4), highlight: true },
        { label: "Bias (b)", value: formatNumber(state.bias, 4), highlight: true },
        { label: "MSE Loss", value: formatNumber(state.loss, 4), highlight: true },
        { label: "R² Fit Score", value: `${(r2Score * 100).toFixed(1)}%` },
      ]}
      explanations={[
        {
          title: "Hypothesis Model & Predictions",
          content:
            "Linear regression assumes a linear relationship between input x and target y parameterized by weight w and bias b.",
          latex: "\\hat{y} = w \\cdot x + b",
        },
        {
          title: "Mean Squared Error (MSE) Cost Function",
          content:
            "The objective is to find parameters that minimize the average squared vertical distance between actual points and predictions.",
          latex: "J(w, b) = \\frac{1}{n} \\sum_{i=1}^{n} \\left( y_i - (w x_i + b) \\right)^2",
        },
        {
          title: "Analytical Gradient Updates",
          content:
            "Parameters are updated opposite the gradient of the MSE cost function with step size controlled by learning rate α.",
          latex:
            "w \\leftarrow w - \\alpha \\left( -\\frac{2}{n}\\sum_{i=1}^{n}(y_i - \\hat{y}_i)x_i \\right), \\quad b \\leftarrow b - \\alpha \\left( -\\frac{2}{n}\\sum_{i=1}^{n}(y_i - \\hat{y}_i) \\right)",
        },
      ]}
    />
  );
}
