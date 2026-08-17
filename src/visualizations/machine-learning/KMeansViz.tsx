"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { LabLayout } from "@/components/visualization/LabLayout";
import { Slider } from "@/components/controls/Slider";
import { KMeansEngine } from "@/algorithms/clustering/k-means";
import { generateClusteringData } from "@/algorithms/datasets";
import { formatNumber } from "@/lib/utils";
import {
  drawGrid,
  drawAxes,
  createCoordSystem,
  clearCanvas,
  drawGlowCircle,
  CLUSTER_COLORS,
} from "@/lib/canvas";
import type { DataPoint } from "@/types";

const PSEUDOCODE = [
  "1. Initialize K cluster centroids randomly in feature space",
  "2. For each data point x_i: assign to nearest centroid argmin_k ||x_i - μ_k||²",
  "3. For each cluster k: recompute centroid μ_k = mean(points in cluster k)",
  "4. Calculate inertia J = Σ Σ ||x_i - μ_k||²",
  "5. If centroids shifted < tolerance ε: Stop (Converged). Else repeat 2-4.",
];

interface HistoryState {
  data: DataPoint[];
  assignments: number[];
  centroids: { x: number; y: number; cluster: number }[];
  centroidHistory: { x: number; y: number }[][];
  iteration: number;
  inertia: number;
  converged: boolean;
  phase: string;
}

