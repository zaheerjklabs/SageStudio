"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { LabLayout } from "@/components/visualization/LabLayout";
import { Slider } from "@/components/controls/Slider";
import { NeuralNetworkEngine, dataToNetworkInput } from "@/algorithms/neural-networks/network";
import { generateDataset } from "@/algorithms/datasets";
import { formatNumber } from "@/lib/utils";
import { createCoordSystem, CLUSTER_COLORS } from "@/lib/canvas";
import type { ActivationType } from "@/algorithms/neural-networks/activations";
import type { DataPoint } from "@/types";

const DATASETS = ["blobs", "circles", "xor", "spiral"] as const;
const ACTIVATIONS: ActivationType[] = ["relu", "sigmoid", "tanh", "gelu"];

export default function NeuralNetworkPlaygroundViz() {
  const [hiddenLayers, setHiddenLayers] = useState(2);
  const [neuronsPerLayer, setNeuronsPerLayer] = useState(4);
  const [activation, setActivation] = useState<ActivationType>("relu");
  const [learningRate, setLearningRate] = useState(0.1);
  const [dataset, setDataset] = useState<typeof DATASETS[number]>("blobs");
  const [data, setData] = useState<DataPoint[]>([]);
  const [isTraining, setIsTraining] = useState(false);
  const [tick, setTick] = useState(0);
  const [selectedNeuron, setSelectedNeuron] = useState<{ layer: number; neuron: number } | null>(null);

  const dataCanvasRef = useRef<HTMLCanvasElement>(null);
  const networkCanvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef(
    new NeuralNetworkEngine({ layers: [2, 4, 4, 1], activation: "relu", learningRate: 0.1 })
  );
  const animRef = useRef<number>(0);

  const rebuildNetwork = useCallback(() => {
    const layers = [2, ...Array(hiddenLayers).fill(neuronsPerLayer), 1];
    engineRef.current.updateConfig({ layers, activation, learningRate });
    setTick((t) => t + 1);
  }, [hiddenLayers, neuronsPerLayer, activation, learningRate]);

  const regenerateData = useCallback(() => {
    const newData = generateDataset(dataset, 100, 0.5);
    setData(newData);
  }, [dataset]);

  useEffect(() => { regenerateData(); }, [regenerateData]);
  useEffect(() => { rebuildNetwork(); }, [rebuildNetwork]);

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

    // Decision boundary
    const resolution = 40;
    const cellW = (w - padding * 2) / resolution;
    const cellH = (h - padding * 2) / resolution;
    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        const x = xRange[0] + (i / resolution) * (xRange[1] - xRange[0]);
        const y = yRange[0] + (j / resolution) * (yRange[1] - yRange[0]);
        const pred = engineRef.current.forward([x / 5, y / 5])[0];
        const intensity = pred;
        ctx.fillStyle = `rgba(99, 102, 241, ${intensity * 0.3})`;
        const { cx, cy } = toCanvas(x, y);
        ctx.fillRect(cx, cy - cellH, cellW + 1, cellH + 1);
      }
    }

    data.forEach((p) => {
      const { cx, cy } = toCanvas(p.x, p.y);
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fillStyle = p.label === 1 ? "#6366f1" : "#10b981";
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1;
      ctx.stroke();
    });
  }, [data, tick]);

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

    // Connections
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
          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.lineTo(to.x, to.y);
          ctx.strokeStyle = weight > 0
            ? `rgba(99, 102, 241, ${Math.min(Math.abs(weight), 1) * 0.5})`
            : `rgba(239, 68, 68, ${Math.min(Math.abs(weight), 1) * 0.5})`;
          ctx.lineWidth = Math.abs(weight) * 2 + 0.5;
          ctx.stroke();
        }
      }
      offset += currentCount;
    }

    // Nodes
    nodes.forEach((node) => {
      const isSelected =
        selectedNeuron?.layer === node.layer && selectedNeuron?.neuron === node.idx;
      const act = engineRef.current.lastActivations[node.layer]?.[node.idx] ?? 0;
      const radius = 8 + act * 6;

      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(99, 102, 241, ${0.3 + act * 0.7})`;
      ctx.fill();
      ctx.strokeStyle = isSelected ? "#f59e0b" : "var(--border)";
      ctx.lineWidth = isSelected ? 2.5 : 1;
      ctx.stroke();
    });
  }, [tick, selectedNeuron]);

  useEffect(() => {
    drawData();
    drawNetwork();
    const onResize = () => { drawData(); drawNetwork(); };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [drawData, drawNetwork]);

  const train = useCallback(() => {
    setIsTraining(true);
    const { inputs, labels } = dataToNetworkInput(data);

    const loop = () => {
      for (let i = 0; i < 5; i++) {
        engineRef.current.trainStep(inputs, labels);
      }
      setTick((t) => t + 1);
      if (engineRef.current.epoch < 500) {
        animRef.current = requestAnimationFrame(loop);
      } else {
        setIsTraining(false);
      }
    };
    animRef.current = requestAnimationFrame(loop);
  }, [data]);

  useEffect(() => () => cancelAnimationFrame(animRef.current), []);

  const { inputs, labels } = dataToNetworkInput(data);
  const accuracy = engineRef.current.getAccuracy(inputs, labels);
  const loss = engineRef.current.lossHistory.at(-1) ?? 0;

  return (
    <LabLayout
      algorithmId="neural-network-playground"
      title="Neural Network Playground"
      subtitle="Build and train neural networks interactively."
      onReset={() => { cancelAnimationFrame(animRef.current); setIsTraining(false); rebuildNetwork(); regenerateData(); }}
      onRun={train}
      isTraining={isTraining}
      visualization={
        <div className="w-full h-full grid grid-cols-1 md:grid-cols-2 gap-0">
          <canvas ref={dataCanvasRef} className="w-full h-full border-r border-[var(--border)]" aria-label="Classification data and decision boundary" />
          <canvas ref={networkCanvasRef} className="w-full h-full" aria-label="Neural network architecture" />
        </div>
      }
      controls={
        <>
          <div className="space-y-2">
            <label className="text-sm font-medium">Dataset</label>
            <select
              value={dataset}
              onChange={(e) => setDataset(e.target.value as typeof DATASETS[number])}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm"
            >
              {DATASETS.map((d) => (
                <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
              ))}
            </select>
          </div>
          <Slider label="Hidden Layers" value={hiddenLayers} min={1} max={4} step={1} onChange={setHiddenLayers} />
          <Slider label="Neurons per Layer" value={neuronsPerLayer} min={2} max={8} step={1} onChange={setNeuronsPerLayer} />
          <div className="space-y-2">
            <label className="text-sm font-medium">Activation</label>
            <select
              value={activation}
              onChange={(e) => setActivation(e.target.value as ActivationType)}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm"
            >
              {ACTIVATIONS.map((a) => (
                <option key={a} value={a}>{a.toUpperCase()}</option>
              ))}
            </select>
          </div>
          <Slider label="Learning Rate" value={learningRate} min={0.01} max={0.5} step={0.01} onChange={setLearningRate} formatValue={(v) => v.toFixed(2)} />
        </>
      }
      metrics={[
        { label: "Accuracy", value: `${(accuracy * 100).toFixed(1)}%`, highlight: true },
        { label: "Loss", value: formatNumber(loss) },
        { label: "Epoch", value: engineRef.current.epoch },
        { label: "Layers", value: hiddenLayers + 2 },
      ]}
      explanations={[
        {
          title: "What is happening?",
          content: "The network learns to classify data points by adjusting weights through backpropagation. Blue regions show where the network predicts class 1.",
        },
        {
          title: "Mathematics",
          content: "Forward propagation computes activations layer by layer. Backpropagation computes gradients to update weights.",
          latex: "z^{[l]} = W^{[l]} a^{[l-1]} + b^{[l]}, \\quad a^{[l]} = g(z^{[l]})",
        },
      ]}
    />
  );
}
