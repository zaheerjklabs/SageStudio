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
} from "@/lib/canvas";
import type { DataPoint } from "@/types";

export default function LogisticRegressionViz() {
  const [dataSize, setDataSize] = useState(100);
  const [learningRate, setLearningRate] = useState(0.1);
  const [threshold, setThreshold] = useState(0.5);
  const [data, setData] = useState<DataPoint[]>([]);
  const [isTraining, setIsTraining] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const engineRef = useRef(new LogisticRegressionEngine(0, 0, 0.1));
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  const regenerate = useCallback(() => {
    const newData: DataPoint[] = [];
    for (let i = 0; i < dataSize; i++) {
      const x = (Math.random() - 0.5) * 10;
      const prob = 1 / (1 + Math.exp(-x * 0.8));
      const label = Math.random() < prob ? 1 : 0;
      newData.push({ x, y: label, label });
    }
    setData(newData);
    engineRef.current = new LogisticRegressionEngine(0, 0, learningRate);
  }, [dataSize, learningRate]);

  useEffect(() => {
    regenerate();
  }, [regenerate]);

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
    const padding = 50;
    const xRange: [number, number] = [-6, 6];
    const yRange: [number, number] = [-0.2, 1.2];
    const { toCanvas } = createCoordSystem(w, h, padding, xRange, yRange);

    clearCanvas(ctx, w, h);
    drawGrid(ctx, w, h, padding, xRange, yRange);
    drawAxes(ctx, w, h, padding, xRange, yRange);

    const engine = engineRef.current;

    // Draw sigmoid curve
    ctx.beginPath();
    for (let x = xRange[0]; x <= xRange[1]; x += 0.1) {
      const y = engine.predict(x);
      const { cx, cy } = toCanvas(x, y);
      if (x === xRange[0]) {
        ctx.moveTo(cx, cy);
      } else {
        ctx.lineTo(cx, cy);
      }
    }
    ctx.strokeStyle = "#6366f1";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw threshold line
    const threshLeft = toCanvas(xRange[0], threshold);
    const threshRight = toCanvas(xRange[1], threshold);
    ctx.beginPath();
    ctx.moveTo(threshLeft.cx, threshLeft.cy);
    ctx.lineTo(threshRight.cx, threshRight.cy);
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw data points
    data.forEach((p) => {
      const { cx, cy } = toCanvas(p.x, p.label!);
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fillStyle = p.label === 1 ? "#10b981" : "#ef4444";
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
  }, [data, threshold]);

  useEffect(() => {
    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [draw]);

  const train = useCallback(() => {
    setIsTraining(true);
    setIsPaused(false);
    engineRef.current.learningRate = learningRate;

    const loop = () => {
      if (!isPaused) {
        engineRef.current.gradientStep(data);
        draw();
        if (engineRef.current.lossHistory.length < 300) {
          animRef.current = requestAnimationFrame(loop);
        } else {
          setIsTraining(false);
        }
      }
    };
    animRef.current = requestAnimationFrame(loop);
  }, [data, learningRate, isPaused, draw]);

  useEffect(() => () => cancelAnimationFrame(animRef.current), []);

  const state = engineRef.current.getState(data);
  const accuracy = data.reduce((acc, p) => {
    return acc + (engineRef.current.predictClass(p.x, threshold) === p.label ? 1 : 0);
  }, 0) / data.length;

  return (
    <LabLayout
      algorithmId="logistic-regression"
      title="Logistic Regression"
      subtitle="Binary classification with sigmoid decision boundary"
      onReset={() => {
        cancelAnimationFrame(animRef.current);
        setIsTraining(false);
        regenerate();
      }}
      onRandomize={() => regenerate()}
      onRun={train}
      onPause={() => setIsPaused(true)}
      isTraining={isTraining}
      isPaused={isPaused}
      visualization={
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          aria-label="Logistic regression visualization"
        />
      }
      controls={
        <>
          <Slider
            label="Dataset Size"
            value={dataSize}
            min={20}
            max={200}
            step={10}
            onChange={setDataSize}
            tooltip="Number of data points"
          />
          <Slider
            label="Learning Rate"
            value={learningRate}
            min={0.001}
            max={0.5}
            step={0.01}
            onChange={setLearningRate}
            tooltip="Step size for gradient descent"
            formatValue={(v) => v.toFixed(3)}
          />
          <Slider
            label="Decision Threshold"
            value={threshold}
            min={0}
            max={1}
            step={0.05}
            onChange={setThreshold}
            tooltip="Classification threshold"
            formatValue={(v) => v.toFixed(2)}
          />
        </>
      }
      metrics={[
        { label: "Weight", value: formatNumber(state.weight), highlight: true },
        { label: "Bias", value: formatNumber(state.bias), highlight: true },
        { label: "Log Loss", value: formatNumber(state.loss) },
        { label: "Accuracy", value: `${(accuracy * 100).toFixed(1)}%` },
      ]}
      explanations={[
        {
          title: "What is happening?",
          content:
            "The model learns a sigmoid curve that separates two classes. Points above the threshold (yellow line) are classified as class 1 (green), below as class 0 (red).",
        },
        {
          title: "Mathematics",
          content:
            "Logistic regression uses the sigmoid function to map predictions to probabilities between 0 and 1.",
          latex: "\\sigma(z) = \\frac{1}{1 + e^{-z}}, \\quad z = wx + b",
        },
        {
          title: "Loss Function",
          content:
            "Binary cross-entropy (log loss) penalizes confident wrong predictions more than uncertain ones.",
          latex:
            "L = -\\frac{1}{n}\\sum_{i=1}^{n}[y_i\\log(\\hat{y}_i) + (1-y_i)\\log(1-\\hat{y}_i)]",
        },
      ]}
    />
  );
}
