"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { LabLayout } from "@/components/visualization/LabLayout";
import { Slider } from "@/components/controls/Slider";
import { NeuralNetworkEngine, dataToNetworkInput } from "@/algorithms/neural-networks/network";
import { generateDataset } from "@/algorithms/datasets";
import { formatNumber } from "@/lib/utils";
import { createCoordSystem, drawGlowCircle } from "@/lib/canvas";
import type { ActivationType } from "@/algorithms/neural-networks/activations";
import type { DataPoint } from "@/types";

const DATASETS = ["blobs", "circles", "xor", "spiral"] as const;
const ACTIVATIONS: ActivationType[] = ["relu", "sigmoid", "tanh", "gelu"];

const PSEUDOCODE = [
  "1. Input sample x into input layer neurons: a^(0) = x",
  "2. Forward Pass: For layer l = 1...L: z^(l) = W^(l) a^(l-1) + b^(l),  a^(l) = σ(z^(l))",
  "3. Compute output loss L(y, a^(L)) = - [y ln(a^(L)) + (1-y) ln(1-a^(L))]",
  "4. Backward Pass (Chain Rule): Compute error deltas δ^(l) = (W^(l+1))^T δ^(l+1) ⊙ σ'(z^(l))",
  "5. Compute gradients: ∂L/∂W^(l) = δ^(l) (a^(l-1))^T,  ∂L/∂b^(l) = δ^(l)",
  "6. Update weights & biases: W^(l) ← W^(l) - α(∂L/∂W^(l)),  b^(l) ← b^(l) - α(∂L/∂b^(l))",
];

interface HistoryState {
  weights: number[][][];
  biases: number[][];
  epoch: number;
  lossHistory: number[];
}

