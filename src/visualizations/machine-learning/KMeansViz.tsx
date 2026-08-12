"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { LabLayout } from "@/components/visualization/LabLayout";
import { Slider } from "@/components/controls/Slider";
import { KMeansEngine } from "@/algorithms/clustering/k-means";
import { generateClusteringData } from "@/algorithms/datasets";
import { formatNumber } from "@/lib/utils";
import { drawGrid, drawAxes, createCoordSystem, CLUSTER_COLORS } from "@/lib/canvas";
import type { DataPoint } from "@/types";

export default function KMeansViz() {
  const [k, setK] = useState(3);
  const [dataSize, setDataSize] = useState(150);
  const [spread, setSpread] = useState(2);
  const [data, setData] = useState<DataPoint[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [tick, setTick] = useState(0);
  const [seed, setSeed] = useState(42);

  const engineRef = useRef(new KMeansEngine());
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  const regenerate = useCallback(() => {
    const newData = generateClusteringData(k, dataSize, spread, seed);
    setData(newData);
    engineRef.current = new KMeansEngine();
    engineRef.current.initialize(newData, k);
    setTick((t) => t + 1);
  }, [k, dataSize, spread, seed]);

  useEffect(() => { regenerate(); }, [regenerate]);

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
    const xRange: [number, number] = [-7, 7];
    const yRange: [number, number] = [-7, 7];
    const { toCanvas } = createCoordSystem(w, h, padding, xRange, yRange);

    ctx.clearRect(0, 0, w, h);
    drawGrid(ctx, w, h, padding, xRange, yRange);
    drawAxes(ctx, w, h, padding, xRange, yRange);

    const state = engineRef.current.getState(data);

    data.forEach((p, i) => {
      const cluster = state.assignments[i] ?? 0;
      const { cx, cy } = toCanvas(p.x, p.y);
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fillStyle = CLUSTER_COLORS[cluster % CLUSTER_COLORS.length];
      ctx.globalAlpha = 0.7;
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    state.centroids.forEach((cent) => {
      const { cx, cy } = toCanvas(cent.x, cent.y);
      ctx.beginPath();
      ctx.arc(cx, cy, 10, 0, Math.PI * 2);
      ctx.fillStyle = CLUSTER_COLORS[cent.cluster % CLUSTER_COLORS.length];
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx - 14, cy);
      ctx.lineTo(cx + 14, cy);
      ctx.moveTo(cx, cy - 14);
      ctx.lineTo(cx, cy + 14);
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }, [data, tick]);

  useEffect(() => {
    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [draw]);

  const run = useCallback(() => {
    setIsRunning(true);
    const loop = () => {
      const state = engineRef.current.step(data);
      setTick((t) => t + 1);
      if (!state.converged && engineRef.current.iteration < 50) {
        animRef.current = requestAnimationFrame(loop);
      } else {
        setIsRunning(false);
      }
    };
    animRef.current = requestAnimationFrame(loop);
  }, [data]);

  const step = useCallback(() => {
    engineRef.current.step(data);
    setTick((t) => t + 1);
  }, [data]);

  useEffect(() => () => cancelAnimationFrame(animRef.current), []);

  const state = engineRef.current.getState(data);

  return (
    <LabLayout
      algorithmId="k-means"
      title="K-Means Clustering"
      subtitle="Watch clusters form step by step."
      onReset={regenerate}
      onRandomize={() => setSeed(Math.floor(Math.random() * 10000))}
      onRun={run}
      onStep={step}
      isTraining={isRunning}
      visualization={
        <canvas ref={canvasRef} className="w-full h-full" aria-label="K-Means clustering visualization" />
      }
      controls={
        <>
          <Slider label="K (Clusters)" value={k} min={2} max={8} step={1} onChange={setK} tooltip="Number of clusters" />
          <Slider label="Dataset Size" value={dataSize} min={30} max={300} step={10} onChange={setDataSize} />
          <Slider label="Spread" value={spread} min={0.5} max={4} step={0.1} onChange={setSpread} tooltip="Cluster spread" />
        </>
      }
      metrics={[
        { label: "Iteration", value: state.iteration },
        { label: "Inertia", value: formatNumber(state.inertia) },
        { label: "Converged", value: state.converged ? "Yes" : "No" },
        { label: "Clusters", value: k },
      ]}
      explanations={[
        {
          title: "What is happening?",
          content: "K-Means alternates between assigning points to the nearest centroid and updating centroids to the mean of their assigned points.",
        },
        {
          title: "Why?",
          content: "This minimizes within-cluster variance (inertia). The algorithm converges when centroids stop moving.",
          latex: "\\arg\\min_C \\sum_{i=1}^{k} \\sum_{x \\in C_i} \\|x - \\mu_i\\|^2",
        },
      ]}
    />
  );
}
