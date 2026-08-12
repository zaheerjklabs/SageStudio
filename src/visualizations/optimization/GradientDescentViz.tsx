"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { LabLayout } from "@/components/visualization/LabLayout";
import { Slider } from "@/components/controls/Slider";
import { GradientDescentEngine, computeLossLandscape } from "@/algorithms/optimization/gradient-descent";
import { formatNumber } from "@/lib/utils";
import type { OptimizerType } from "@/algorithms/optimization/gradient-descent";

const OPTIMIZERS: { label: string; value: OptimizerType }[] = [
  { label: "Gradient Descent", value: "gd" },
  { label: "SGD", value: "sgd" },
  { label: "Momentum", value: "momentum" },
  { label: "RMSProp", value: "rmsprop" },
  { label: "Adam", value: "adam" },
];

export default function GradientDescentViz() {
  const [learningRate, setLearningRate] = useState(0.05);
  const [startX, setStartX] = useState(3);
  const [startY, setStartY] = useState(2);
  const [optimizer, setOptimizer] = useState<OptimizerType>("gd");
  const [isRunning, setIsRunning] = useState(false);
  const [tick, setTick] = useState(0);

  const engineRef = useRef(new GradientDescentEngine(3, 2, 0.05, "gd"));
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lossCanvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const landscapeRef = useRef(computeLossLandscape(50, [-4, 4], [-3, 3]));

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
    const padding = 30;
    const xRange: [number, number] = [-4, 4];
    const yRange: [number, number] = [-3, 3];

    const toCanvas = (x: number, y: number) => ({
      cx: padding + ((x - xRange[0]) / (xRange[1] - xRange[0])) * (w - padding * 2),
      cy: h - padding - ((y - yRange[0]) / (yRange[1] - yRange[0])) * (h - padding * 2),
    });

    ctx.clearRect(0, 0, w, h);

    // Loss landscape heatmap
    const grid = landscapeRef.current;
    const maxZ = Math.max(...grid.flat().map((p) => p.z));
    for (let i = 0; i < grid.length - 1; i++) {
      for (let j = 0; j < grid[i].length - 1; j++) {
        const p = grid[i][j];
        const intensity = 1 - p.z / maxZ;
        const { cx, cy } = toCanvas(p.x, p.y);
        const cellW = (w - padding * 2) / grid[0].length;
        const cellH = (h - padding * 2) / grid.length;
        ctx.fillStyle = `rgba(99, 102, 241, ${intensity * 0.3})`;
        ctx.fillRect(cx, cy - cellH, cellW + 1, cellH + 1);
      }
    }

    const engine = engineRef.current;
    const state = engine.getState();

    // Path
    if (state.path.length > 1) {
      ctx.beginPath();
      const first = toCanvas(state.path[0].x, state.path[0].y);
      ctx.moveTo(first.cx, first.cy);
      for (let i = 1; i < state.path.length; i++) {
        const p = toCanvas(state.path[i].x, state.path[i].y);
        ctx.lineTo(p.cx, p.cy);
      }
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Gradient vector
    const gradX = 2 * state.x;
    const gradY = 20 * state.y;
    const pos = toCanvas(state.x, state.y);
    const gradEnd = toCanvas(state.x - gradX * 0.05, state.y - gradY * 0.05);
    ctx.beginPath();
    ctx.moveTo(pos.cx, pos.cy);
    ctx.lineTo(gradEnd.cx, gradEnd.cy);
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Current position
    ctx.beginPath();
    ctx.arc(pos.cx, pos.cy, 8, 0, Math.PI * 2);
    ctx.fillStyle = "#6366f1";
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Minimum
    const minPos = toCanvas(0, 0);
    ctx.beginPath();
    ctx.arc(minPos.cx, minPos.cy, 5, 0, Math.PI * 2);
    ctx.fillStyle = "#f59e0b";
    ctx.fill();

    // Loss chart
    const lossCanvas = lossCanvasRef.current;
    if (lossCanvas && state.path.length > 0) {
      const lctx = lossCanvas.getContext("2d");
      if (lctx) {
        const lr = lossCanvas.getBoundingClientRect();
        lossCanvas.width = lr.width * dpr;
        lossCanvas.height = lr.height * dpr;
        lctx.scale(dpr, dpr);
        lctx.clearRect(0, 0, lr.width, lr.height);

        const losses = state.path.map((p) => p.loss);
        const maxLoss = Math.max(...losses, 0.01);
        const lp = 20;

        lctx.beginPath();
        losses.forEach((loss, i) => {
          const x = lp + (i / Math.max(losses.length - 1, 1)) * (lr.width - lp * 2);
          const y = lr.height - lp - (loss / maxLoss) * (lr.height - lp * 2);
          if (i === 0) lctx.moveTo(x, y);
          else lctx.lineTo(x, y);
        });
        lctx.strokeStyle = "#6366f1";
        lctx.lineWidth = 2;
        lctx.stroke();

        lctx.fillStyle = "rgba(128,128,128,0.5)";
        lctx.font = "10px monospace";
        lctx.fillText("Loss vs Iteration", lp, 14);
      }
    }
  }, [tick]);

  useEffect(() => {
    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [draw]);

  const run = useCallback(() => {
    setIsRunning(true);
    engineRef.current.learningRate = learningRate;
    engineRef.current.optimizer = optimizer;

    const loop = () => {
      engineRef.current.step();
      setTick((t) => t + 1);
      if (engineRef.current.iteration < 200) {
        animRef.current = requestAnimationFrame(loop);
      } else {
        setIsRunning(false);
      }
    };
    animRef.current = requestAnimationFrame(loop);
  }, [learningRate, optimizer]);

  const reset = useCallback(() => {
    cancelAnimationFrame(animRef.current);
    setIsRunning(false);
    engineRef.current.reset(startX, startY);
    engineRef.current.learningRate = learningRate;
    engineRef.current.optimizer = optimizer;
    setTick((t) => t + 1);
  }, [startX, startY, learningRate, optimizer]);

  useEffect(() => () => cancelAnimationFrame(animRef.current), []);

  const state = engineRef.current.getState();

  return (
    <LabLayout
      algorithmId="gradient-descent"
      title="Gradient Descent"
      subtitle="See optimization happen in real time."
      onReset={reset}
      onRun={run}
      isTraining={isRunning}
      visualization={
        <div className="w-full h-full flex flex-col">
          <canvas ref={canvasRef} className="flex-1 w-full" aria-label="Loss landscape" />
          <canvas ref={lossCanvasRef} className="h-24 w-full border-t border-[var(--border)]" aria-label="Loss curve" />
        </div>
      }
      controls={
        <>
          <Slider label="Learning Rate" value={learningRate} min={0.001} max={0.2} step={0.001} onChange={setLearningRate} tooltip="Controls step size" formatValue={(v) => v.toFixed(3)} />
          <Slider label="Start X" value={startX} min={-3.5} max={3.5} step={0.1} onChange={setStartX} />
          <Slider label="Start Y" value={startY} min={-2.5} max={2.5} step={0.1} onChange={setStartY} />
          <div className="space-y-2">
            <label className="text-sm font-medium">Optimizer</label>
            <select
              value={optimizer}
              onChange={(e) => setOptimizer(e.target.value as OptimizerType)}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm"
            >
              {OPTIMIZERS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </>
      }
      metrics={[
        { label: "X", value: formatNumber(state.x) },
        { label: "Y", value: formatNumber(state.y) },
        { label: "Loss", value: formatNumber(state.loss), highlight: true },
        { label: "Iteration", value: state.iteration },
      ]}
      explanations={[
        {
          title: "What is happening?",
          content: "The optimizer is navigating a loss landscape f(x,y) = x² + 10y² toward the global minimum at (0,0). The red arrow shows the negative gradient direction.",
        },
        {
          title: "Why?",
          content: "Gradient descent moves in the direction of steepest descent, scaled by the learning rate.",
          latex: "\\theta_{t+1} = \\theta_t - \\alpha \\nabla L(\\theta_t)",
        },
        {
          title: "Mathematics",
          content: "The loss function and its gradient for this 2D example.",
          latex: "L(x,y) = x^2 + 10y^2, \\quad \\nabla L = (2x, 20y)",
        },
      ]}
    />
  );
}
