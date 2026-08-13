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
} from "@/lib/canvas";
import type { DataPoint } from "@/types";

const STEPS = [
  { title: "Generate Dataset", description: "Create synthetic data points with noise around a true linear relationship.", latex: "y = wx + b + \\epsilon" },
  { title: "Initialize Parameters", description: "Start with random weight and bias values.", latex: "\\hat{y} = wx + b" },
  { title: "Make Predictions", description: "Use current parameters to predict y for each x.", latex: "\\hat{y}_i = wx_i + b" },
  { title: "Calculate Loss", description: "Compute Mean Squared Error between predictions and actual values.", latex: "L = \\frac{1}{n}\\sum_{i=1}^{n}(y_i - \\hat{y}_i)^2" },
  { title: "Calculate Gradient", description: "Compute partial derivatives of loss with respect to w and b.", latex: "\\frac{\\partial L}{\\partial w} = \\frac{2}{n}\\sum_{i=1}^{n}(\\hat{y}_i - y_i)x_i" },
  { title: "Update Parameters", description: "Move parameters in the direction that reduces loss.", latex: "w \\leftarrow w - \\alpha \\frac{\\partial L}{\\partial w}" },
  { title: "Repeat", description: "Continue training for multiple epochs until convergence.", latex: "\\text{Repeat steps 3-6}" },
  { title: "Converge", description: "The regression line now closely fits the data.", latex: "\\nabla L \\approx 0" },
];

export default function LinearRegressionViz() {
  const [dataSize, setDataSize] = useState(50);
  const [noise, setNoise] = useState(2);
  const [learningRate, setLearningRate] = useState(0.01);
  const [initialSlope, setInitialSlope] = useState(0);
  const [initialIntercept, setInitialIntercept] = useState(0);
  const [data, setData] = useState<DataPoint[]>([]);
  const [isTraining, setIsTraining] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [stepMode, setStepMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [seed, setSeed] = useState(42);

  const engineRef = useRef(new LinearRegressionEngine(0, 0, 0.01));
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  const regenerate = useCallback(() => {
    const newData = generateRegressionData(dataSize, 1.5, 0.5, noise, seed);
    setData(newData);
    engineRef.current = new LinearRegressionEngine(initialSlope, initialIntercept, learningRate);
    engineRef.current.reset(initialSlope, initialIntercept);
  }, [dataSize, noise, initialSlope, initialIntercept, learningRate, seed]);

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
    const yRange: [number, number] = [-6, 6];
    const { toCanvas } = createCoordSystem(w, h, padding, xRange, yRange);

    clearCanvas(ctx, w, h);
    drawGrid(ctx, w, h, padding, xRange, yRange);
    drawAxes(ctx, w, h, padding, xRange, yRange);

    const engine = engineRef.current;

    // Regression line
    const x1 = xRange[0];
    const x2 = xRange[1];
    const y1 = engine.predict(x1);
    const y2 = engine.predict(x2);
    const p1 = toCanvas(x1, y1);
    const p2 = toCanvas(x2, y2);

    ctx.beginPath();
    ctx.moveTo(p1.cx, p1.cy);
    ctx.lineTo(p2.cx, p2.cy);
    ctx.strokeStyle = "#6366f1";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Residuals
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

    // Data points
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
        engineRef.current.gradientStep(data);
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
      algorithmId="linear-regression"
      title="Linear Regression"
      subtitle="Watch a model learn the relationship between data points."
      onReset={() => { cancelAnimationFrame(animRef.current); setIsTraining(false); regenerate(); }}
      onRandomize={() => { setSeed(Math.floor(Math.random() * 10000)); }}
      onRun={train}
      onPause={() => setIsPaused(true)}
      isTraining={isTraining}
      isPaused={isPaused}
      showStepMode
      stepModeActive={stepMode}
      onToggleStepMode={() => setStepMode(!stepMode)}
      steps={STEPS}
      currentStep={currentStep}
      onNextStep={() => setCurrentStep((s) => Math.min(s + 1, STEPS.length - 1))}
      visualization={
        <canvas ref={canvasRef} className="w-full h-full" aria-label="Linear regression visualization" />
      }
      controls={
        <>
          <Slider 
            label="Dataset Size" 
            value={dataSize} 
            min={10} 
            max={200} 
            step={1} 
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
            tooltip="Gaussian noise added to data" 
          />
          <Slider 
            label="Learning Rate" 
            value={learningRate} 
            min={0.001} 
            max={0.1} 
            step={0.001} 
            onChange={setLearningRate} 
            tooltip="Step size for gradient descent" 
            formatValue={(v) => v.toFixed(3)} 
          />
          <Slider 
            label="Initial Slope" 
            value={initialSlope} 
            min={-3} 
            max={3} 
            step={0.1} 
            onChange={setInitialSlope} 
          />
          <Slider 
            label="Initial Intercept" 
            value={initialIntercept} 
            min={-3} 
            max={3} 
            step={0.1} 
            onChange={setInitialIntercept} 
          />
        </>
      }
      metrics={[
        { label: "Weight", value: formatNumber(state.weight), highlight: true },
        { label: "Bias", value: formatNumber(state.bias), highlight: true },
        { label: "MSE", value: formatNumber(state.loss) },
        { label: "Epoch", value: state.lossHistory.length },
      ]}
      explanations={[
        {
          title: "What is happening?",
          content: "The model is adjusting the regression line to reduce the difference between its predictions and the actual data points. Red lines show residuals (errors).",
        },
        {
          title: "Why?",
          content: "Gradient descent calculates the direction in which the loss decreases fastest, then updates the weight and bias accordingly.",
          latex: "w \\leftarrow w - \\alpha \\frac{\\partial L}{\\partial w}, \\quad b \\leftarrow b - \\alpha \\frac{\\partial L}{\\partial b}",
        },
        {
          title: "Mathematics",
          content: "Linear regression finds the best-fit line by minimizing Mean Squared Error.",
          latex: "L = \\frac{1}{n}\\sum_{i=1}^{n}(y_i - (wx_i + b))^2",
        },
      ]}
    />
  );
}
