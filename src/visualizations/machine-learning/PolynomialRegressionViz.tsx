"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { LabLayout } from "@/components/visualization/LabLayout";
import { Slider } from "@/components/controls/Slider";
import { PolynomialRegressionEngine } from "@/algorithms/regression/polynomial-regression";
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
  "1. Expand input x into polynomial feature vector [1, x, x², ..., x^d]",
  "2. Initialize weight vector w = [w_0, w_1, ..., w_d]",
  "3. Predict ŷ_i = w_0 + w_1 x_i + w_2 x_i² + ... + w_d x_i^d",
  "4. Compute MSE loss = (1/n) Σ (y_i - ŷ_i)²",
  "5. Update weights: w_j ← w_j - α(∂L/∂w_j) for all degrees j=0...d",
  "6. Monitor Train vs Validation MSE to detect overfitting",
];

interface HistoryState {
  coefficients: number[];
  loss: number;
  lossHistory: number[];
  epoch: number;
}

export default function PolynomialRegressionViz() {
  const [degree, setDegree] = useState(3);
  const [dataSize, setDataSize] = useState(45);
  const [noise, setNoise] = useState(1.4);
  const [learningRate, setLearningRate] = useState(0.001);
  const [data, setData] = useState<DataPoint[]>([]);
  const [valData, setValData] = useState<DataPoint[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [currentStep, setCurrentStep] = useState(0);
  const [isConverged, setIsConverged] = useState(false);
  const [seed, setSeed] = useState(42);
  const [activeCodeLine, setActiveCodeLine] = useState(0);

  const engineRef = useRef(new PolynomialRegressionEngine(degree, learningRate));
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

    const train: DataPoint[] = [];
    const val: DataPoint[] = [];

    // Ground truth: y = 0.08 x³ - 0.2 x² - 0.4 x + 1.2
    for (let i = 0; i < dataSize; i++) {
      const x = (i / dataSize) * 10 - 5;
      const trueY = 0.08 * Math.pow(x, 3) - 0.2 * Math.pow(x, 2) - 0.4 * x + 1.2;
      const trainY = trueY + (Math.random() - 0.5) * noise * 2;
      const valY = trueY + (Math.random() - 0.5) * noise * 2;
      train.push({ x, y: trainY });
      val.push({ x, y: valY });
    }

    setData(train);
    setValData(val);

    engineRef.current = new PolynomialRegressionEngine(degree, learningRate);
    historyStackRef.current = [];
  }, [dataSize, noise, degree, learningRate]);

  useEffect(() => {
    regenerate();
  }, [regenerate]);

  // Execute 1 Step
  const step = useCallback(() => {
    if (isConverged) return;

    const engine = engineRef.current;
    const oldState = engine.getState(data);

    historyStackRef.current.push({
      coefficients: [...engine.coefficients],
      loss: oldState.loss,
      lossHistory: [...engine.lossHistory],
      epoch: currentStep,
    });

    engine.learningRate = learningRate;
    for (let i = 0; i < 4; i++) {
      engine.gradientStep(data);
    }
    const newStep = currentStep + 1;
    setCurrentStep(newStep);

    const history = engine.lossHistory;
    if (history.length > 10) {
      const lossDelta = Math.abs(history[history.length - 1] - history[history.length - 5]);
      if (lossDelta < 0.0001 || newStep >= 80) {
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
    const prev = historyStackRef.current.pop()!;
    engineRef.current.coefficients = [...prev.coefficients];
    engineRef.current.lossHistory = [...prev.lossHistory];
    setCurrentStep(prev.epoch);
    setIsConverged(false);
  }, []);

  // Auto-step loop
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
  };

  // Add custom point on canvas click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const xRange: [number, number] = [-6, 6];
    const yRange: [number, number] = [-8, 8];
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
    const yRange: [number, number] = [-8, 8];
    const { toCanvas } = createCoordSystem(w, h, padding, xRange, yRange);

    clearCanvas(ctx, w, h);
    drawGrid(ctx, w, h, padding, xRange, yRange);
    drawAxes(ctx, w, h, padding, xRange, yRange);

    const engine = engineRef.current;

    // Polynomial Fitted Curve
    ctx.save();
    ctx.shadowColor = "rgba(99, 102, 241, 0.7)";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    let started = false;
    for (let x = xRange[0]; x <= xRange[1]; x += 0.04) {
      const y = engine.predict(x);
      if (y >= yRange[0] - 2 && y <= yRange[1] + 2) {
        const { cx, cy } = toCanvas(x, y);
        if (!started) {
          ctx.moveTo(cx, cy);
          started = true;
        } else {
          ctx.lineTo(cx, cy);
        }
      }
    }
    ctx.strokeStyle = "#6366f1";
    ctx.lineWidth = 3.5;
    ctx.stroke();
    ctx.restore();

    // Residual vertical lines
    data.forEach((p) => {
      const pred = engine.predict(p.x);
      const actual = toCanvas(p.x, p.y);
      const predicted = toCanvas(p.x, pred);
      ctx.beginPath();
      ctx.moveTo(actual.cx, actual.cy);
      ctx.lineTo(predicted.cx, predicted.cy);
      ctx.strokeStyle = "rgba(239, 68, 68, 0.4)";
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Training Data Points
    data.forEach((p) => {
      const { cx, cy } = toCanvas(p.x, p.y);
      drawGlowCircle(ctx, cx, cy, 4.5, "#10b981", "rgba(16, 185, 129, 0.5)", "#ffffff");
    });

    // Inset Loss History Chart
    const lossHistory = engine.lossHistory;
    if (lossHistory.length > 1) {
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
      ctx.fillText("Train MSE Loss", graphX + 6, graphY + 12);

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
  }, [data, currentStep]);

  useEffect(() => {
    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [draw]);

  const state = engineRef.current.getState(data);

  // Compute Validation Loss
  const valLoss =
    valData.length > 0
      ? valData.reduce((acc, p) => acc + (p.y - engineRef.current.predict(p.x)) ** 2, 0) /
        valData.length
      : 0;

  return (
    <LabLayout
      algorithmId="polynomial-regression"
      title="Polynomial Regression"
      subtitle="Fit higher-order polynomial curves and observe the bias-variance trade-off step-by-step."
      currentStep={currentStep}
      maxSteps={80}
      isRunning={isRunning}
      isPaused={isPaused}
      isConverged={isConverged}
      statusMessage={
        isConverged
          ? `Fitting converged: Degree ${degree} Polynomial MSE = ${formatNumber(state.loss, 4)}`
          : `Step ${currentStep}: Train MSE = ${formatNumber(state.loss, 4)}, Val MSE = ${formatNumber(valLoss, 4)}`
      }
      stepPhase={`Degree d=${degree} · Train MSE: ${formatNumber(state.loss, 3)}`}
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
        degree,
        learningRate,
        trainLoss: state.loss,
        valLoss,
        coefficients: engineRef.current.coefficients,
        dataPoints: data,
      }}
      visualization={
        <div className="relative w-full h-full">
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="w-full h-full cursor-crosshair"
            aria-label="Polynomial regression curve canvas"
          />
          <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] text-slate-300 pointer-events-none border border-white/10">
            Tip: Higher degrees increase model capacity but risk overfitting
          </div>
        </div>
      }
      controls={
        <>
          <Slider
            label="Polynomial Degree (d)"
            value={degree}
            min={1}
            max={7}
            step={1}
            onChange={setDegree}
            tooltip="Highest exponent power of feature x (1=Linear, 2=Quadratic, 3=Cubic...)"
          />
          <Slider
            label="Learning Rate (α)"
            value={learningRate}
            min={0.0001}
            max={0.005}
            step={0.0001}
            onChange={setLearningRate}
            formatValue={(v) => v.toFixed(4)}
          />
          <Slider
            label="Dataset Size"
            value={dataSize}
            min={15}
            max={100}
            step={5}
            onChange={setDataSize}
          />
          <Slider
            label="Noise Variance (σ)"
            value={noise}
            min={0}
            max={3.5}
            step={0.1}
            onChange={setNoise}
          />
        </>
      }
      metrics={[
        { label: "Polynomial Degree", value: `Degree ${degree}`, highlight: true },
        { label: "Train MSE", value: formatNumber(state.loss, 4), highlight: true },
        { label: "Validation MSE", value: formatNumber(valLoss, 4) },
        {
          label: "Fit Regimes",
          value: degree <= 2 ? "Underfitting" : degree <= 4 ? "Optimal" : "Overfitting Risk",
        },
      ]}
      explanations={[
        {
          title: "Polynomial Hypothesis Formulation",
          content:
            "Polynomial regression extends linear models by applying non-linear polynomial basis expansions to the input feature.",
          latex: "\\hat{y} = w_0 + w_1 x + w_2 x^2 + w_3 x^3 + \\dots + w_d x^d = \\sum_{j=0}^{d} w_j x^j",
        },
        {
          title: "Bias-Variance Tradeoff",
          content:
            "Low-degree polynomials have high bias (underfitting), whereas high-degree polynomials have high variance and memorize noise (overfitting).",
          latex: "\\mathbb{E}[(y - \\hat{y})^2] = \\text{Bias}[\\hat{y}]^2 + \\text{Var}[\\hat{y}] + \\sigma^2",
        },
      ]}
    />
  );
}
