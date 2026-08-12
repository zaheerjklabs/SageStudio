"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { LabLayout } from "@/components/visualization/LabLayout";
import { Slider } from "@/components/controls/Slider";
import {
  evaluateFunction,
  evaluateDerivative,
  sampleFunction,
  FUNCTION_PRESETS,
  type MathFunction,
  type FunctionParams,
} from "@/algorithms/mathematics/functions";
import { formatNumber } from "@/lib/utils";
import { drawGrid, drawAxes, createCoordSystem } from "@/lib/canvas";

export default function FunctionVisualizerViz() {
  const [fn, setFn] = useState<MathFunction>("x2");
  const [params, setParams] = useState<FunctionParams>({ a: 1, b: 0, c: 0, d: 0 });
  const [xMin, setXMin] = useState(-5);
  const [xMax, setXMax] = useState(5);
  const [showTangent, setShowTangent] = useState(true);
  const [showDerivative, setShowDerivative] = useState(false);
  const [tangentX, setTangentX] = useState(2);

  const canvasRef = useRef<HTMLCanvasElement>(null);

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

    const points = sampleFunction(fn, params, xMin, xMax, 200);
    if (points.length === 0) return;

    const yValues = points.map((p) => p.y);
    const yMin = Math.min(...yValues, -1) - 1;
    const yMax = Math.max(...yValues, 1) + 1;
    const yRange: [number, number] = [yMin, yMax];
    const xRange: [number, number] = [xMin, xMax];
    const { toCanvas } = createCoordSystem(w, h, padding, xRange, yRange);

    ctx.clearRect(0, 0, w, h);
    drawGrid(ctx, w, h, padding, xRange, yRange);
    drawAxes(ctx, w, h, padding, xRange, yRange);

    // Main function
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
    if (showDerivative) {
      const derivPoints = [];
      for (let i = 0; i <= 200; i++) {
        const x = xMin + (i / 200) * (xMax - xMin);
        const dy = evaluateDerivative(x, fn, params);
        if (!isNaN(dy)) derivPoints.push({ x, y: dy });
      }
      ctx.beginPath();
      derivPoints.forEach((p, i) => {
        const { cx, cy } = toCanvas(p.x, p.y);
        if (i === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      });
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Tangent line
    if (showTangent) {
      const y0 = evaluateFunction(tangentX, fn, params);
      const slope = evaluateDerivative(tangentX, fn, params);
      if (!isNaN(y0) && !isNaN(slope)) {
        const x1 = tangentX - 2;
        const x2 = tangentX + 2;
        const y1 = y0 + slope * (x1 - tangentX);
        const y2 = y0 + slope * (x2 - tangentX);
        const p1 = toCanvas(x1, y1);
        const p2 = toCanvas(x2, y2);
        const pt = toCanvas(tangentX, y0);

        ctx.beginPath();
        ctx.moveTo(p1.cx, p1.cy);
        ctx.lineTo(p2.cx, p2.cy);
        ctx.strokeStyle = "#f59e0b";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(pt.cx, pt.cy, 6, 0, Math.PI * 2);
        ctx.fillStyle = "#f59e0b";
        ctx.fill();
      }
    }
  }, [fn, params, xMin, xMax, showTangent, showDerivative, tangentX]);

  useEffect(() => {
    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [draw]);

  const fx = evaluateFunction(tangentX, fn, params);
  const dfx = evaluateDerivative(tangentX, fn, params);

  return (
    <LabLayout
      algorithmId="function-visualizer"
      title="Function Visualizer"
      subtitle="Explore mathematical functions interactively."
      visualization={
        <canvas ref={canvasRef} className="w-full h-full" aria-label="Function graph" />
      }
      controls={
        <>
          <div className="space-y-2">
            <label className="text-sm font-medium">Function</label>
            <select
              value={fn}
              onChange={(e) => setFn(e.target.value as MathFunction)}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm"
            >
              {FUNCTION_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          </div>
          <Slider label="a" value={params.a} min={-3} max={3} step={0.1} onChange={(v) => setParams({ ...params, a: v })} />
          <Slider label="b" value={params.b} min={-3} max={3} step={0.1} onChange={(v) => setParams({ ...params, b: v })} />
          <Slider label="c" value={params.c} min={-3} max={3} step={0.1} onChange={(v) => setParams({ ...params, c: v })} />
          <Slider label="Tangent at x" value={tangentX} min={xMin} max={xMax} step={0.1} onChange={setTangentX} />
          <Slider label="X Min" value={xMin} min={-10} max={0} step={0.5} onChange={setXMin} />
          <Slider label="X Max" value={xMax} min={0} max={10} step={0.5} onChange={setXMax} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={showTangent} onChange={(e) => setShowTangent(e.target.checked)} />
            Show Tangent
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={showDerivative} onChange={(e) => setShowDerivative(e.target.checked)} />
            Show Derivative f&apos;(x)
          </label>
        </>
      }
      metrics={[
        { label: "f(x)", value: isNaN(fx) ? "—" : formatNumber(fx) },
        { label: "f'(x)", value: isNaN(dfx) ? "—" : formatNumber(dfx), highlight: true },
        { label: "x", value: formatNumber(tangentX, 1) },
        { label: "Slope", value: isNaN(dfx) ? "—" : formatNumber(dfx) },
      ]}
      explanations={[
        {
          title: "What is happening?",
          content: "The blue curve shows f(x). The orange tangent line at the selected point has slope equal to the derivative f'(x).",
        },
        {
          title: "Mathematics",
          content: "The derivative measures the instantaneous rate of change of the function.",
          latex: "f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}",
        },
      ]}
    />
  );
}
