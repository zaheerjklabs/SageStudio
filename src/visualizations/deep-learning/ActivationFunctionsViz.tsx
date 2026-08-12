"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { LabLayout } from "@/components/visualization/LabLayout";
import { Slider } from "@/components/controls/Slider";
import {
  ACTIVATION_INFO,
  sampleActivation,
  type ActivationType,
} from "@/algorithms/neural-networks/activations";
import { formatNumber } from "@/lib/utils";
import { drawGrid, drawAxes, createCoordSystem } from "@/lib/canvas";

const ACTIVATION_TYPES: ActivationType[] = [
  "relu", "sigmoid", "tanh", "leaky_relu", "elu", "gelu", "linear",
];

export default function ActivationFunctionsViz() {
  const [activation, setActivation] = useState<ActivationType>("relu");
  const [alpha, setAlpha] = useState(0.01);
  const [xMin, setXMin] = useState(-5);
  const [xMax, setXMax] = useState(5);
  const [hoverX, setHoverX] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const info = ACTIVATION_INFO[activation];

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
    const yRange: [number, number] = [-2, 2];
    const xRange: [number, number] = [xMin, xMax];
    const { toCanvas } = createCoordSystem(w, h, padding, xRange, yRange);

    ctx.clearRect(0, 0, w, h);
    drawGrid(ctx, w, h, padding, xRange, yRange);
    drawAxes(ctx, w, h, padding, xRange, yRange);

    const points = sampleActivation(activation, xMin, xMax, 200, alpha);

    // Function
    ctx.beginPath();
    points.forEach((p, i) => {
      const { cx, cy } = toCanvas(p.x, p.y);
      if (i === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    });
    ctx.strokeStyle = "#6366f1";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Derivative
    ctx.beginPath();
    points.forEach((p, i) => {
      const { cx, cy } = toCanvas(p.x, p.dy);
      if (i === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    });
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Hover point
    const hoverPoints = sampleActivation(activation, hoverX, hoverX, 1, alpha);
    if (hoverPoints[0]) {
      const hp = hoverPoints[0];
      const pt = toCanvas(hp.x, hp.y);
      ctx.beginPath();
      ctx.arc(pt.cx, pt.cy, 6, 0, Math.PI * 2);
      ctx.fillStyle = "#f59e0b";
      ctx.fill();
    }
  }, [activation, alpha, xMin, xMax, hoverX]);

  useEffect(() => {
    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [draw]);

  const hoverPoints = sampleActivation(activation, hoverX, hoverX, 1, alpha);
  const hp = hoverPoints[0];

  return (
    <LabLayout
      algorithmId="activation-functions"
      title="Activation Functions"
      subtitle="Explore activation functions and their derivatives."
      visualization={
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          aria-label="Activation function graph"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const padding = 40;
            const x = xMin + ((e.clientX - rect.left - padding) / (rect.width - padding * 2)) * (xMax - xMin);
            setHoverX(Math.max(xMin, Math.min(xMax, x)));
          }}
        />
      }
      controls={
        <>
          <div className="space-y-2">
            <label className="text-sm font-medium">Activation</label>
            <select
              value={activation}
              onChange={(e) => setActivation(e.target.value as ActivationType)}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm"
            >
              {ACTIVATION_TYPES.map((a) => (
                <option key={a} value={a}>{ACTIVATION_INFO[a].name}</option>
              ))}
            </select>
          </div>
          {(activation === "leaky_relu" || activation === "elu") && (
            <Slider label="α (alpha)" value={alpha} min={0.001} max={0.5} step={0.001} onChange={setAlpha} formatValue={(v) => v.toFixed(3)} />
          )}
          <Slider label="Hover X" value={hoverX} min={xMin} max={xMax} step={0.1} onChange={setHoverX} />
        </>
      }
      metrics={[
        { label: "f(x)", value: hp ? formatNumber(hp.y) : "—", highlight: true },
        { label: "f'(x)", value: hp ? formatNumber(hp.dy) : "—" },
        { label: "Range", value: info.range },
        { label: "Function", value: info.name },
      ]}
      explanations={[
        {
          title: "What is happening?",
          content: `The blue curve shows ${info.name}. The green dashed line shows its derivative. ${info.properties}`,
          latex: info.formula,
        },
        {
          title: "Derivative",
          content: "The derivative determines how gradients flow during backpropagation.",
          latex: info.derivative,
        },
      ]}
    />
  );
}
