"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { LabLayout } from "@/components/visualization/LabLayout";
import { Slider } from "@/components/controls/Slider";
import { PCAEngine } from "@/algorithms/dimensionality-reduction/pca";
import { formatNumber } from "@/lib/utils";
import {
  drawGrid,
  drawAxes,
  createCoordSystem,
  clearCanvas,
} from "@/lib/canvas";
import type { DataPoint } from "@/types";

export default function PCAViz() {
  const [dataSize, setDataSize] = useState(80);
  const [spread, setSpread] = useState(2);
  const [rotation, setRotation] = useState(45);
  const [showProjection, setShowProjection] = useState(true);
  const [data, setData] = useState<DataPoint[]>([]);
  const [engine, setEngine] = useState<PCAEngine | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const regenerate = useCallback(() => {
    const newData: DataPoint[] = [];
    const angle = (rotation * Math.PI) / 180;
    
    for (let i = 0; i < dataSize; i++) {
      // Generate elliptical data
      const t = (i / dataSize) * 2 * Math.PI;
      const r1 = 3;
      const r2 = 1;
      const x = r1 * Math.cos(t) + (Math.random() - 0.5) * spread;
      const y = r2 * Math.sin(t) + (Math.random() - 0.5) * spread * 0.5;
      
      // Rotate
      const xRot = x * Math.cos(angle) - y * Math.sin(angle);
      const yRot = x * Math.sin(angle) + y * Math.cos(angle);
      
      newData.push({ x: xRot, y: yRot });
    }
    
    setData(newData);
    setEngine(new PCAEngine(newData));
  }, [dataSize, spread, rotation]);

  useEffect(() => {
    regenerate();
  }, [regenerate]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !engine) return;
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
    drawGrid(ctx, w, h, padding, xRange, yRange);
    drawAxes(ctx, w, h, padding, xRange, yRange);

    // Draw mean
    const meanPos = toCanvas(engine.mean.x, engine.mean.y);
    ctx.beginPath();
    ctx.arc(meanPos.cx, meanPos.cy, 6, 0, Math.PI * 2);
    ctx.fillStyle = "#f59e0b";
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw principal components
    const scale = 3;
    
    // PC1 (primary)
    const pc1Start = toCanvas(engine.mean.x, engine.mean.y);
    const pc1End = toCanvas(
      engine.mean.x + engine.pc1.x * scale,
      engine.mean.y + engine.pc1.y * scale
    );
    ctx.beginPath();
    ctx.moveTo(pc1Start.cx, pc1Start.cy);
    ctx.lineTo(pc1End.cx, pc1End.cy);
    ctx.strokeStyle = "#6366f1";
    ctx.lineWidth = 3;
    ctx.stroke();
    
    // Arrow for PC1
    const angle1 = Math.atan2(pc1End.cy - pc1Start.cy, pc1End.cx - pc1Start.cx);
    ctx.beginPath();
    ctx.moveTo(pc1End.cx, pc1End.cy);
    ctx.lineTo(
      pc1End.cx - 10 * Math.cos(angle1 - Math.PI / 6),
      pc1End.cy - 10 * Math.sin(angle1 - Math.PI / 6)
    );
    ctx.moveTo(pc1End.cx, pc1End.cy);
    ctx.lineTo(
      pc1End.cx - 10 * Math.cos(angle1 + Math.PI / 6),
      pc1End.cy - 10 * Math.sin(angle1 + Math.PI / 6)
    );
    ctx.stroke();

    // PC2 (secondary)
    const pc2End = toCanvas(
      engine.mean.x + engine.pc2.x * scale * 0.7,
      engine.mean.y + engine.pc2.y * scale * 0.7
    );
    ctx.beginPath();
    ctx.moveTo(pc1Start.cx, pc1Start.cy);
    ctx.lineTo(pc2End.cx, pc2End.cy);
    ctx.strokeStyle = "#8b5cf6";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Arrow for PC2
    const angle2 = Math.atan2(pc2End.cy - pc1Start.cy, pc2End.cx - pc1Start.cx);
    ctx.beginPath();
    ctx.moveTo(pc2End.cx, pc2End.cy);
    ctx.lineTo(
      pc2End.cx - 8 * Math.cos(angle2 - Math.PI / 6),
      pc2End.cy - 8 * Math.sin(angle2 - Math.PI / 6)
    );
    ctx.moveTo(pc2End.cx, pc2End.cy);
    ctx.lineTo(
      pc2End.cx - 8 * Math.cos(angle2 + Math.PI / 6),
      pc2End.cy - 8 * Math.sin(angle2 + Math.PI / 6)
    );
    ctx.stroke();

    // Draw projections
    if (showProjection) {
      data.forEach((p) => {
        const proj = engine.project(p, 1);
        const reconstructed = engine.reconstruct(proj, 1);
        
        const original = toCanvas(p.x, p.y);
        const projected = toCanvas(reconstructed.x, reconstructed.y);
        
        ctx.beginPath();
        ctx.moveTo(original.cx, original.cy);
        ctx.lineTo(projected.cx, projected.cy);
        ctx.strokeStyle = "rgba(139, 92, 246, 0.3)";
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    }

    // Draw data points
    data.forEach((p) => {
      const { cx, cy } = toCanvas(p.x, p.y);
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fillStyle = "#10b981";
      ctx.fill();
    });
  }, [data, engine, showProjection]);

  useEffect(() => {
    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [draw]);

  const varianceExplained = engine ? engine.getVarianceExplained() * 100 : 0;

  return (
    <LabLayout
      algorithmId="pca"
      title="Principal Component Analysis"
      subtitle="Project data onto principal components"
      onReset={regenerate}
      onRandomize={regenerate}
      visualization={
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          aria-label="PCA visualization"
        />
      }
      controls={
        <>
          <Slider
            label="Dataset Size"
            value={dataSize}
            min={30}
            max={150}
            step={10}
            onChange={setDataSize}
            tooltip="Number of data points"
          />
          <Slider
            label="Spread"
            value={spread}
            min={0.5}
            max={4}
            step={0.1}
            onChange={setSpread}
            tooltip="Data point variance"
          />
          <Slider
            label="Rotation"
            value={rotation}
            min={0}
            max={180}
            step={5}
            onChange={setRotation}
            tooltip="Rotate data ellipse"
            formatValue={(v) => `${v}°`}
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showProjection"
              checked={showProjection}
              onChange={(e) => setShowProjection(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="showProjection" className="text-sm cursor-pointer">
              Show projections
            </label>
          </div>
        </>
      }
      metrics={[
        {
          label: "Variance Explained",
          value: `${varianceExplained.toFixed(1)}%`,
          highlight: true,
        },
        {
          label: "PC1 Variance",
          value: engine ? formatNumber(engine.variance1) : "0",
        },
        {
          label: "PC2 Variance",
          value: engine ? formatNumber(engine.variance2) : "0",
        },
        { label: "Data Points", value: dataSize.toString() },
      ]}
      explanations={[
        {
          title: "What is happening?",
          content:
            "PCA finds the directions (principal components) along which the data varies the most. The blue arrow shows PC1 (maximum variance), and the purple arrow shows PC2 (perpendicular to PC1). The orange dot is the data mean.",
        },
        {
          title: "Dimensionality Reduction",
          content:
            "By projecting data onto PC1 (purple lines), we reduce 2D data to 1D while preserving the most variance. This is useful for visualization and noise reduction.",
        },
        {
          title: "Mathematics",
          content:
            "PCA computes eigenvectors of the covariance matrix. These eigenvectors are the principal components, and their eigenvalues represent variance.",
          latex: "\\text{Cov}(X) v = \\lambda v",
        },
      ]}
    />
  );
}
