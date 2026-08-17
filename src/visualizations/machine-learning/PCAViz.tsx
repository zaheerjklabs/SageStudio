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
  drawVectorArrow,
  drawGlowCircle,
} from "@/lib/canvas";
import type { DataPoint } from "@/types";

const PSEUDOCODE = [
  "1. Center dataset: X_centered = X - mean(X)",
  "2. Compute sample covariance matrix: Σ = (1/(n-1)) * X_centered^T * X_centered",
  "3. Perform Eigendecomposition: Σ v_i = λ_i v_i to find eigenvalues λ and eigenvectors v",
  "4. Sort eigenvectors in descending order of explained variance: λ_1 ≥ λ_2 ≥ ...",
  "5. Project original coordinates onto top principal components: Z = X_centered * V_k",
  "6. Reconstruct low-rank approximation: X̂ = Z * V_k^T + mean(X)",
];

export default function PCAViz() {
  const [dataSize, setDataSize] = useState(75);
  const [spread, setSpread] = useState(1.8);
  const [rotation, setRotation] = useState(40);
  const [showProjection, setShowProjection] = useState(true);
  const [currentStep, setCurrentStep] = useState(4);
  const [data, setData] = useState<DataPoint[]>([]);
  const [activeCodeLine, setActiveCodeLine] = useState(4);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<PCAEngine | null>(null);

  const regenerate = useCallback(() => {
    const newData: DataPoint[] = [];
    const angle = (rotation * Math.PI) / 180;

    for (let i = 0; i < dataSize; i++) {
      const t = (i / dataSize) * 2 * Math.PI;
      const r1 = 3.2;
      const r2 = 0.9;
      const rawX = r1 * Math.cos(t) + (Math.random() - 0.5) * spread;
      const rawY = r2 * Math.sin(t) + (Math.random() - 0.5) * spread * 0.4;

      const xRot = rawX * Math.cos(angle) - rawY * Math.sin(angle);
      const yRot = rawX * Math.sin(angle) + rawY * Math.cos(angle);

      newData.push({ x: xRot, y: yRot });
    }

    setData(newData);
    engineRef.current = new PCAEngine(newData);
  }, [dataSize, spread, rotation]);

  useEffect(() => {
    regenerate();
  }, [regenerate]);

  const step = () => {
    setCurrentStep((s) => {
      const next = Math.min(4, s + 1);
      setActiveCodeLine(next + 1);
      return next;
    });
  };

  const stepBackward = () => {
    setCurrentStep((s) => {
      const prev = Math.max(1, s - 1);
      setActiveCodeLine(prev + 1);
      return prev;
    });
  };

  // Draw Visuals
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !engineRef.current) return;
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

    const engine = engineRef.current;
    const meanPos = toCanvas(engine.mean.x, engine.mean.y);

    // Step 1: Draw Center of Mass (Mean)
    if (currentStep >= 1) {
      drawGlowCircle(ctx, meanPos.cx, meanPos.cy, 6.5, "#f59e0b", "rgba(245, 158, 11, 0.7)", "#ffffff");
      ctx.fillStyle = "#f59e0b";
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`μ(${engine.mean.x.toFixed(1)}, ${engine.mean.y.toFixed(1)})`, meanPos.cx + 8, meanPos.cy - 4);
    }

    // Step 2 & 3: Principal Component Vectors (PC1 & PC2)
    const scale = 3.2;
    if (currentStep >= 2) {
      // PC1 Vector (Primary Axis)
      const pc1End = toCanvas(
        engine.mean.x + engine.pc1.x * scale,
        engine.mean.y + engine.pc1.y * scale
      );
      drawVectorArrow(ctx, meanPos.cx, meanPos.cy, pc1End.cx, pc1End.cy, "#6366f1", 3.5, 9);

      // PC1 Extension Line across whole canvas
      ctx.beginPath();
      const pc1Far1 = toCanvas(engine.mean.x - engine.pc1.x * 6, engine.mean.y - engine.pc1.y * 6);
      const pc1Far2 = toCanvas(engine.mean.x + engine.pc1.x * 6, engine.mean.y + engine.pc1.y * 6);
      ctx.moveTo(pc1Far1.cx, pc1Far1.cy);
      ctx.lineTo(pc1Far2.cx, pc1Far2.cy);
      ctx.strokeStyle = "rgba(99, 102, 241, 0.3)";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = "#6366f1";
      ctx.font = "bold 10px sans-serif";
      ctx.fillText("PC1 (Max Variance)", pc1End.cx + 6, pc1End.cy - 6);
    }

    if (currentStep >= 3) {
      // PC2 Vector (Orthogonal Axis)
      const pc2End = toCanvas(
        engine.mean.x + engine.pc2.x * (scale * 0.65),
        engine.mean.y + engine.pc2.y * (scale * 0.65)
      );
      drawVectorArrow(ctx, meanPos.cx, meanPos.cy, pc2End.cx, pc2End.cy, "#ec4899", 2.5, 8);
      ctx.fillStyle = "#ec4899";
      ctx.font = "bold 10px sans-serif";
      ctx.fillText("PC2", pc2End.cx + 6, pc2End.cy - 6);
    }

    // Step 4: Orthogonal Projection Lines
    if (currentStep >= 4 && showProjection) {
      data.forEach((p) => {
        const proj = engine.project(p, 1);
        const recon = engine.reconstruct(proj, 1);

        const origCanvas = toCanvas(p.x, p.y);
        const projCanvas = toCanvas(recon.x, recon.y);

        ctx.beginPath();
        ctx.moveTo(origCanvas.cx, origCanvas.cy);
        ctx.lineTo(projCanvas.cx, projCanvas.cy);
        ctx.strokeStyle = "rgba(139, 92, 246, 0.4)";
        ctx.lineWidth = 1;
        ctx.stroke();

        // Projected point on 1D subspace
        ctx.beginPath();
        ctx.arc(projCanvas.cx, projCanvas.cy, 3, 0, Math.PI * 2);
        ctx.fillStyle = "#6366f1";
        ctx.fill();
      });
    }

    // Data Points
    data.forEach((p) => {
      const { cx, cy } = toCanvas(p.x, p.y);
      drawGlowCircle(ctx, cx, cy, 4, "#10b981", "rgba(16, 185, 129, 0.4)", "#ffffff");
    });

    // Inset Explained Variance Ratio Bar Chart (Top-Right)
    const totalVar = (engine.variance1 + engine.variance2) || 1;
    const var1 = engine.variance1 / totalVar;
    const var2 = engine.variance2 / totalVar;

    const barW = 135;
    const barH = 58;
    const barX = w - padding - barW;
    const barY = padding + 8;

    ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
    ctx.strokeStyle = "rgba(148, 163, 184, 0.25)";
    ctx.lineWidth = 1;
    ctx.fillRect(barX, barY, barW, barH);
    ctx.strokeRect(barX, barY, barW, barH);

    ctx.fillStyle = "rgba(148, 163, 184, 0.8)";
    ctx.font = "9px monospace";
    ctx.textAlign = "left";
    ctx.fillText("Explained Variance Ratio", barX + 6, barY + 12);

    // PC1 Bar
    ctx.fillStyle = "#6366f1";
    ctx.fillRect(barX + 6, barY + 20, (barW - 12) * var1, 12);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 8.5px sans-serif";
    ctx.fillText(`PC1: ${(var1 * 100).toFixed(1)}%`, barX + 10, barY + 30);

    // PC2 Bar
    ctx.fillStyle = "#ec4899";
    ctx.fillRect(barX + 6, barY + 36, (barW - 12) * var2, 12);
    ctx.fillStyle = "#ffffff";
    ctx.fillText(`PC2: ${(var2 * 100).toFixed(1)}%`, barX + 10, barY + 46);
  }, [data, currentStep, showProjection]);

  useEffect(() => {
    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [draw]);

  const engine = engineRef.current;
  const totV = engine ? (engine.variance1 + engine.variance2) || 1 : 1;
  const varRatio1 = engine ? (engine.variance1 / totV) * 100 : 80;
  const varRatio2 = engine ? (engine.variance2 / totV) * 100 : 20;

  return (
    <LabLayout
      algorithmId="pca"
      title="Principal Component Analysis (PCA)"
      subtitle="Discover orthogonal axes of maximal variance and project data onto lower-dimensional subspaces."
      currentStep={currentStep}
      maxSteps={4}
      isConverged={currentStep === 4}
      statusMessage={`PC1 captures ${varRatio1.toFixed(1)}% of total variance · PC2 captures ${varRatio2.toFixed(1)}%`}
      stepPhase={`Phase ${currentStep}/4: ${
        currentStep === 1
          ? "Compute Sample Mean"
          : currentStep === 2
          ? "Derive PC1 Vector"
          : currentStep === 3
          ? "Derive PC2 Orthogonal Vector"
          : "Orthogonal Subspace Projection"
      }`}
      onStep={step}
      onStepBackward={stepBackward}
      onReset={() => setCurrentStep(1)}
      onRandomize={regenerate}
      pseudocode={PSEUDOCODE}
      activePseudocodeLine={activeCodeLine}
      canvasRef={canvasRef}
      datasetToExport={{
        mean: engine?.mean,
        pc1: engine?.pc1,
        pc2: engine?.pc2,
        explainedVarianceRatio: [varRatio1 / 100, varRatio2 / 100],
        dataPoints: data,
      }}
      visualization={
        <div className="relative w-full h-full">
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            aria-label="PCA 2D projection canvas"
          />
          <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] text-slate-300 pointer-events-none border border-white/10">
            Blue Arrow = PC1 · Pink Arrow = PC2 · Purple Lines = 1D Projections
          </div>
        </div>
      }
      controls={
        <>
          <Slider
            label="Dataset Rotation Angle (°)"
            value={rotation}
            min={0}
            max={180}
            step={5}
            onChange={setRotation}
            tooltip="Rotates the primary axis of dataset variation"
          />
          <Slider
            label="Dataset Size"
            value={dataSize}
            min={20}
            max={150}
            step={5}
            onChange={setDataSize}
          />
          <Slider
            label="Noise Spread"
            value={spread}
            min={0.5}
            max={3.5}
            step={0.1}
            onChange={setSpread}
          />
          <div className="pt-2 border-t border-[var(--border)]">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
              <input
                type="checkbox"
                checked={showProjection}
                onChange={(e) => setShowProjection(e.target.checked)}
                className="rounded text-[var(--accent)]"
              />
              Show 1D Subspace Projection Lines
            </label>
          </div>
        </>
      }
      metrics={[
        { label: "PC1 Variance Explained", value: `${varRatio1.toFixed(1)}%`, highlight: true },
        { label: "PC2 Variance Explained", value: `${varRatio2.toFixed(1)}%`, highlight: true },
        { label: "Total Retained Variance", value: "100.0%" },
        { label: "Dimensionality", value: "2D → 1D Projection" },
      ]}
      explanations={[
        {
          title: "Principal Eigenvectors & Maximal Variance",
          content:
            "PCA seeks an orthogonal basis where the first axis (PC1) maximizes sample variance, minimizing information loss when projecting to lower dimensions.",
          latex: "\\mathbf{w}_1 = \\arg\\max_{\\|\\mathbf{w}\\|=1} \\frac{1}{n} \\sum_{i=1}^n (\\mathbf{x}_i^T \\mathbf{w})^2 = \\arg\\max_{\\|\\mathbf{w}\\|=1} \\mathbf{w}^T \\Sigma \\mathbf{w}",
        },
        {
          title: "Sample Covariance Matrix",
          content:
            "The covariance matrix captures pairwise linear correlations across all input dimensions.",
          latex: "\\Sigma = \\frac{1}{n-1} \\sum_{i=1}^n (\\mathbf{x}_i - \\mu)(\\mathbf{x}_i - \\mu)^T",
        },
      ]}
    />
  );
}