export default function KMeansViz() {
  const [k, setK] = useState(3);
  const [dataSize, setDataSize] = useState(120);
  const [spread, setSpread] = useState(1.8);
  const [data, setData] = useState<DataPoint[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [currentStep, setCurrentStep] = useState(0);
  const [isConverged, setIsConverged] = useState(false);
  const [seed, setSeed] = useState(42);
  const [phaseText, setPhaseText] = useState("Initialized");
  const [activeCodeLine, setActiveCodeLine] = useState(0);
  const [showVoronoi, setShowVoronoi] = useState(true);
  const [showTrails, setShowTrails] = useState(true);

  const engineRef = useRef(new KMeansEngine());
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animTimerRef = useRef<NodeJS.Timeout | null>(null);
  const historyStackRef = useRef<HistoryState[]>([]);
  const centroidTrailsRef = useRef<{ x: number; y: number }[][]>([]);

  const regenerate = useCallback(() => {
    if (animTimerRef.current) clearTimeout(animTimerRef.current);
    setIsRunning(false);
    setIsPaused(false);
    setIsConverged(false);
    setCurrentStep(0);
    setActiveCodeLine(0);
    setPhaseText("Initialized centroids");

    const newData = generateClusteringData(k, dataSize, spread, seed);
    setData(newData);

    engineRef.current = new KMeansEngine();
    engineRef.current.initialize(newData, k);

    const initialCentroids = engineRef.current.centroids.map((c) => ({ x: c.x, y: c.y }));
    centroidTrailsRef.current = initialCentroids.map((c) => [{ x: c.x, y: c.y }]);
    historyStackRef.current = [];
  }, [k, dataSize, spread, seed]);

  useEffect(() => {
    regenerate();
  }, [regenerate]);

  // Execute 1 Step
  const step = useCallback(() => {
    if (isConverged) return;

    const engine = engineRef.current;
    const oldState = engine.getState(data);

    // Save history snapshot for undo
    historyStackRef.current.push({
      data: [...data],
      assignments: [...oldState.assignments],
      centroids: oldState.centroids.map((c) => ({ ...c })),
      centroidHistory: centroidTrailsRef.current.map((t) => [...t]),
      iteration: oldState.iteration,
      inertia: oldState.inertia,
      converged: oldState.converged,
      phase: phaseText,
    });

    const newState = engine.step(data);
    setCurrentStep(newState.iteration);

    // Update trails
    newState.centroids.forEach((c, idx) => {
      if (!centroidTrailsRef.current[idx]) {
        centroidTrailsRef.current[idx] = [];
      }
      centroidTrailsRef.current[idx].push({ x: c.x, y: c.y });
    });

    if (newState.converged) {
      setIsConverged(true);
      setIsRunning(false);
      setPhaseText(`Converged in ${newState.iteration} iterations!`);
      setActiveCodeLine(4);
    } else {
      setPhaseText(`Step ${newState.iteration}: Assigned points & updated centroids`);
      setActiveCodeLine(2);
    }
  }, [data, isConverged, phaseText]);

  // Step Backward
  const stepBackward = useCallback(() => {
    if (historyStackRef.current.length === 0) return;
    const prevState = historyStackRef.current.pop()!;
    engineRef.current.iteration = prevState.iteration;
    engineRef.current.converged = prevState.converged;
    engineRef.current.centroids = prevState.centroids.map((c) => ({ ...c }));
    engineRef.current.assignments = [...prevState.assignments];
    centroidTrailsRef.current = prevState.centroidHistory.map((t) => [...t]);

    setCurrentStep(prevState.iteration);
    setIsConverged(prevState.converged);
    setPhaseText(prevState.phase);
    setActiveCodeLine(1);
  }, []);

  // Auto-play loop
  useEffect(() => {
    if (isRunning && !isPaused && !isConverged) {
      const delay = Math.max(80, 800 / speed);
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
    let iter = 0;
    while (!engineRef.current.converged && iter < 50) {
      engineRef.current.step(data);
      iter++;
    }
    const finalState = engineRef.current.getState(data);
    setCurrentStep(finalState.iteration);
    setIsConverged(true);
    setPhaseText(`Fast-forwarded to convergence in ${finalState.iteration} iterations!`);
    setActiveCodeLine(4);
  };

  // Add custom point on canvas click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const xRange: [number, number] = [-7, 7];
    const yRange: [number, number] = [-7, 7];
    const { fromCanvas } = createCoordSystem(rect.width, rect.height, 40, xRange, yRange);
    const coords = fromCanvas(cx, cy);

    const newPoint: DataPoint = { x: coords.x, y: coords.y };
    const updatedData = [...data, newPoint];
    setData(updatedData);
    // Assign to closest centroid immediately
    if (engineRef.current.centroids.length > 0) {
      engineRef.current.step(updatedData);
    }
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
    const xRange: [number, number] = [-7, 7];
    const yRange: [number, number] = [-7, 7];
    const { toCanvas } = createCoordSystem(w, h, padding, xRange, yRange);

    clearCanvas(ctx, w, h);
    drawGrid(ctx, w, h, padding, xRange, yRange);
    drawAxes(ctx, w, h, padding, xRange, yRange);

    const state = engineRef.current.getState(data);

    // Voronoi Background Partition Cells
    if (showVoronoi && state.centroids.length > 0) {
      const vRes = 35;
      const cellW = (w - padding * 2) / vRes;
      const cellH = (h - padding * 2) / vRes;

      for (let i = 0; i < vRes; i++) {
        for (let j = 0; j < vRes; j++) {
          const px = xRange[0] + (i / vRes) * (xRange[1] - xRange[0]);
          const py = yRange[0] + (j / vRes) * (yRange[1] - yRange[0]);

          let nearestCent = 0;
          let minDist = Infinity;
          state.centroids.forEach((cent, cIdx) => {
            const distSq = (px - cent.x) ** 2 + (py - cent.y) ** 2;
            if (distSq < minDist) {
              minDist = distSq;
              nearestCent = cIdx;
            }
          });

          const { cx, cy } = toCanvas(px, py);
          const colorHex = CLUSTER_COLORS[nearestCent % CLUSTER_COLORS.length];
          ctx.fillStyle = `${colorHex}14`; // 8% opacity
          ctx.fillRect(cx, cy - cellH, cellW + 1, cellH + 1);
        }
      }
    }

    // Centroid Motion Trail Lines
    if (showTrails) {
      centroidTrailsRef.current.forEach((trail, cIdx) => {
        if (trail.length > 1) {
          ctx.beginPath();
          const first = toCanvas(trail[0].x, trail[0].y);
          ctx.moveTo(first.cx, first.cy);
          for (let t = 1; t < trail.length; t++) {
            const p = toCanvas(trail[t].x, trail[t].y);
            ctx.lineTo(p.cx, p.cy);
          }
          ctx.strokeStyle = CLUSTER_COLORS[cIdx % CLUSTER_COLORS.length];
          ctx.lineWidth = 2;
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      });
    }

    // Distance lines connecting points to centroids
    data.forEach((p, i) => {
      const cluster = state.assignments[i] ?? 0;
      const cent = state.centroids[cluster];
      if (cent) {
        const pCanvas = toCanvas(p.x, p.y);
        const cCanvas = toCanvas(cent.x, cent.y);
        ctx.beginPath();
        ctx.moveTo(pCanvas.cx, pCanvas.cy);
        ctx.lineTo(cCanvas.cx, cCanvas.cy);
        ctx.strokeStyle = `${CLUSTER_COLORS[cluster % CLUSTER_COLORS.length]}26`; // 15% opacity
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });

    // Data Points
    data.forEach((p, i) => {
      const cluster = state.assignments[i] ?? 0;
      const { cx, cy } = toCanvas(p.x, p.y);
      const color = CLUSTER_COLORS[cluster % CLUSTER_COLORS.length];

      ctx.beginPath();
      ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.7)";
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Centroid Markers with Glowing Halos & Crosshairs
    state.centroids.forEach((cent, cIdx) => {
      const { cx, cy } = toCanvas(cent.x, cent.y);
      const color = CLUSTER_COLORS[cent.cluster % CLUSTER_COLORS.length];

      drawGlowCircle(ctx, cx, cy, 11, color, color, "#ffffff");

      // Centroid Crosshairs
      ctx.beginPath();
      ctx.moveTo(cx - 15, cy);
      ctx.lineTo(cx + 15, cy);
      ctx.moveTo(cx, cy - 15);
      ctx.lineTo(cx, cy + 15);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Cluster Label Badge
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`C${cIdx + 1}`, cx, cy - 16);
    });
  }, [data, currentStep, showVoronoi, showTrails]);

  useEffect(() => {
    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [draw]);

  const state = engineRef.current.getState(data);

  return (
    <LabLayout
      algorithmId="k-means"
      title="K-Means Clustering"
      subtitle="Step through iterative centroid partitioning and convergence in real-time."
      currentStep={currentStep}
      maxSteps={30}
      isRunning={isRunning}
      isPaused={isPaused}
      isConverged={isConverged}
      statusMessage={phaseText}
      stepPhase={`Phase: ${phaseText}`}
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
        k,
        inertia: state.inertia,
        centroids: state.centroids,
        dataPoints: data.map((p, i) => ({ ...p, cluster: state.assignments[i] })),
      }}
      visualization={
        <div className="relative w-full h-full">
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            className="w-full h-full cursor-crosshair"
            aria-label="K-Means clustering interactive canvas"
          />
          <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] text-slate-300 pointer-events-none border border-white/10">
            Tip: Click on canvas to add custom points
          </div>
        </div>
      }
      controls={
        <>
          <Slider
            label="K (Number of Clusters)"
            value={k}
            min={2}
            max={8}
            step={1}
            onChange={setK}
            tooltip="Number of centroid groups to partition data into"
          />
          <Slider
            label="Dataset Size"
            value={dataSize}
            min={30}
            max={300}
            step={10}
            onChange={setDataSize}
            tooltip="Total synthetic sample points generated"
          />
          <Slider
            label="Cluster Spread (σ)"
            value={spread}
            min={0.5}
            max={3.5}
            step={0.1}
            onChange={setSpread}
            tooltip="Variance / dispersion of generated Gaussian blobs"
          />
          <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
              <input
                type="checkbox"
                checked={showVoronoi}
                onChange={(e) => setShowVoronoi(e.target.checked)}
                className="rounded text-[var(--accent)]"
              />
              Show Voronoi Partitions
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
              <input
                type="checkbox"
                checked={showTrails}
                onChange={(e) => setShowTrails(e.target.checked)}
                className="rounded text-[var(--accent)]"
              />
              Show Centroid Trails
            </label>
          </div>
        </>
      }
      metrics={[
        { label: "Iteration", value: `${currentStep}`, highlight: true },
        { label: "Inertia (WCSS)", value: formatNumber(state.inertia, 1), highlight: true },
        { label: "Converged", value: isConverged ? "Yes ✓" : "In Progress" },
        { label: "Active Clusters", value: k },
      ]}
      explanations={[
        {
          title: "Step 1: Assignment Phase (Voronoi Partitioning)",
          content:
            "Every data point calculates its squared Euclidean distance to all K centroids and is assigned to the nearest centroid.",
          latex: "C_k^{(t)} = \\left\\{ x_i : \\|x_i - \\mu_k^{(t)}\\|^2 \\le \\|x_i - \\mu_j^{(t)}\\|^2 \\quad \\forall j \\right\\}",
        },
        {
          title: "Step 2: Update Phase (Centroid Relocation)",
          content:
            "Centroids move to the center of mass (mean coordinate) of all points currently assigned to that cluster.",
          latex: "\\mu_k^{(t+1)} = \\frac{1}{|C_k^{(t)}|} \\sum_{x_i \\in C_k^{(t)}} x_i",
        },
        {
          title: "Objective Function: Within-Cluster Sum of Squares (Inertia)",
          content:
            "K-Means is guaranteed to decrease or keep constant the total inertia at every single step until local minimum convergence.",
          latex: "J = \\sum_{k=1}^{K} \\sum_{x \\in C_k} \\|x - \\mu_k\\|^2",
        },
      ]}
    />
  );
}
