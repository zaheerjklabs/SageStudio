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
} from "@/lib/canvas";
import type { DataPoint } from "@/types";

export default function KNNViz() {
  const [k, setK] = useState(3);
  const [dataSize, setDataSize] = useState(60);
  const [queryPoint, setQueryPoint] = useState<DataPoint>({ x: 0, y: 0 });
  const [data, setData] = useState<DataPoint[]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<KNNEngine>(new KNNEngine(k, []));

  const regenerate = useCallback(() => {
    const newData: DataPoint[] = [];
    
    // Class 0: cluster around (-2, -2)
    for (let i = 0; i < dataSize / 2; i++) {
      newData.push({
        x: -2 + (Math.random() - 0.5) * 3,
        y: -2 + (Math.random() - 0.5) * 3,
        label: 0,
      });
    }
    
    // Class 1: cluster around (2, 2)
    for (let i = 0; i < dataSize / 2; i++) {
      newData.push({
        x: 2 + (Math.random() - 0.5) * 3,
        y: 2 + (Math.random() - 0.5) * 3,
        label: 1,
      });
    }
    
    setData(newData);
    engineRef.current = new KNNEngine(k, newData);
  }, [dataSize, k]);

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
    const xRange: [number, number] = [-5, 5];
    const yRange: [number, number] = [-5, 5];
    const { toCanvas, toCoord } = createCoordSystem(w, h, padding, xRange, yRange);

    clearCanvas(ctx, w, h);
    drawGrid(ctx, w, h, padding, xRange, yRange);
    drawAxes(ctx, w, h, padding, xRange, yRange);

    const engine = engineRef.current;
    engine.k = k;
    engine.data = data;

    const neighbors = engine.findNeighbors(queryPoint);
    const prediction = engine.predict(queryPoint);

    // Draw decision boundary (background)
    const resolution = 20;
    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        const x = xRange[0] + (i / resolution) * (xRange[1] - xRange[0]);
        const y = yRange[0] + (j / resolution) * (yRange[1] - yRange[0]);
        const pred = engine.predict({ x, y });
        const { cx, cy } = toCanvas(x, y);
        const cellSize = (w - 2 * padding) / resolution;
        
        ctx.fillStyle = pred === 0 ? "rgba(239, 68, 68, 0.1)" : "rgba(16, 185, 129, 0.1)";
        ctx.fillRect(cx, cy, cellSize, cellSize);
      }
    }

    // Draw connections to neighbors
    neighbors.forEach((n) => {
      const q = toCanvas(queryPoint.x, queryPoint.y);
      const neighbor = toCanvas(n.x, n.y);
      ctx.beginPath();
      ctx.moveTo(q.cx, q.cy);
      ctx.lineTo(neighbor.cx, neighbor.cy);
      ctx.strokeStyle = "rgba(99, 102, 241, 0.3)";
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Draw data points
    data.forEach((p) => {
      const { cx, cy } = toCanvas(p.x, p.y);
      const isNeighbor = neighbors.includes(p);
      
      ctx.beginPath();
      ctx.arc(cx, cy, isNeighbor ? 6 : 4, 0, Math.PI * 2);
      ctx.fillStyle = p.label === 0 ? "#ef4444" : "#10b981";
      ctx.fill();
      
      if (isNeighbor) {
        ctx.strokeStyle = "#6366f1";
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }
    });

    // Draw query point
    const { cx, cy } = toCanvas(queryPoint.x, queryPoint.y);
    ctx.beginPath();
    ctx.arc(cx, cy, 8, 0, Math.PI * 2);
    ctx.fillStyle = prediction === 0 ? "#dc2626" : "#059669";
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Handle mouse move
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const coord = toCoord(x, y);
      setQueryPoint({ x: coord.x, y: coord.y });
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    return () => canvas.removeEventListener("mousemove", handleMouseMove);
  }, [data, queryPoint, k]);

  useEffect(() => {
    const cleanup = draw();
    window.addEventListener("resize", draw);
    return () => {
      window.removeEventListener("resize", draw);
      cleanup?.();
    };
  }, [draw]);

  const prediction = engineRef.current.predict(queryPoint);
  const neighbors = engineRef.current.findNeighbors(queryPoint);
  const class0Count = neighbors.filter((n) => n.label === 0).length;
  const class1Count = neighbors.filter((n) => n.label === 1).length;

  return (
    <LabLayout
      algorithmId="knn"
      title="K-Nearest Neighbors"
      subtitle="Classify by proximity to nearest neighbors"
      onReset={regenerate}
      onRandomize={regenerate}
      visualization={
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-crosshair"
          aria-label="KNN visualization"
        />
      }
      controls={
        <>
          <Slider
            label="K (Neighbors)"
            value={k}
            min={1}
            max={15}
            step={1}
            onChange={setK}
            tooltip="Number of nearest neighbors to consider"
          />
          <Slider
            label="Dataset Size"
            value={dataSize}
            min={20}
            max={150}
            step={10}
            onChange={setDataSize}
            tooltip="Total number of training points"
          />
          <div className="text-sm text-[var(--muted-foreground)]">
            Move mouse over visualization to classify
          </div>
        </>
      }
      metrics={[
        { label: "K Value", value: k.toString(), highlight: true },
        { label: "Prediction", value: `Class ${prediction}`, highlight: true },
        { label: "Class 0 Votes", value: class0Count.toString() },
        { label: "Class 1 Votes", value: class1Count.toString() },
      ]}
      explanations={[
        {
          title: "What is happening?",
          content:
            "Move your mouse to query different points. The algorithm finds the K nearest neighbors (highlighted with blue borders) and predicts the majority class. Lines connect the query point to its neighbors.",
        },
        {
          title: "How it works",
          content:
            "KNN uses distance metrics to find the closest training examples and assigns the most common class among them. It's a simple but powerful non-parametric algorithm.",
          latex: "\\hat{y} = \\text{mode}\\{y_i : (x_i, y_i) \\in N_k(x)\\}",
        },
        {
          title: "Choosing K",
          content:
            "Small K values are sensitive to noise, while large K values smooth decision boundaries. Odd K values help avoid ties in binary classification.",
        },
      ]}
    />
  );
}
