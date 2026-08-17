"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { LabLayout } from "@/components/visualization/LabLayout";
import { Slider } from "@/components/controls/Slider";
import { formatNumber } from "@/lib/utils";
import { drawGrid, drawAxes, createCoordSystem, clearCanvas, drawGlowCircle } from "@/lib/canvas";

export type ActivationName =
  | "relu"
  | "leaky_relu"
  | "sigmoid"
  | "tanh"
  | "gelu"
  | "swish"
  | "elu"
  | "softplus";

const ACTIVATION_SPECS: {
  name: ActivationName;
  label: string;
  latex: string;
  dLatex: string;
  eval: (x: number, alpha: number) => number;
  deriv: (x: number, alpha: number) => number;
}[] = [
  {
    name: "relu",
    label: "ReLU",
    latex: "f(x) = \\max(0, x)",
    dLatex: "f'(x) = \\begin{cases} 1 & x > 0 \\\\ 0 & x \\le 0 \\end{cases}",
    eval: (x) => Math.max(0, x),
    deriv: (x) => (x > 0 ? 1 : 0),
  },
  {
    name: "leaky_relu",
    label: "Leaky ReLU",
    latex: "f(x) = \\max(\\alpha x, x)",
    dLatex: "f'(x) = \\begin{cases} 1 & x > 0 \\\\ \\alpha & x \\le 0 \\end{cases}",
    eval: (x, a) => (x > 0 ? x : a * x),
    deriv: (x, a) => (x > 0 ? 1 : a),
  },
  {
    name: "sigmoid",
    label: "Sigmoid",
    latex: "f(x) = \\frac{1}{1 + e^{-x}}",
    dLatex: "f'(x) = f(x)(1 - f(x))",
    eval: (x) => 1 / (1 + Math.exp(-x)),
    deriv: (x) => {
      const s = 1 / (1 + Math.exp(-x));
      return s * (1 - s);
    },
  },
  {
    name: "tanh",
    label: "Tanh",
    latex: "f(x) = \\tanh(x) = \\frac{e^x - e^{-x}}{e^x + e^{-x}}",
    dLatex: "f'(x) = 1 - \\tanh^2(x)",
    eval: (x) => Math.tanh(x),
    deriv: (x) => 1 - Math.pow(Math.tanh(x), 2),
  },
  {
    name: "gelu",
    label: "GELU",
    latex: "f(x) = x \\Phi(x) \\approx 0.5x(1 + \\tanh(\\sqrt{2/\\pi}(x + 0.044715x^3)))",
    dLatex: "f'(x) = \\Phi(x) + x \\phi(x)",
    eval: (x) => 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * Math.pow(x, 3)))),
    deriv: (x) => {
      const c = Math.sqrt(2 / Math.PI) * (x + 0.044715 * Math.pow(x, 3));
      const tanhC = Math.tanh(c);
      const sech2C = 1 - tanhC * tanhC;
      const dC = Math.sqrt(2 / Math.PI) * (1 + 3 * 0.044715 * x * x);
      return 0.5 * (1 + tanhC) + 0.5 * x * sech2C * dC;
    },
  },
  {
    name: "swish",
    label: "Swish / SiLU",
    latex: "f(x) = x \\cdot \\sigma(x)",
    dLatex: "f'(x) = \\sigma(x) + x \\sigma(x)(1 - \\sigma(x))",
    eval: (x) => x / (1 + Math.exp(-x)),
    deriv: (x) => {
      const s = 1 / (1 + Math.exp(-x));
      return s + x * s * (1 - s);
    },
  },
  {
    name: "elu",
    label: "ELU",
    latex: "f(x) = \\begin{cases} x & x > 0 \\\\ \\alpha(e^x - 1) & x \\le 0 \\end{cases}",
    dLatex: "f'(x) = \\begin{cases} 1 & x > 0 \\\\ f(x) + \\alpha & x \\le 0 \\end{cases}",
    eval: (x, a) => (x > 0 ? x : a * (Math.exp(x) - 1)),
    deriv: (x, a) => (x > 0 ? 1 : a * Math.exp(x)),
  },
  {
    name: "softplus",
    label: "Softplus",
    latex: "f(x) = \\ln(1 + e^x)",
    dLatex: "f'(x) = \\sigma(x) = \\frac{1}{1 + e^{-x}}",
    eval: (x) => Math.log1p(Math.exp(x)),
    deriv: (x) => 1 / (1 + Math.exp(-x)),
  },
];

