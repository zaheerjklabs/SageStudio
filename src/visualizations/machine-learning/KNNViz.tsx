"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { LabLayout } from "@/components/visualization/LabLayout";
import { Slider } from "@/components/controls/Slider";
import { KNNEngine } from "@/algorithms/classification/knn";
import { formatNumber } from "@/lib/utils";
import {
  drawGrid,
  drawAxes,
  createCoordSystem,
  clearCanvas,
  drawGlowCircle,
} from "@/lib/canvas";
import type { DataPoint } from "@/types";

export type DistanceMetric = "euclidean" | "manhattan" | "chebyshev";

const METRICS: { label: string; value: DistanceMetric }[] = [
  { label: "Euclidean (L2)", value: "euclidean" },
  { label: "Manhattan (L1)", value: "manhattan" },
  { label: "Chebyshev (L∞)", value: "chebyshev" },
];

const PSEUDOCODE = [
  "1. Input query point x_q and parameter K",
  "2. For every training sample x_i: compute distance d(x_q, x_i)",
  "3. Sort samples in ascending order of distance: d_1 ≤ d_2 ≤ ... ≤ d_N",
  "4. Select the top K nearest neighbors: N_K(x_q) = {x_(1), ..., x_(K)}",
  "5. Compute class probabilities by majority voting: ŷ = mode(y_i for x_i in N_K)",
];

function calculateDistance(p1: DataPoint, p2: DataPoint, metric: DistanceMetric): number {
  const dx = Math.abs(p1.x - p2.x);
  const dy = Math.abs(p1.y - p2.y);
  if (metric === "manhattan") return dx + dy;
  if (metric === "chebyshev") return Math.max(dx, dy);
  return Math.sqrt(dx * dx + dy * dy);
}