export default function NeuralNetworkPlaygroundViz() {
  const [hiddenLayers, setHiddenLayers] = useState(2);
  const [neuronsPerLayer, setNeuronsPerLayer] = useState(4);
  const [activation, setActivation] = useState<ActivationType>("tanh");
  const [learningRate, setLearningRate] = useState(0.15);
  const [dataset, setDataset] = useState<typeof DATASETS[number]>("spiral");
  const [data, setData] = useState<DataPoint[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [currentStep, setCurrentStep] = useState(0);
  const [isConverged, setIsConverged] = useState(false);
  const [activeCodeLine, setActiveCodeLine] = useState(0);
  const [selectedNeuron, setSelectedNeuron] = useState<{ layer: number; neuron: number } | null>(null);

  const dataCanvasRef = useRef<HTMLCanvasElement>(null);
  const networkCanvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef(
    new NeuralNetworkEngine({ layers: [2, 4, 4, 1], activation: "tanh", learningRate: 0.15 })
  );
  const animTimerRef = useRef<NodeJS.Timeout | null>(null);
  const historyStackRef = useRef<HistoryState[]>([]);

  const rebuildNetwork = useCallback(() => {
    if (animTimerRef.current) clearTimeout(animTimerRef.current);
    setIsRunning(false);
    setIsPaused(false);
    setIsConverged(false);
    setCurrentStep(0);
    setActiveCodeLine(0);

    const layers = [2, ...Array(hiddenLayers).fill(neuronsPerLayer), 1];
    engineRef.current = new NeuralNetworkEngine({ layers, activation, learningRate });
    historyStackRef.current = [];
  }, [hiddenLayers, neuronsPerLayer, activation, learningRate]);

  const regenerateData = useCallback(() => {
    const newData = generateDataset(dataset, 100, 0.4);
    setData(newData);
    rebuildNetwork();
  }, [dataset, rebuildNetwork]);

  useEffect(() => {
    regenerateData();
  }, [regenerateData]);

  // Execute 1 Training Step (5 batch epochs)
  const step = useCallback(() => {
    if (isConverged || data.length === 0) return;

    const engine = engineRef.current;

    // Save snapshot
    historyStackRef.current.push({
      weights: engine.weights.map((l) => l.map((r) => [...r])),
      biases: engine.biases.map((b) => [...b]),
      epoch: currentStep,
      lossHistory: [...engine.lossHistory],
    });

    const { inputs, labels } = dataToNetworkInput(data);
    for (let e = 0; e < 5; e++) {
      engine.trainStep(inputs, labels);
    }

    const newStep = currentStep + 5;
    setCurrentStep(newStep);

    // Check convergence or low loss
    const history = engine.lossHistory;
    if (history.length > 0 && (history[history.length - 1] < 0.05 || newStep >= 250)) {
      setIsConverged(true);
      setIsRunning(false);
      setActiveCodeLine(5);
    } else {
      setActiveCodeLine(4);
    }
  }, [data, isConverged, currentStep]);

  // Step Backward
  const stepBackward = useCallback(() => {
    if (historyStackRef.current.length === 0) return;
    const prev = historyStackRef.current.pop()!;
    engineRef.current.weights = prev.weights.map((l) => l.map((r) => [...r]));
    engineRef.current.biases = prev.biases.map((b) => [...b]);
    engineRef.current.lossHistory = [...prev.lossHistory];
    setCurrentStep(prev.epoch);
    setIsConverged(false);
  }, []);

  // Auto-play loop
  useEffect(() => {
    if (isRunning && !isPaused && !isConverged) {
      const delay = Math.max(30, 250 / speed);
      animTimerRef.current = setTimeout(() => {
        step();
      }, delay);
    }
    return () => {
      if (animTimerRef.current) clearTimeout(animTimerRef.current);
    };
  }, [isRunning, isPaused, isConverged, currentStep, speed, step]);

  const handlePlay = () => {
    if (isConverged) rebuildNetwork();
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
    const { inputs, labels } = dataToNetworkInput(data);
    for (let e = 0; e < 60; e++) {
      engineRef.current.trainStep(inputs, labels);
    }
    setCurrentStep((s) => s + 60);
    setIsConverged(true);
  };

  // Draw 2D Decision Surface Canvas
  const drawData = useCallback(() => {
    const canvas = dataCanvasRef.current;
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
    const padding = 20;
    const xRange: [number, number] = [-5, 5];
    const yRange: [number, number] = [-5, 5];
    const { toCanvas } = createCoordSystem(w, h, padding, xRange, yRange);

    ctx.clearRect(0, 0, w, h);

    // Decision boundary heatmap
    const resolution = 36;
    const cellW = (w - padding * 2) / resolution;
    const cellH = (h - padding * 2) / resolution;

    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        const x = xRange[0] + (i / resolution) * (xRange[1] - xRange[0]);
        const y = yRange[0] + (j / resolution) * (yRange[1] - yRange[0]);
        const pred = engineRef.current.forward([x / 5, y / 5])[0] || 0;

        const { cx, cy } = toCanvas(x, y);
        const r = Math.floor(pred * 99 + (1 - pred) * 16);
        const g = Math.floor(pred * 102 + (1 - pred) * 185);
        const b = Math.floor(pred * 241 + (1 - pred) * 129);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.28)`;
        ctx.fillRect(cx, cy - cellH, cellW + 1, cellH + 1);
      }
    }

    // Data Points
    data.forEach((p) => {
      const { cx, cy } = toCanvas(p.x, p.y);
      const color = p.label === 1 ? "#6366f1" : "#10b981";
      drawGlowCircle(ctx, cx, cy, 4, color, color, "#ffffff");
    });
  }, [data, currentStep]);

  // Draw Neural Network Synapse Graph
  const drawNetwork = useCallback(() => {
    const canvas = networkCanvasRef.current;
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
    ctx.clearRect(0, 0, w, h);

    const layers = engineRef.current.config.layers;
    const layerSpacing = w / (layers.length + 1);
    const nodes: { x: number; y: number; layer: number; idx: number }[] = [];

    layers.forEach((count, li) => {
      const x = layerSpacing * (li + 1);
      const spacing = h / (count + 1);
      for (let ni = 0; ni < count; ni++) {
        nodes.push({ x, y: spacing * (ni + 1), layer: li, idx: ni });
      }
    });

    // Synaptic weight connections
    let offset = 0;
    for (let li = 0; li < layers.length - 1; li++) {
      const currentCount = layers[li];
      const nextOffset = offset + currentCount;
      const weights = engineRef.current.weights[li];

      for (let i = 0; i < currentCount; i++) {
        for (let j = 0; j < layers[li + 1]; j++) {
          const from = nodes[offset + i];
          const to = nodes[nextOffset + j];
          const weight = weights?.[j]?.[i] ?? 0;
          const absW = Math.min(Math.abs(weight), 3);

          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.lineTo(to.x, to.y);
          ctx.strokeStyle =
            weight >= 0
              ? `rgba(99, 102, 241, ${0.2 + (absW / 3) * 0.7})`
              : `rgba(239, 68, 68, ${0.2 + (absW / 3) * 0.7})`;
          ctx.lineWidth = Math.max(0.75, absW * 1.8);
          ctx.stroke();
        }
      }
      offset += currentCount;
    }

    // Neurons
    nodes.forEach((node) => {
      const isSelected =
        selectedNeuron?.layer === node.layer && selectedNeuron?.neuron === node.idx;
      const act = engineRef.current.lastActivations[node.layer]?.[node.idx] ?? 0.5;

      ctx.save();
      ctx.beginPath();
      ctx.arc(node.x, node.y, 9, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(99, 102, 241, ${0.4 + act * 0.6})`;
      ctx.fill();
      ctx.strokeStyle = isSelected ? "#f59e0b" : "#ffffff";
      ctx.lineWidth = isSelected ? 2.5 : 1.5;
      ctx.stroke();
      ctx.restore();
    });
  }, [selectedNeuron, currentStep]);

  useEffect(() => {
    drawData();
    drawNetwork();
  }, [drawData, drawNetwork]);

  const lossHistory = engineRef.current.lossHistory;
  const currentLoss = lossHistory.length > 0 ? lossHistory[lossHistory.length - 1] : 0.693;

  // Compute Accuracy
  let correct = 0;
  data.forEach((p) => {
    const pred = engineRef.current.forward([p.x / 5, p.y / 5])[0] || 0;
    if ((pred >= 0.5 ? 1 : 0) === p.label) correct++;
  });
  const accuracy = data.length > 0 ? (correct / data.length) * 100 : 50;

  return (
    <LabLayout
      algorithmId="neural-network-playground"
      title="Neural Network Playground"
      subtitle="Construct multi-layer perceptrons, choose activations, and watch non-linear decision boundaries learn step-by-step."
      currentStep={currentStep}
      maxSteps={200}
      isRunning={isRunning}
      isPaused={isPaused}
      isConverged={isConverged}
      statusMessage={`Epoch ${currentStep} · Classification Accuracy = ${accuracy.toFixed(1)}% (Loss = ${formatNumber(currentLoss, 4)})`}
      stepPhase={`Epoch ${currentStep} · Loss: ${formatNumber(currentLoss, 3)}`}
      playbackSpeed={speed}
      onStep={step}
      onStepBackward={stepBackward}
      onRun={handlePlay}
      onPause={handlePause}
      onFastForward={handleFastForward}
      onReset={rebuildNetwork}
      onRandomize={regenerateData}
      onSpeedChange={setSpeed}
      pseudocode={PSEUDOCODE}
      activePseudocodeLine={activeCodeLine}
      canvasRef={dataCanvasRef}
      datasetToExport={{
        layers: engineRef.current.config.layers,
        activation,
        learningRate,
        epoch: currentStep,
        accuracy,
        loss: currentLoss,
      }}
      visualization={
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full h-full p-3 bg-[var(--background)]">
          {/* Decision Space Canvas */}
          <div className="relative rounded-xl border border-[var(--border)] bg-[#090d16] overflow-hidden flex flex-col items-center justify-center p-2">
            <span className="absolute top-2 left-2.5 text-[10px] uppercase font-bold text-slate-400 bg-black/50 px-2 py-0.5 rounded">
              Decision Boundary
            </span>
            <canvas ref={dataCanvasRef} className="w-full h-full aspect-square" />
          </div>

          {/* Network Graph Canvas */}
          <div className="relative rounded-xl border border-[var(--border)] bg-[#090d16] overflow-hidden flex flex-col items-center justify-center p-2">
            <span className="absolute top-2 left-2.5 text-[10px] uppercase font-bold text-slate-400 bg-black/50 px-2 py-0.5 rounded">
              Synaptic Graph
            </span>
            <canvas ref={networkCanvasRef} className="w-full h-full aspect-square" />
          </div>
        </div>
      }
      controls={
        <>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              Dataset Topology
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {DATASETS.map((d) => (
                <button
                  key={d}
                  onClick={() => setDataset(d)}
                  className={`py-1.5 rounded-lg text-xs font-semibold capitalize border transition-all ${
                    dataset === d
                      ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                      : "border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--card-hover)]"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              Activation Function
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {ACTIVATIONS.map((act) => (
                <button
                  key={act}
                  onClick={() => setActivation(act)}
                  className={`py-1.5 rounded-lg text-xs font-semibold uppercase border transition-all ${
                    activation === act
                      ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                      : "border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--card-hover)]"
                  }`}
                >
                  {act}
                </button>
              ))}
            </div>
          </div>

          <Slider
            label="Hidden Layers"
            value={hiddenLayers}
            min={1}
            max={4}
            step={1}
            onChange={setHiddenLayers}
            tooltip="Number of intermediate hidden representation layers"
          />
          <Slider
            label="Neurons Per Layer"
            value={neuronsPerLayer}
            min={2}
            max={8}
            step={1}
            onChange={setNeuronsPerLayer}
          />
          <Slider
            label="Learning Rate (α)"
            value={learningRate}
            min={0.01}
            max={0.5}
            step={0.01}
            onChange={setLearningRate}
            formatValue={(v) => v.toFixed(2)}
          />
        </>
      }
      metrics={[
        { label: "Classification Accuracy", value: `${accuracy.toFixed(1)}%`, highlight: true },
        { label: "Training Loss", value: formatNumber(currentLoss, 4), highlight: true },
        { label: "Architecture", value: `[2, ${Array(hiddenLayers).fill(neuronsPerLayer).join(", ")}, 1]` },
        { label: "Activation", value: activation.toUpperCase() },
      ]}
      explanations={[
        {
          title: "Multi-Layer Perceptron (MLP) Forward Pass",
          content:
            "Linear affine combinations are computed at every layer and transformed through non-linear activation functions to project feature spaces into separable geometries.",
          latex: "\\mathbf{z}^{(l)} = \\mathbf{W}^{(l)} \\mathbf{a}^{(l-1)} + \\mathbf{b}^{(l)}, \\quad \\mathbf{a}^{(l)} = \\sigma(\\mathbf{z}^{(l)})",
        },
        {
          title: "Backpropagation via Generalized Chain Rule",
          content:
            "Errors are propagated backward through layers to compute partial derivatives of total loss with respect to every synaptic weight.",
          latex: "\\delta^{(l)} = \\left( (\\mathbf{W}^{(l+1)})^T \\delta^{(l+1)} \\right) \\odot \\sigma'(\\mathbf{z}^{(l)}), \\quad \\frac{\\partial L}{\\partial \\mathbf{W}^{(l)}} = \\delta^{(l)} (\\mathbf{a}^{(l-1)})^T",
        },
      ]}
    />
  );
}
