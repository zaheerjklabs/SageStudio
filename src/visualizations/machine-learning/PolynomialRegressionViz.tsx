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
} from "@/lib/canvas";
import type { DataPoint } from "@/types";

export default function PolynomialRegressionViz() {
  const [dataSize, setDataSize] = useState(40);
  const [noise, setNoise] = useState(1.5);
  const [degree, setDegree] = useState(3);
  const [learningRate, setLearningRate] = useState(0.001);
  const [data, setData] = useState<DataPoint[]>([]);
  const [isTraining, setIsTraining] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const engineRef = useRef(new PolynomialRegressionEngine(degree, learningRate));
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  const regenerate = useCallback(() => {
    const newData: DataPoint[] = [];
    // Generate data from a polynomial with added noise
    for (let i = 0; i < dataSize; i++) {
      const x = (i / dataSize) * 10 - 5;
      // True function: y = 0.1x³ - 0.3x² + 0.5x + 1
      const y = 0.1 * x ** 3 - 0.3 * x ** 2 + 0.5 * x + 1 + (Math.random() - 0.5) * noise * 2;
      newData.push({ x, y });
    }
    setData(newData);
    engineRef.current = new PolynomialRegressionEngine(degree, learningRate);
  }, [dataSize, noise, degree, learningRate]);

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
    const padding = 40;
    const xRange: [number, number] = [-6, 6];
    const yRange: [number, number] = [-8, 8];
    const { toCanvas } = createCoordSystem(w, h, padding, xRange, yRange);

    clearCanvas(ctx, w, h);
    drawGrid(ctx, w, h, padding, xRange, yRange);
    drawAxes(ctx, w, h, padding, xRange, yRange);

    const engine = engineRef.current;

    // Draw polynomial curve
    ctx.beginPath();
    let started = false;
    for (let x = xRange[0]; x <= xRange[1]; x += 0.05) {
      const y = engine.predict(x);
      if (y >= yRange[0] && y <= yRange[1]) {
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
    ctx.lineWidth = 3;
    ctx.stroke();

    // Draw residuals
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

    // Draw data points
    data.forEach((p) => {
      const { cx, cy } = toCanvas(p.x, p.y);
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#10b981";
      ctx.fill();
    });
  }, [data]);

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
        for (let i = 0; i < 5; i++) {
          engineRef.current.gradientStep(data);
        }
        draw();
        if (engineRef.current.lossHistory.length < 500) {
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

  return (
    <LabLayout
      algorithmId="polynomial-regression"
      title="Polynomial Regression"
      subtitle="Fit curves to data with polynomial functions"
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
          aria-label="Polynomial regression visualization"
        />
      }
      controls={
        <>
          <Slider
            label="Polynomial Degree"
            value={degree}
            min={1}
            max={6}
            step={1}
            onChange={(v) => {
              setDegree(v);
              engineRef.current.reset(v);
            }}
            tooltip="Complexity of the polynomial (1=linear, 2=quadratic, etc.)"
          />
          <Slider
            label="Dataset Size"
            value={dataSize}
            min={15}
            max={100}
            step={5}
            onChange={setDataSize}
            tooltip="Number of data points"
          />
          <Slider
            label="Noise"
            value={noise}
            min={0}
            max={5}
            step={0.1}
            onChange={setNoise}
            tooltip="Random noise added to data"
          />
          <Slider
            label="Learning Rate"
            value={learningRate}
            min={0.0001}
            max={0.01}
            step={0.0001}
            onChange={setLearningRate}
            tooltip="Step size for gradient descent"
            formatValue={(v) => v.toFixed(4)}
          />
        </>
      }
      metrics={[
        { label: "Degree", value: degree.toString(), highlight: true },
        { label: "MSE", value: formatNumber(state.loss), highlight: true },
        { label: "Epoch", value: state.lossHistory.length.toString() },
        { label: "Coefficients", value: state.coefficients.length.toString() },
      ]}
      explanations={[
        {
          title: "What is happening?",
          content:
            "The model fits a polynomial curve to the data by learning coefficients for each power of x. Higher degrees allow more complex curves but risk overfitting.",
        },
        {
          title: "Polynomial Form",
          content:
            "A polynomial of degree n is a sum of powers of x, each multiplied by a coefficient that the model learns.",
          latex:
            "y = a_0 + a_1x + a_2x^2 + a_3x^3 + ... + a_nx^n",
        },
        {
          title: "Overfitting vs Underfitting",
          content:
            "Low degrees (1-2) may underfit and miss patterns. High degrees (5+) may overfit, following noise instead of the true pattern. Choose degree based on data complexity.",
        },
      ]}
    />
  );
}