export default function KNNViz() {
  const [k, setK] = useState(5);
  const [dataSize, setDataSize] = useState(60);
  const [metric, setMetric] = useState<DistanceMetric>("euclidean");
  const [queryPoint, setQueryPoint] = useState<DataPoint>({ x: 0.2, y: 0.4 });
  const [data, setData] = useState<DataPoint[]>([]);
  const [seed, setSeed] = useState(42);
  const [showBoundary, setShowBoundary] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [isDraggingQuery, setIsDraggingQuery] = useState(false);
  const [activeCodeLine, setActiveCodeLine] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<KNNEngine>(new KNNEngine(k, []));

  const regenerate = useCallback(() => {
    const newData: DataPoint[] = [];
    // Class 0: cluster around (-2, -1.5)
    for (let i = 0; i < dataSize / 2; i++) {
      newData.push({
        x: -2 + (Math.random() - 0.5) * 3.5,
        y: -1.5 + (Math.random() - 0.5) * 3.5,
        label: 0,
      });
    }
    // Class 1: cluster around (1.8, 1.8)
    for (let i = 0; i < dataSize / 2; i++) {
      newData.push({
        x: 1.8 + (Math.random() - 0.5) * 3.5,
        y: 1.8 + (Math.random() - 0.5) * 3.5,
        label: 1,
      });
    }

    setData(newData);
    engineRef.current = new KNNEngine(k, newData);
    setCurrentStep(0);
  }, [dataSize, k]);

  useEffect(() => {
    regenerate();
  }, [regenerate]);

  // Compute distances and sort
  const scoredData = data.map((p) => ({
    point: p,
    dist: calculateDistance(queryPoint, p, metric),
  }));
  scoredData.sort((a, b) => a.dist - b.dist);

  const kNeighbors = scoredData.slice(0, k);
  const class0Count = kNeighbors.filter((n) => n.point.label === 0).length;
  const class1Count = kNeighbors.filter((n) => n.point.label === 1).length;
  const predictedClass = class1Count >= class0Count ? 1 : 0;
  const maxKDistance = kNeighbors.length > 0 ? kNeighbors[kNeighbors.length - 1].dist : 1;

  // Step through phases: (0) Query placed -> (1) Distance computation -> (2) Neighbors selected -> (3) Majority vote
  const step = () => {
    setCurrentStep((s) => {
      const next = (s + 1) % 4;
      setActiveCodeLine(next + 1);
      return next;
    });
  };

  const stepBackward = () => {
    setCurrentStep((s) => {
      const next = Math.max(0, s - 1);
      setActiveCodeLine(next + 1);
      return next;
    });
  };

  // Canvas Mouse Interactions (Dragging query point or adding data point)
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const xRange: [number, number] = [-5, 5];
    const yRange: [number, number] = [-5, 5];
    const { toCanvas, fromCanvas } = createCoordSystem(rect.width, rect.height, 40, xRange, yRange);

    const qCanvas = toCanvas(queryPoint.x, queryPoint.y);
    const distToQ = Math.hypot(cx - qCanvas.cx, cy - qCanvas.cy);

    if (distToQ < 20) {
      setIsDraggingQuery(true);
    } else {
      // Clicked outside -> move query point there
      const coords = fromCanvas(cx, cy);
      setQueryPoint({ x: coords.x, y: coords.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingQuery) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const xRange: [number, number] = [-5, 5];
    const yRange: [number, number] = [-5, 5];
    const { fromCanvas } = createCoordSystem(rect.width, rect.height, 40, xRange, yRange);
    const coords = fromCanvas(cx, cy);
    setQueryPoint({
      x: Math.max(-4.8, Math.min(4.8, coords.x)),
      y: Math.max(-4.8, Math.min(4.8, coords.y)),
    });
  };

  const handleMouseUp = () => {
    setIsDraggingQuery(false);
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
    const xRange: [number, number] = [-5, 5];
    const yRange: [number, number] = [-5, 5];
    const { toCanvas } = createCoordSystem(w, h, padding, xRange, yRange);

    clearCanvas(ctx, w, h);

    // Decision boundary background
    if (showBoundary && data.length > 0) {
      const bRes = 35;
      const cellW = (w - padding * 2) / bRes;
      const cellH = (h - padding * 2) / bRes;

      for (let i = 0; i < bRes; i++) {
        for (let j = 0; j < bRes; j++) {
          const px = xRange[0] + (i / bRes) * (xRange[1] - xRange[0]);
          const py = yRange[0] + (j / bRes) * (yRange[1] - yRange[0]);
          const testPt = { x: px, y: py };

          // Fast KNN prediction for test cell
          const localScored = data.map((dp) => ({
            label: dp.label,
            d: calculateDistance(testPt, dp, metric),
          }));
          localScored.sort((a, b) => a.d - b.d);
          const topK = localScored.slice(0, k);
          const c1 = topK.filter((n) => n.label === 1).length;
          const pred = c1 >= k / 2 ? 1 : 0;

          const { cx, cy } = toCanvas(px, py);
          ctx.fillStyle = pred === 1 ? "rgba(16, 185, 129, 0.12)" : "rgba(239, 68, 68, 0.12)";
          ctx.fillRect(cx, cy - cellH, cellW + 1, cellH + 1);
        }
      }
    }

    drawGrid(ctx, w, h, padding, xRange, yRange);
    drawAxes(ctx, w, h, padding, xRange, yRange);

    const qCanvas = toCanvas(queryPoint.x, queryPoint.y);

    // Pulsing Search Radius Circle enclosing top-K neighbors
    if (currentStep >= 1 && kNeighbors.length > 0) {
      const radiusPt = toCanvas(queryPoint.x + maxKDistance, queryPoint.y);
      const pixelRadius = Math.abs(radiusPt.cx - qCanvas.cx);

      ctx.save();
      ctx.beginPath();
      ctx.arc(qCanvas.cx, qCanvas.cy, pixelRadius, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(99, 102, 241, 0.08)";
      ctx.fill();
      ctx.strokeStyle = "rgba(99, 102, 241, 0.5)";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.restore();
    }

    // Connecting lines to K nearest neighbors
    if (currentStep >= 1) {
      kNeighbors.forEach((kn, rank) => {
        const ptCanvas = toCanvas(kn.point.x, kn.point.y);
        ctx.beginPath();
        ctx.moveTo(qCanvas.cx, qCanvas.cy);
        ctx.lineTo(ptCanvas.cx, ptCanvas.cy);
        ctx.strokeStyle = kn.point.label === 1 ? "rgba(16, 185, 129, 0.7)" : "rgba(239, 68, 68, 0.7)";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Rank badge (1 to K)
        const midX = (qCanvas.cx + ptCanvas.cx) / 2;
        const midY = (qCanvas.cy + ptCanvas.cy) / 2;
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 9px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`#${rank + 1}`, midX, midY - 3);
      });
    }

    // Training Data Points
    data.forEach((p) => {
      const { cx, cy } = toCanvas(p.x, p.y);
      const isNeighbor = kNeighbors.some((kn) => kn.point === p);
      const color = p.label === 1 ? "#10b981" : "#ef4444";

      if (isNeighbor && currentStep >= 2) {
        drawGlowCircle(ctx, cx, cy, 7, color, color, "#ffffff");
      } else {
        ctx.beginPath();
        ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.7)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });

    // Query Point Marker
    const queryColor = predictedClass === 1 ? "#10b981" : "#ef4444";
    drawGlowCircle(ctx, qCanvas.cx, qCanvas.cy, 10, queryColor, "rgba(99, 102, 241, 0.9)", "#ffffff");

    // Target label icon on query point
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("?", qCanvas.cx, qCanvas.cy + 3.5);
  }, [data, queryPoint, k, metric, showBoundary, currentStep, kNeighbors, maxKDistance, predictedClass]);

  useEffect(() => {
    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [draw]);

  return (
    <LabLayout
      algorithmId="knn"
      title="K-Nearest Neighbors (KNN)"
      subtitle="Classify query points interactively by evaluating proximity to the K closest training instances."
      currentStep={currentStep}
      maxSteps={3}
      isConverged={currentStep === 3}
      statusMessage={`Query at (${queryPoint.x.toFixed(2)}, ${queryPoint.y.toFixed(2)}) → Classified as Class ${predictedClass} (${class1Count}/${k} votes)`}
      stepPhase={`Phase ${currentStep + 1}/4: ${
        currentStep === 0
          ? "Position Query Point"
          : currentStep === 1
          ? "Compute Pairwise Distances"
          : currentStep === 2
          ? "Select Top-K Neighbors"
          : "Majority Vote Decision"
      }`}
      onStep={step}
      onStepBackward={stepBackward}
      onReset={() => setCurrentStep(0)}
      onRandomize={() => setSeed(Math.floor(Math.random() * 10000))}
      pseudocode={PSEUDOCODE}
      activePseudocodeLine={activeCodeLine}
      canvasRef={canvasRef}
      datasetToExport={{
        k,
        metric,
        queryPoint,
        predictedClass,
        neighbors: kNeighbors.map((n) => ({ ...n.point, distance: n.dist })),
        allPoints: data,
      }}
      visualization={
        <div className="relative w-full h-full">
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className="w-full h-full cursor-move"
            aria-label="KNN interactive classification canvas"
          />
          <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] text-slate-300 pointer-events-none border border-white/10">
            Tip: Drag the query point around to see real-time neighbor recalculation
          </div>
        </div>
      }
      controls={
        <>
          <Slider
            label="K (Number of Neighbors)"
            value={k}
            min={1}
            max={15}
            step={2}
            onChange={setK}
            tooltip="Number of closest points used for majority voting (odd values prevent ties)"
          />
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              Distance Metric
            </label>
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value as DistanceMetric)}
              className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm font-medium"
            >
              {METRICS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <Slider
            label="Dataset Size"
            value={dataSize}
            min={20}
            max={140}
            step={10}
            onChange={setDataSize}
          />
          <div className="pt-2 border-t border-[var(--border)]">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
              <input
                type="checkbox"
                checked={showBoundary}
                onChange={(e) => setShowBoundary(e.target.checked)}
                className="rounded text-[var(--accent)]"
              />
              Show Decision Space Regions
            </label>
          </div>
        </>
      }
      metrics={[
        { label: "Predicted Class", value: `Class ${predictedClass}`, highlight: true },
        { label: "Class 1 Votes", value: `${class1Count} / ${k}`, highlight: true },
        { label: "Class 0 Votes", value: `${class0Count} / ${k}` },
        { label: "Max Neighbor Dist", value: formatNumber(maxKDistance, 3) },
      ]}
      explanations={[
        {
          title: "Non-Parametric Lazy Learning",
          content:
            "KNN does not build an explicit model during training. It simply memorizes the training instances and defers all computation until query time.",
        },
        {
          title: "Distance Metrics",
          content:
            "Proximity can be computed via standard Euclidean (L2 norm), Manhattan (L1 grid taxicab norm), or Chebyshev (L-infinity maximum coordinate difference).",
          latex:
            "d_2(x, y) = \\sqrt{\\sum_{i=1}^n (x_i - y_i)^2}, \\quad d_1(x, y) = \\sum_{i=1}^n |x_i - y_i|",
        },
        {
          title: "Majority Voting Rule",
          content:
            "The query point is assigned to the class with the highest frequency among the K nearest neighbors.",
          latex: "\\hat{y} = \\arg\\max_{c} \\sum_{i \\in N_K(x)} \\mathbb{I}(y_i = c)",
        },
      ]}
    />
  );
}