export default function ActivationFunctionsViz() {
  const [selectedAct, setSelectedAct] = useState<ActivationName>("relu");
  const [alpha, setAlpha] = useState(0.15);
  const [probeX, setProbeX] = useState(1.5);
  const [showDerivative, setShowDerivative] = useState(true);
  const [showTangent, setShowTangent] = useState(true);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spec = ACTIVATION_SPECS.find((a) => a.name === selectedAct) || ACTIVATION_SPECS[0];

  const fxVal = spec.eval(probeX, alpha);
  const dfxVal = spec.deriv(probeX, alpha);

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
    const xRange: [number, number] = [-5, 5];
    const yRange: [number, number] = [-2.5, 4.5];
    const { toCanvas } = createCoordSystem(w, h, padding, xRange, yRange);

    clearCanvas(ctx, w, h);
    drawGrid(ctx, w, h, padding, xRange, yRange);
    drawAxes(ctx, w, h, padding, xRange, yRange);

    // Primary Activation Curve f(x)
    ctx.save();
    ctx.shadowColor = "rgba(99, 102, 241, 0.7)";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    let started = false;
    for (let x = xRange[0]; x <= xRange[1]; x += 0.05) {
      const y = spec.eval(x, alpha);
      const { cx, cy } = toCanvas(x, y);
      if (!started) {
        ctx.moveTo(cx, cy);
        started = true;
      } else {
        ctx.lineTo(cx, cy);
      }
    }
    ctx.strokeStyle = "#6366f1";
    ctx.lineWidth = 3.5;
    ctx.stroke();
    ctx.restore();

    // Derivative Curve f'(x)
    if (showDerivative) {
      ctx.beginPath();
      started = false;
      for (let x = xRange[0]; x <= xRange[1]; x += 0.05) {
        const dy = spec.deriv(x, alpha);
        const { cx, cy } = toCanvas(x, dy);
        if (!started) {
          ctx.moveTo(cx, cy);
          started = true;
        } else {
          ctx.lineTo(cx, cy);
        }
      }
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Tangent Line at probeX
    if (showTangent) {
      const y0 = fxVal;
      const slope = dfxVal;
      const dx = 1.8;
      const pt1 = toCanvas(probeX - dx, y0 - slope * dx);
      const pt2 = toCanvas(probeX + dx, y0 + slope * dx);

      ctx.beginPath();
      ctx.moveTo(pt1.cx, pt1.cy);
      ctx.lineTo(pt2.cx, pt2.cy);
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Probe Point Marker
    const probeCanvas = toCanvas(probeX, fxVal);
    drawGlowCircle(ctx, probeCanvas.cx, probeCanvas.cy, 6.5, "#f59e0b", "rgba(245, 158, 11, 0.8)", "#ffffff");

    // Inset Legend
    const legX = w - padding - 130;
    const legY = padding + 8;
    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    ctx.strokeStyle = "rgba(148, 163, 184, 0.25)";
    ctx.lineWidth = 1;
    ctx.fillRect(legX, legY, 130, 48);
    ctx.strokeRect(legX, legY, 130, 48);

    // Blue legend line
    ctx.strokeStyle = "#6366f1";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(legX + 8, legY + 16);
    ctx.lineTo(legX + 28, legY + 16);
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.font = "10px sans-serif";
    ctx.fillText(`f(x): ${spec.label}`, legX + 34, legY + 19);

    // Green legend line
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(legX + 8, legY + 34);
    ctx.lineTo(legX + 28, legY + 34);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillText("f'(x): Derivative", legX + 34, legY + 37);
  }, [spec, alpha, probeX, fxVal, dfxVal, showDerivative, showTangent]);

  useEffect(() => {
    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [draw]);

  const isVanishingGradient = Math.abs(dfxVal) < 0.01;

  return (
    <LabLayout
      algorithmId="activation-functions"
      title="Neural Network Activation Functions"
      subtitle="Analyze non-linear mappings, first derivatives, and vanishing/exploding gradient behaviors."
      currentStep={1}
      maxSteps={1}
      statusMessage={`x = ${probeX.toFixed(2)} → f(x) = ${formatNumber(fxVal, 4)}, f'(x) = ${formatNumber(dfxVal, 4)}`}
      stepPhase={`${spec.label} Function & Derivative Analysis`}
      canvasRef={canvasRef}
      datasetToExport={{
        activation: spec.name,
        probeX,
        fx: fxVal,
        dfx: dfxVal,
      }}
      visualization={
        <div className="relative w-full h-full">
          <canvas ref={canvasRef} className="w-full h-full" aria-label="Activation function graph" />
          {isVanishingGradient && (
            <div className="absolute top-3 left-3 bg-amber-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg text-xs text-amber-300 border border-amber-500/40 animate-pulse">
              ⚠ Vanishing Gradient Warning: Slope f&apos;(x) ≈ 0
            </div>
          )}
        </div>
      }
      controls={
        <>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              Activation Function
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ACTIVATION_SPECS.map((act) => (
                <button
                  key={act.name}
                  onClick={() => setSelectedAct(act.name)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    selectedAct === act.name
                      ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                      : "border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--card-hover)]"
                  }`}
                >
                  {act.label}
                </button>
              ))}
            </div>
          </div>

          <Slider
            label="Evaluation Probe (x)"
            value={probeX}
            min={-4.5}
            max={4.5}
            step={0.1}
            onChange={setProbeX}
            tooltip="Input value along the real number line"
          />

          {(selectedAct === "leaky_relu" || selectedAct === "elu") && (
            <Slider
              label="Alpha Parameter (α)"
              value={alpha}
              min={0.01}
              max={0.5}
              step={0.01}
              onChange={setAlpha}
            />
          )}

          <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
              <input
                type="checkbox"
                checked={showDerivative}
                onChange={(e) => setShowDerivative(e.target.checked)}
                className="rounded text-[var(--accent)]"
              />
              Show Derivative f&apos;(x)
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium">
              <input
                type="checkbox"
                checked={showTangent}
                onChange={(e) => setShowTangent(e.target.checked)}
                className="rounded text-[var(--accent)]"
              />
              Show Tangent Slope
            </label>
          </div>
        </>
      }
      metrics={[
        { label: "Output f(x)", value: formatNumber(fxVal, 4), highlight: true },
        { label: "Derivative f'(x)", value: formatNumber(dfxVal, 4), highlight: true },
        { label: "Probe Location", value: `x = ${probeX.toFixed(2)}` },
        {
          label: "Gradient Regime",
          value: isVanishingGradient ? "Vanishing (≈0)" : "Active Flow",
        },
      ]}
      explanations={[
        {
          title: `Analytical Formula: ${spec.label}`,
          content: "The non-linear activation transformation mapped onto neuron pre-activations.",
          latex: spec.latex,
        },
        {
          title: "First Derivative (Gradient)",
          content:
            "Determines the magnitude of error signal transmitted during backpropagation. If f'(x) saturates near 0, deep networks suffer from the vanishing gradient problem.",
          latex: spec.dLatex,
        },
      ]}
    />
  );
}
