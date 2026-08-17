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
import { drawGrid, drawAxes, createCoordSystem, clearCanvas, drawGlowCircle } from "@/lib/canvas";

const PSEUDOCODE = [
  "1. Evaluate base function at point x_0: y_0 = f(x_0)",
  "2. Choose displacement step Δx > 0 to define secant point: (x_0 + Δx, f(x_0 + Δx))",
  "3. Compute finite difference quotient: m_secant = [f(x_0 + Δx) - f(x_0)] / Δx",
  "4. Take limit as step size Δx → 0: f'(x_0) = lim_{Δx→0} [f(x_0 + Δx) - f(x_0)] / Δx",
  "5. Compute definite Riemann integral: Area ≈ Σ f(x_i*) · Δx",
];

export default function FunctionVisualizerViz() {
  const [fn, setFn] = useState<MathFunction>("sin");
  const [params, setParams] = useState<FunctionParams>({ a: 1, b: 1, c: 0, d: 0 });
  const [tangentX, setTangentX] = useState(1.2);
  const [deltaX, setDeltaX] = useState(0.8);
  const [xMin, setXMin] = useState(-5);
  const [xMax, setXMax] = useState(5);
  const [showTangent, setShowTangent] = useState(true);
  const [showSecant, setShowSecant] = useState(true);
  const [showDerivative, setShowDerivative] = useState(false);
  const [showRiemann, setShowRiemann] = useState(false);
  const [numRectangles, setNumRectangles] = useState(12);
  const [currentStep, setCurrentStep] = useState(1);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const fx0 = evaluateFunction(tangentX, fn, params);
  const fxDelta = evaluateFunction(tangentX + deltaX, fn, params);
  const secantSlope = (fxDelta - fx0) / deltaX;
  const trueSlope = evaluateDerivative(tangentX, fn, params);

  // Step-by-step limit convergence
  const step = () => {
    setDeltaX((prev) => {
      const next = prev > 0.1 ? prev * 0.5 : 0.01;
      return next;
    });
    setCurrentStep((s) => Math.min(5, s + 1));
  };

  const stepBackward = () => {
    setDeltaX((prev) => Math.min(1.5, prev * 2));
    setCurrentStep((s) => Math.max(1, s - 1));
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
    const padding = 45;

    const points = sampleFunction(fn, params, xMin, xMax, 220);
    if (points.length === 0) return;

    const yValues = points.map((p) => p.y).filter((y) => !isNaN(y) && isFinite(y));
    const rawYMin = Math.min(...yValues, -2);
    const rawYMax = Math.max(...yValues, 2);
    const yRange: [number, number] = [Math.max(-10, rawYMin - 1), Math.min(10, rawYMax + 1)];
    const xRange: [number, number] = [xMin, xMax];
    const { toCanvas } = createCoordSystem(w, h, padding, xRange, yRange);

    clearCanvas(ctx, w, h);
    drawGrid(ctx, w, h, padding, xRange, yRange);
    drawAxes(ctx, w, h, padding, xRange, yRange);

    // Riemann Sum Rectangles
    if (showRiemann) {
      const rMin = Math.max(xMin, 0);
      const rMax = Math.min(xMax, 4);
      const dx = (rMax - rMin) / numRectangles;

      for (let i = 0; i < numRectangles; i++) {
        const rx = rMin + i * dx;
        const ry = evaluateFunction(rx + dx / 2, fn, params);
        if (!isNaN(ry) && isFinite(ry)) {
          const ptLeft = toCanvas(rx, 0);
          const ptRight = toCanvas(rx + dx, ry);

          ctx.fillStyle = ry >= 0 ? "rgba(99, 102, 241, 0.18)" : "rgba(239, 68, 68, 0.18)";
          ctx.strokeStyle = "rgba(99, 102, 241, 0.4)";
          ctx.lineWidth = 1;

          const rectX = ptLeft.cx;
          const rectY = Math.min(ptLeft.cy, ptRight.cy);
          const rectW = Math.abs(toCanvas(rx + dx, 0).cx - ptLeft.cx);
          const rectH = Math.abs(ptLeft.cy - ptRight.cy);

          ctx.fillRect(rectX, rectY, rectW, rectH);
          ctx.strokeRect(rectX, rectY, rectW, rectH);
        }
      }
    }

    // Main Function Curve f(x)
    ctx.save();
    ctx.shadowColor = "rgba(99, 102, 241, 0.7)";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    let started = false;
    points.forEach((p) => {
      if (!isNaN(p.y) && isFinite(p.y) && p.y >= yRange[0] - 2 && p.y <= yRange[1] + 2) {
        const { cx, cy } = toCanvas(p.x, p.y);
        if (!started) {
          ctx.moveTo(cx, cy);
          started = true;
        } else {
          ctx.lineTo(cx, cy);
        }
      }
    });
    ctx.strokeStyle = "#6366f1";
    ctx.lineWidth = 3.5;
    ctx.stroke();
    ctx.restore();

    // Derivative Curve f'(x)
    if (showDerivative) {
      ctx.beginPath();
      started = false;
      for (let i = 0; i <= 200; i++) {
        const x = xMin + (i / 200) * (xMax - xMin);
        const dy = evaluateDerivative(x, fn, params);
        if (!isNaN(dy) && isFinite(dy) && dy >= yRange[0] - 2 && dy <= yRange[1] + 2) {
          const { cx, cy } = toCanvas(x, dy);
          if (!started) {
            ctx.moveTo(cx, cy);
            started = true;
          } else {
            ctx.lineTo(cx, cy);
          }
        }
      }
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Secant Line connecting (x_0, f(x_0)) to (x_0 + Δx, f(x_0 + Δx))
    if (showSecant && deltaX > 0.001) {
      const pA = toCanvas(tangentX, fx0);
      const pB = toCanvas(tangentX + deltaX, fxDelta);

      ctx.beginPath();
      // Extended secant line
      const slopePx = (pB.cy - pA.cy) / (pB.cx - pA.cx);
      ctx.moveTo(pA.cx - 100, pA.cy - 100 * slopePx);
      ctx.lineTo(pB.cx + 100, pB.cy + 100 * slopePx);
      ctx.strokeStyle = "rgba(236, 72, 153, 0.85)";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      drawGlowCircle(ctx, pB.cx, pB.cy, 5, "#ec4899", "rgba(236, 72, 153, 0.8)", "#ffffff");
    }

    // Tangent Line
    if (showTangent && !isNaN(fx0) && !isNaN(trueSlope)) {
      const span = 2.5;
      const t1 = toCanvas(tangentX - span, fx0 - trueSlope * span);
      const t2 = toCanvas(tangentX + span, fx0 + trueSlope * span);

      ctx.beginPath();
      ctx.moveTo(t1.cx, t1.cy);
      ctx.lineTo(t2.cx, t2.cy);
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      const pt0 = toCanvas(tangentX, fx0);
      drawGlowCircle(ctx, pt0.cx, pt0.cy, 6.5, "#f59e0b", "rgba(245, 158, 11, 0.9)", "#ffffff");
    }
  }, [
    fn,
    params,
    xMin,
    xMax,
    tangentX,
    deltaX,
    fx0,
    fxDelta,
    secantSlope,
    trueSlope,
    showTangent,
    showSecant,
    showDerivative,
    showRiemann,
    numRectangles,
  ]);

  useEffect(() => {
    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [draw]);

  return (
    <LabLayout
      algorithmId="function-visualizer"
      title="Function, Derivative & Integral Visualizer"
      subtitle="Interact with tangents, secant limit convergence, derivatives, and numerical Riemann sums."
      currentStep={currentStep}
      maxSteps={5}
      statusMessage={`Secant Slope (Δx = ${deltaX.toFixed(3)}) = ${formatNumber(secantSlope, 4)} → True Tangent f'(x) = ${formatNumber(trueSlope, 4)}`}
      stepPhase={`Limit Step Δx = ${deltaX.toFixed(3)}`}
      onStep={step}
      onStepBackward={stepBackward}
      onReset={() => {
        setDeltaX(0.8);
        setCurrentStep(1);
      }}
      pseudocode={PSEUDOCODE}
      activePseudocodeLine={currentStep - 1}
      canvasRef={canvasRef}
      datasetToExport={{
        function: fn,
        parameters: params,
        tangentX,
        deltaX,
        fx: fx0,
        trueDerivative: trueSlope,
        secantSlope,
      }}
      visualization={
        <div className="relative w-full h-full">
          <canvas ref={canvasRef} className="w-full h-full" aria-label="Function graph canvas" />
          <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] text-slate-300 pointer-events-none border border-white/10">
            Amber = True Tangent Line · Pink = Secant Line (Δx)
          </div>
        </div>
      }
      controls={
        <>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              Function Preset
            </label>
            <select
              value={fn}
              onChange={(e) => setFn(e.target.value as MathFunction)}
              className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm font-medium"
            >
              {FUNCTION_PRESETS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          <Slider
            label="Evaluation Point (x₀)"
            value={tangentX}
            min={xMin + 0.5}
            max={xMax - 0.5}
            step={0.1}
            onChange={setTangentX}
            tooltip="Coordinate where tangent derivative is evaluated"
          />
          <Slider
            label="Displacement Step (Δx)"
            value={deltaX}
            min={0.01}
            max={2.0}
            step={0.01}
            onChange={setDeltaX}
            tooltip="Finite difference interval for secant line"
            formatValue={(v) => v.toFixed(3)}
          />

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--border)] text-xs">
            <label className="flex items-center gap-2 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={showSecant}
                onChange={(e) => setShowSecant(e.target.checked)}
                className="rounded text-[var(--accent)]"
              />
              Show Secant (Δx)
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={showTangent}
                onChange={(e) => setShowTangent(e.target.checked)}
                className="rounded text-[var(--accent)]"
              />
              Show Tangent
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={showDerivative}
                onChange={(e) => setShowDerivative(e.target.checked)}
                className="rounded text-[var(--accent)]"
              />
              Show f&apos;(x) Curve
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-medium">
              <input
                type="checkbox"
                checked={showRiemann}
                onChange={(e) => setShowRiemann(e.target.checked)}
                className="rounded text-[var(--accent)]"
              />
              Riemann Integral
            </label>
          </div>
        </>
      }
      metrics={[
        { label: "Function Value f(x₀)", value: formatNumber(fx0, 4), highlight: true },
        { label: "True Derivative f'(x₀)", value: formatNumber(trueSlope, 4), highlight: true },
        { label: "Secant Slope (Δx)", value: formatNumber(secantSlope, 4) },
        { label: "Approximation Error", value: formatNumber(Math.abs(secantSlope - trueSlope), 5) },
      ]}
      explanations={[
        {
          title: "Limit Definition of Derivative",
          content:
            "The derivative represents the instantaneous rate of change of a function, obtained as the secant displacement Δx approaches zero.",
          latex: "f'(x) = \\lim_{\\Delta x \\to 0} \\frac{f(x + \\Delta x) - f(x)}{\\Delta x}",
        },
        {
          title: "Riemann Sums & Definite Integrals",
          content:
            "The area under the curve is approximated by summing the areas of N rectangular partitions.",
          latex: "\\int_{a}^{b} f(x) \\, dx = \\lim_{n \\to \\infty} \\sum_{i=1}^n f(x_i^*) \\Delta x",
        },
      ]}
    />
  );
}
