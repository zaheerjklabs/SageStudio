"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { LabLayout } from "@/components/visualization/LabLayout";
import { Slider } from "@/components/controls/Slider";
import { LogisticRegressionEngine } from "@/algorithms/classification/logistic-regression";
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
  "2. For each sample x_i: compute linear logit z_i = w * x_i + b",
  "3. Compute predicted probability p_i = σ(z_i) = 1 / (1 + e^(-z_i))",
  "4. Calculate binary cross-entropy loss L = - (1/n) Σ [y_i ln(p_i) + (1-y_i) ln(1-p_i)]",
  "5. Compute gradients: ∂L/∂w = (1/n) Σ (p_i - y_i) * x_i,  ∂L/∂b = (1/n) Σ (p_i - y_i)",
  "6. Update parameters: w ← w - α(∂L/∂w),  b ← b - α(∂L/∂b)",
];

interface HistoryState {
  weight: number;
  bias: number;
  loss: number;
  lossHistory: number[];
  epoch: number;
}

export default function LogisticRegressionViz() {
  const [dataSize, setDataSize] = useState(80);
  const [learningRate, setLearningRate] = useState(0.08);
  const [threshold, setThreshold] = useState(0.5);
  const [data, setData] = useState<DataPoint[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [currentStep, setCurrentStep] = useState(0);
  const [isConverged, setIsConverged] = useState(false);
  const [activeCodeLine, setActiveCodeLine] = useState(0);

  const engineRef = useRef(new LogisticRegressionEngine(0.1, 0, learningRate));
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

    const newData: DataPoint[] = [];
    for (let i = 0; i < dataSize; i++) {
      const x = (Math.random() - 0.5) * 10;
      const trueProb = 1 / (1 + Math.exp(-(0.9 * x + 0.3)));
      const label = Math.random() < trueProb ? 1 : 0;
      newData.push({ x, y: label, label });
    }
    setData(newData);

    engineRef.current = new LogisticRegressionEngine(0.1, 0, learningRate);
    historyStackRef.current = [];
  }, [dataSize, learningRate]);

  useEffect(() => {
    regenerate();
  }, [regenerate]);

  // Execute 1 Step of Gradient Descent
  const step = useCallback(() => {
    if (isConverged) return;

    const engine = engineRef.current;
    const oldState = engine.getState(data);

    historyStackRef.current.push({
      weight: oldState.weight,
      bias: oldState.bias,
      loss: oldState.loss,
      lossHistory: [...engine.lossHistory],
      epoch: currentStep,
    });

    engine.learningRate = learningRate;
    engine.gradientStep(data);
    const newStep = currentStep + 1;
    setCurrentStep(newStep);

    // Check convergence
    const history = engine.lossHistory;
    if (history.length > 5) {
      const lossDelta = Math.abs(history[history.length - 1] - history[history.length - 5]);
      if (lossDelta < 0.0001 || newStep >= 80) {
        setIsConverged(true);
        setIsRunning(false);
        setActiveCodeLine(0);
        return;
      }
    }

    setActiveCodeLine(5);
  }, [data, isConverged, currentStep, learningRate]);

  // Step Backward
  const stepBackward = useCallback(() => {
    if (historyStackRef.current.length === 0) return;
    const prev = historyStackRef.current.pop()!;
    engineRef.current.weight = prev.weight;
    engineRef.current.bias = prev.bias;
    engineRef.current.lossHistory = [...prev.lossHistory];
    setCurrentStep(prev.epoch);
    setIsConverged(false);
  }, []);

  // Auto-play loop
  useEffect(() => {
    if (isRunning && !isPaused && !isConverged) {
      const delay = Math.max(40, 350 / speed);
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
    for (let i = 0; i < 60; i++) {
      engineRef.current.gradientStep(data);
    }
    setCurrentStep((s) => s + 60);
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
    const yRange: [number, number] = [-0.15, 1.15];
    const { fromCanvas } = createCoordSystem(rect.width, rect.height, 45, xRange, yRange);
    const coords = fromCanvas(cx, cy);

    const label = coords.y >= 0.5 ? 1 : 0;
    setData((prev) => [...prev, { x: coords.x, y: label, label }]);
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
    const xRange: [number, number] = [-6, 6];
    const yRange: [number, number] = [-0.15, 1.15];
    const { toCanvas } = createCoordSystem(w, h, padding, xRange, yRange);

    clearCanvas(ctx, w, h);
    drawGrid(ctx, w, h, padding, xRange, yRange);
    drawAxes(ctx, w, h, padding, xRange, yRange);

    const engine = engineRef.current;

    // Decision region background shading above/below threshold
    const threshLeft = toCanvas(xRange[0], threshold);
    const threshRight = toCanvas(xRange[1], threshold);

    ctx.fillStyle = "rgba(16, 185, 129, 0.06)";
    ctx.fillRect(padding, padding, w - padding * 2, threshLeft.cy - padding);

    ctx.fillStyle = "rgba(239, 68, 68, 0.06)";
    ctx.fillRect(padding, threshLeft.cy, w - padding * 2, h - padding - threshLeft.cy);

    // Decision Threshold Line
    ctx.beginPath();
    ctx.moveTo(threshLeft.cx, threshLeft.cy);
    ctx.lineTo(threshRight.cx, threshRight.cy);
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 6]);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "#f59e0b";
    ctx.font = "bold 9px monospace";
    ctx.fillText(`Threshold τ = ${threshold.toFixed(2)}`, w - padding - 110, threshLeft.cy - 6);

    // Sigmoid Curve σ(wx + b)
    ctx.save();
    ctx.shadowColor = "rgba(99, 102, 241, 0.7)";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    let started = false;
    for (let x = xRange[0]; x <= xRange[1]; x += 0.05) {
      const prob = engine.predict(x);
      const { cx, cy } = toCanvas(x, prob);
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

    // Data Points
    data.forEach((p) => {
      const predProb = engine.predict(p.x);
      const isCorrect = (predProb >= threshold ? 1 : 0) === p.label;
      const { cx, cy } = toCanvas(p.x, p.label!);
      const color = p.label === 1 ? "#10b981" : "#ef4444";

      // Prediction probability drop-line
      const probPos = toCanvas(p.x, predProb);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(probPos.cx, probPos.cy);
      ctx.strokeStyle = isCorrect ? "rgba(16, 185, 129, 0.25)" : "rgba(239, 68, 68, 0.5)";
      ctx.lineWidth = 1;
      ctx.stroke();

      drawGlowCircle(ctx, cx, cy, 4.5, color, color, isCorrect ? "#ffffff" : "#ef4444");
    });

    // Inset Loss History Chart
    const lossHistory = engine.lossHistory;
    if (lossHistory.length > 1) {
      const graphW = 135;
      const graphH = 60;
      const graphX = w - padding - graphW;
      const graphY = padding + 8;

      ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
      ctx.strokeStyle = "rgba(148, 163, 184, 0.25)";
      ctx.lineWidth = 1;
      ctx.fillRect(graphX, graphY, graphW, graphH);
      ctx.strokeRect(graphX, graphY, graphW, graphH);

      ctx.fillStyle = "rgba(148, 163, 184, 0.8)";
      ctx.font = "9px monospace";
      ctx.fillText("Log Loss (BCE)", graphX + 6, graphY + 12);

      const maxLoss = Math.max(...lossHistory, 0.5);
      const minLoss = Math.min(...lossHistory, 0);
      const range = Math.max(0.001, maxLoss - minLoss);

      ctx.beginPath();
      lossHistory.forEach((l, idx) => {
        const lx = graphX + 6 + (idx / (lossHistory.length - 1)) * (graphW - 12);
        const ly = graphY + graphH - 6 - ((l - minLoss) / range) * (graphH - 20);
        if (idx === 0) ctx.moveTo(lx, ly);
        else ctx.lineTo(lx, ly);
      });
      ctx.strokeStyle = "#6366f1";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }, [data, threshold, currentStep]);

  useEffect(() => {
    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [draw]);

  const state = engineRef.current.getState(data);

  // Compute Confusion Matrix
  let tp = 0, fp = 0, tn = 0, fn = 0;
  data.forEach((p) => {
    const pred = engineRef.current.predictClass(p.x, threshold);
    if (pred === 1 && p.label === 1) tp++;
    else if (pred === 1 && p.label === 0) fp++;
    else if (pred === 0 && p.label === 0) tn++;
    else if (pred === 0 && p.label === 1) fn++;
  });

  const accuracy = data.length > 0 ? (tp + tn) / data.length : 0;
  const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
  const recall = tp + fn > 0 ? tp / (tp + fn) : 0;

  return (
    <LabLayout
      algorithmId="logistic-regression"
      title="Logistic Regression"
      subtitle="Classify binary targets by fitting a sigmoid probability hypothesis with cross-entropy gradient descent."
      currentStep={currentStep}
      maxSteps={80}
      isRunning={isRunning}
      isPaused={isPaused}
      isConverged={isConverged}
      statusMessage={
        isConverged
          ? `Convergence reached with ${(accuracy * 100).toFixed(1)}% Accuracy (BCE Loss = ${formatNumber(state.loss, 4)})`
          : `Step ${currentStep}: w = ${formatNumber(state.weight, 3)}, b = ${formatNumber(state.bias, 3)}, Loss = ${formatNumber(state.loss, 4)}`
      }
      stepPhase={`Accuracy: ${(accuracy * 100).toFixed(1)}% · Loss: ${formatNumber(state.loss, 3)}`}
      playbackSpeed={speed}
      onStep={step}
      onStepBackward={stepBackward}
      onRun={handlePlay}
      onPause={handlePause}
      onFastForward={handleFastForward}
      onReset={regenerate}
      onRandomize={regenerate}
      onSpeedChange={setSpeed}
      pseudocode={PSEUDOCODE}
      activePseudocodeLine={activeCodeLine}
      canvasRef={canvasRef}
      datasetToExport={{
        weight: state.weight,
        bias: state.bias,
        threshold,
        accuracy,
        precision,
        recall,
        confusionMatrix: { tp, fp, tn, fn },
        dataPoints: data,
      }}
      visualization={
        <div className="relative w-full h-full">
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="w-full h-full cursor-crosshair"
            aria-label="Logistic regression probability canvas"
          />
          <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] text-slate-300 pointer-events-none border border-white/10">
            Tip: Click to add samples · Blue curve = σ(wx+b)
          </div>
        </div>
      }
      controls={
        <>
          <Slider
            label="Learning Rate (α)"
            value={learningRate}
            min={0.01}
            max={0.25}
            step={0.01}
            onChange={setLearningRate}
          />
          <Slider
            label="Decision Threshold (τ)"
            value={threshold}
            min={0.1}
            max={0.9}
            step={0.05}
            onChange={setThreshold}
            tooltip="Probability cutoff boundary separating Class 0 from Class 1"
          />
          <Slider
            label="Dataset Size"
            value={dataSize}
            min={20}
            max={150}
            step={10}
            onChange={setDataSize}
          />
        </>
      }
      metrics={[
        { label: "Classification Accuracy", value: `${(accuracy * 100).toFixed(1)}%`, highlight: true },
        { label: "Binary Cross-Entropy", value: formatNumber(state.loss, 4), highlight: true },
        { label: "Precision (PPV)", value: `${(precision * 100).toFixed(1)}%` },
        { label: "Recall (Sensitivity)", value: `${(recall * 100).toFixed(1)}%` },
      ]}
      explanations={[
        {
          title: "Sigmoid Activation Function",
          content:
            "Logistic regression maps real-valued linear outputs into the range (0, 1) representing the posterior probability P(y=1|x).",
          latex: "\\sigma(z) = \\frac{1}{1 + e^{-z}}, \\quad P(y=1|x) = \\sigma(w x + b)",
        },
        {
          title: "Binary Cross-Entropy Loss",
          content:
            "Derived from maximum likelihood estimation for Bernoulli trials. Strongly penalizes confident incorrect predictions.",
          latex: "J(w, b) = -\\frac{1}{n}\\sum_{i=1}^n \\left[ y_i \\ln(\\hat{y}_i) + (1 - y_i)\\ln(1 - \\hat{y}_i) \\right]",
        },
      ]}
    />
  );
}
