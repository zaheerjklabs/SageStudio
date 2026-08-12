"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { LabLayout } from "@/components/visualization/LabLayout";
import { Slider } from "@/components/controls/Slider";
import { formatNumber } from "@/lib/utils";

const TOKENS = ["The", "cat", "sat", "down"];

function computeAttention(
  tokens: string[],
  numHeads: number,
  temperature: number,
  selectedToken: number
): number[][] {
  const n = tokens.length;
  const matrix: number[][] = [];

  for (let i = 0; i < n; i++) {
    const row: number[] = [];
    for (let j = 0; j < n; j++) {
      let score = 0;
      if (i === j) score = 2.0;
      else if (Math.abs(i - j) === 1) score = 1.0;
      else score = 0.3;

      if (tokens[i].toLowerCase() === "cat" && tokens[j].toLowerCase() === "sat") score = 1.5;
      if (tokens[i].toLowerCase() === "the" && tokens[j].toLowerCase() === "cat") score = 1.2;

      score += (Math.sin(i * numHeads + j) * 0.2);
      row.push(score);
    }

    const scaled = row.map((s) => s / temperature);
    const maxS = Math.max(...scaled);
    const exps = scaled.map((s) => Math.exp(s - maxS));
    const sum = exps.reduce((a, b) => a + b, 0);
    matrix.push(exps.map((e) => e / sum));
  }

  return matrix;
}

export default function TransformerAttentionViz() {
  const [numHeads, setNumHeads] = useState(4);
  const [temperature, setTemperature] = useState(1.0);
  const [selectedToken, setSelectedToken] = useState(0);
  const [sequenceLength, setSequenceLength] = useState(4);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tokens = TOKENS.slice(0, sequenceLength);
  const attention = computeAttention(tokens, numHeads, temperature, selectedToken);

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
    ctx.clearRect(0, 0, w, h);

    const n = tokens.length;
    const labelSize = 60;
    const cellSize = Math.min((w - labelSize) / n, (h - labelSize) / n);

    // Column labels
    ctx.fillStyle = "var(--foreground)";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    tokens.forEach((token, j) => {
      const x = labelSize + j * cellSize + cellSize / 2;
      ctx.fillStyle = j === selectedToken ? "var(--accent)" : "var(--foreground)";
      ctx.font = j === selectedToken ? "bold 12px sans-serif" : "12px sans-serif";
      ctx.fillText(token, x, labelSize - 15);
    });

    // Row labels + heatmap
    tokens.forEach((token, i) => {
      const y = labelSize + i * cellSize;
      ctx.fillStyle = i === selectedToken ? "var(--accent)" : "var(--foreground)";
      ctx.font = i === selectedToken ? "bold 12px sans-serif" : "12px sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(token, labelSize - 10, y + cellSize / 2 + 4);

      for (let j = 0; j < n; j++) {
        const val = attention[i][j];
        const x = labelSize + j * cellSize;

        const isSelected = i === selectedToken || j === selectedToken;
        const intensity = val;

        ctx.fillStyle = isSelected
          ? `rgba(99, 102, 241, ${intensity})`
          : `rgba(99, 102, 241, ${intensity * 0.6})`;
        ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);

        ctx.fillStyle = intensity > 0.5 ? "#fff" : "var(--foreground)";
        ctx.font = "10px monospace";
        ctx.textAlign = "center";
        ctx.fillText(val.toFixed(2), x + cellSize / 2, y + cellSize / 2 + 3);
      }
    });
  }, [tokens, attention, selectedToken, numHeads, temperature]);

  useEffect(() => {
    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [draw]);

  return (
    <LabLayout
      algorithmId="transformer-attention"
      title="Transformer Attention"
      subtitle="Visualize self-attention and token relationships."
      visualization={
        <div className="w-full h-full flex flex-col items-center justify-center p-4">
          <canvas ref={canvasRef} className="w-full max-w-lg aspect-square" aria-label="Attention heatmap" />
          <div className="flex gap-2 mt-4 flex-wrap justify-center">
            {tokens.map((token, i) => (
              <button
                key={token}
                onClick={() => setSelectedToken(i)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                  selectedToken === i
                    ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                    : "border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--card-hover)]"
                }`}
              >
                {token}
              </button>
            ))}
          </div>
        </div>
      }
      controls={
        <>
          <Slider label="Number of Heads" value={numHeads} min={1} max={8} step={1} onChange={setNumHeads} tooltip="Multi-head attention heads" />
          <Slider label="Temperature" value={temperature} min={0.1} max={3} step={0.1} onChange={setTemperature} tooltip="Softmax temperature scaling" />
          <Slider label="Sequence Length" value={sequenceLength} min={2} max={4} step={1} onChange={setSequenceLength} />
        </>
      }
      metrics={[
        { label: "Selected", value: tokens[selectedToken] ?? "—", highlight: true },
        { label: "Heads", value: numHeads },
        { label: "Temperature", value: formatNumber(temperature, 1) },
        {
          label: "Max Attention",
          value: formatNumber(Math.max(...attention[selectedToken] ?? [0]), 2),
        },
      ]}
      explanations={[
        {
          title: "What is happening?",
          content: "The attention heatmap shows how much each token attends to every other token. Brighter cells indicate stronger attention. Click tokens to highlight their attention patterns.",
        },
        {
          title: "Mathematics",
          content: "Scaled dot-product attention computes compatibility between query and key vectors.",
          latex: "\\text{Attention}(Q,K,V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V",
        },
        {
          title: "Multi-Head Attention",
          content: "Multiple attention heads allow the model to attend to different representation subspaces.",
          latex: "\\text{MultiHead}(Q,K,V) = \\text{Concat}(\\text{head}_1, ..., \\text{head}_h)W^O",
        },
      ]}
    />
  );
}
