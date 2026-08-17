"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { LabLayout } from "@/components/visualization/LabLayout";
import { Slider } from "@/components/controls/Slider";
import { formatNumber } from "@/lib/utils";

const SENTENCES = [
  ["The", "animal", "didn't", "cross", "the", "street", "because", "it", "was", "tired"],
  ["Attention", "is", "all", "you", "need", "for", "modern", "AI"],
  ["The", "transformer", "model", "learns", "contextual", "word", "relationships"],
];

const PSEUDOCODE = [
  "1. Project input token embeddings into Query (Q), Key (K), and Value (V) matrices",
  "2. Compute pairwise token compatibility dot-products: S = Q · K^T",
  "3. Scale by square root of head dimension: S_scaled = S / √d_k",
  "4. Apply Softmax row-wise to derive attention probability distribution: A = softmax(S_scaled / τ)",
  "5. Compute contextual output representations: Context = A · V",
  "6. Concatenate multi-head projections and apply final linear output projection W_O",
];

function computeAttentionMatrix(tokens: string[], headIdx: number, temperature: number): number[][] {
  const n = tokens.length;
  const matrix: number[][] = [];

  for (let i = 0; i < n; i++) {
    const row: number[] = [];
    for (let j = 0; j < n; j++) {
      let score = 0;
      // Syntactic/semantic attention heuristic
      if (i === j) score += 2.2;
      else if (Math.abs(i - j) === 1) score += 1.4;
      else score += 0.4;

      // Special contextual links
      const tI = tokens[i].toLowerCase();
      const tJ = tokens[j].toLowerCase();
      if (tI === "it" && tJ === "animal") score += 3.2;
      if (tI === "cross" && tJ === "street") score += 2.6;
      if (tI === "tired" && (tJ === "it" || tJ === "animal")) score += 2.8;
      if (tI === "attention" && tJ === "ai") score += 3.0;
      if (tI === "transformer" && tJ === "model") score += 2.5;

      // Multi-head specialization variance
      score += Math.sin((i + 1) * (headIdx + 1) * 1.5 + j) * 0.7;
      row.push(score);
    }

    // Softmax with temperature
    const scaled = row.map((s) => s / Math.max(0.1, temperature));
    const maxS = Math.max(...scaled);
    const exps = scaled.map((s) => Math.exp(s - maxS));
    const sum = exps.reduce((a, b) => a + b, 0);
    matrix.push(exps.map((e) => e / (sum || 1)));
  }

  return matrix;
}

export default function TransformerAttentionViz() {
  const [sentenceIdx, setSentenceIdx] = useState(0);
  const [selectedHead, setSelectedHead] = useState(1);
  const [temperature, setTemperature] = useState(1.0);
  const [selectedTokenIdx, setSelectedTokenIdx] = useState(0);
  const [currentStep, setCurrentStep] = useState(4);
  const [viewMode, setViewMode] = useState<"heatmap" | "arcs">("heatmap");
  const [activeCodeLine, setActiveCodeLine] = useState(3);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tokens = SENTENCES[sentenceIdx];
  const attention = computeAttentionMatrix(tokens, selectedHead, temperature);

  const step = () => {
    setCurrentStep((s) => {
      const next = (s + 1) % 5;
      setActiveCodeLine(next);
      return next;
    });
  };

  const stepBackward = () => {
    setCurrentStep((s) => {
      const prev = Math.max(0, s - 1);
      setActiveCodeLine(prev);
      return prev;
    });
  };

  // Draw Heatmap and Token Connection Arcs
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

    if (viewMode === "heatmap") {
      const labelPad = 65;
      const cellSize = Math.min((w - labelPad - 20) / n, (h - labelPad - 20) / n);
      const startX = labelPad;
      const startY = labelPad;

      // Draw Column Headers (Top)
      ctx.textAlign = "center";
      tokens.forEach((tok, j) => {
        const x = startX + j * cellSize + cellSize / 2;
        ctx.fillStyle = j === selectedTokenIdx ? "#6366f1" : "rgba(148, 163, 184, 0.85)";
        ctx.font = j === selectedTokenIdx ? "bold 10px sans-serif" : "9.5px sans-serif";
        ctx.fillText(tok, x, startY - 10);
      });

      // Draw Row Headers & Matrix Cells
      tokens.forEach((tok, i) => {
        const y = startY + i * cellSize;
        ctx.textAlign = "right";
        ctx.fillStyle = i === selectedTokenIdx ? "#6366f1" : "rgba(148, 163, 184, 0.85)";
        ctx.font = i === selectedTokenIdx ? "bold 10px sans-serif" : "9.5px sans-serif";
        ctx.fillText(tok, startX - 8, y + cellSize / 2 + 3);

        for (let j = 0; j < n; j++) {
          const val = attention[i][j];
          const x = startX + j * cellSize;
          const isSelectedRow = i === selectedTokenIdx;

          // Glowing heat cell
          ctx.fillStyle = isSelectedRow
            ? `rgba(99, 102, 241, ${Math.min(1, val * 1.5)})`
            : `rgba(99, 102, 241, ${val * 0.75})`;
          ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);

          if (isSelectedRow) {
            ctx.strokeStyle = "rgba(99, 102, 241, 0.8)";
            ctx.lineWidth = 1.5;
            ctx.strokeRect(x + 1, y + 1, cellSize - 2, cellSize - 2);
          }

          // Numeric attention weight text
          if (cellSize > 24) {
            ctx.fillStyle = val > 0.35 ? "#ffffff" : "rgba(255, 255, 255, 0.6)";
            ctx.font = "8.5px monospace";
            ctx.textAlign = "center";
            ctx.fillText(val.toFixed(2), x + cellSize / 2, y + cellSize / 2 + 3);
          }
        }
      });
    } else {
      // Token-to-Token Arc Connections View
      const padY = 50;
      const leftX = 80;
      const rightX = w - 80;
      const itemSpacing = (h - padY * 2) / (n - 1);

      tokens.forEach((tok, i) => {
        const y = padY + i * itemSpacing;

        // Left Token (Source / Query)
        ctx.textAlign = "right";
        ctx.fillStyle = i === selectedTokenIdx ? "#6366f1" : "#94a3b8";
        ctx.font = i === selectedTokenIdx ? "bold 12px sans-serif" : "11px sans-serif";
        ctx.fillText(tok, leftX - 10, y + 4);

        ctx.beginPath();
        ctx.arc(leftX, y, i === selectedTokenIdx ? 5 : 3, 0, Math.PI * 2);
        ctx.fillStyle = i === selectedTokenIdx ? "#6366f1" : "#64748b";
        ctx.fill();

        // Right Token (Target / Key)
        ctx.textAlign = "left";
        ctx.fillStyle = "#94a3b8";
        ctx.font = "11px sans-serif";
        ctx.fillText(tok, rightX + 10, y + 4);

        ctx.beginPath();
        ctx.arc(rightX, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = "#64748b";
        ctx.fill();
      });

      // Draw connection lines from selected token to all keys
      const srcY = padY + selectedTokenIdx * itemSpacing;
      tokens.forEach((_, j) => {
        const tgtY = padY + j * itemSpacing;
        const weight = attention[selectedTokenIdx][j];

        ctx.beginPath();
        ctx.moveTo(leftX, srcY);
        ctx.bezierCurveTo(leftX + 100, srcY, rightX - 100, tgtY, rightX, tgtY);
        ctx.strokeStyle = `rgba(99, 102, 241, ${Math.min(1, weight * 1.8)})`;
        ctx.lineWidth = Math.max(0.5, weight * 8);
        ctx.stroke();
      });
    }
  }, [tokens, attention, selectedTokenIdx, viewMode]);

  useEffect(() => {
    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [draw]);

  const activeRowWeights = attention[selectedTokenIdx] || [];
  const maxAttnVal = Math.max(...activeRowWeights, 0);

  return (
    <LabLayout
      algorithmId="transformer-attention"
      title="Transformer Scaled Dot-Product Attention"
      subtitle="Examine multi-head self-attention mechanisms and dynamic token relationships."
      currentStep={currentStep + 1}
      maxSteps={5}
      isConverged={currentStep === 4}
      statusMessage={`Token "${tokens[selectedTokenIdx]}" · Head #${selectedHead} · Peak Attention Weight = ${formatNumber(maxAttnVal, 3)}`}
      stepPhase={`Stage ${currentStep + 1}/5: ${
        currentStep === 0
          ? "Query / Key / Value Projections"
          : currentStep === 1
          ? "Pairwise Compatibility Dot-Product"
          : currentStep === 2
          ? "Scaling by √d_k"
          : currentStep === 3
          ? "Softmax Attention Probability"
          : "Contextual Value Aggregation"
      }`}
      onStep={step}
      onStepBackward={stepBackward}
      onReset={() => setCurrentStep(0)}
      pseudocode={PSEUDOCODE}
      activePseudocodeLine={activeCodeLine}
      canvasRef={canvasRef}
      datasetToExport={{
        sentence: tokens.join(" "),
        selectedHead,
        temperature,
        selectedToken: tokens[selectedTokenIdx],
        attentionMatrix: attention,
      }}
      visualization={
        <div className="w-full h-full flex flex-col items-center justify-center p-3 bg-[#090d16]">
          {/* Interactive Token Selector Bar */}
          <div className="flex items-center gap-1.5 flex-wrap justify-center mb-3">
            <span className="text-[11px] font-bold text-slate-400 mr-1 uppercase">Active Token:</span>
            {tokens.map((tok, i) => (
              <button
                key={i}
                onClick={() => setSelectedTokenIdx(i)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  selectedTokenIdx === i
                    ? "bg-[var(--accent)] text-white shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                    : "border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--card-hover)]"
                }`}
              >
                {tok}
              </button>
            ))}
          </div>

          <canvas ref={canvasRef} className="w-full max-w-md aspect-square" />
        </div>
      }
      controls={
        <>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              Input Sentence Corpus
            </label>
            <select
              value={sentenceIdx}
              onChange={(e) => {
                setSentenceIdx(Number(e.target.value));
                setSelectedTokenIdx(0);
              }}
              className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm font-medium"
            >
              {SENTENCES.map((s, idx) => (
                <option key={idx} value={idx}>
                  &quot;{s.slice(0, 5).join(" ")}...&quot;
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              Visualization Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setViewMode("heatmap")}
                className={`py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  viewMode === "heatmap"
                    ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                    : "border-[var(--border)] text-[var(--muted-foreground)]"
                }`}
              >
                Softmax Heatmap
              </button>
              <button
                onClick={() => setViewMode("arcs")}
                className={`py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                  viewMode === "arcs"
                    ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                    : "border-[var(--border)] text-[var(--muted-foreground)]"
                }`}
              >
                Bipartite Arcs
              </button>
            </div>
          </div>

          <Slider
            label="Attention Head #"
            value={selectedHead}
            min={1}
            max={8}
            step={1}
            onChange={setSelectedHead}
            tooltip="Individual representation subspace in multi-head attention"
          />
          <Slider
            label="Softmax Temperature (τ)"
            value={temperature}
            min={0.2}
            max={3.0}
            step={0.1}
            onChange={setTemperature}
            tooltip="Lower temperature makes attention sharper (argmax-like), higher makes it uniform"
            formatValue={(v) => v.toFixed(1)}
          />
        </>
      }
      metrics={[
        { label: "Active Token", value: tokens[selectedTokenIdx], highlight: true },
        { label: "Peak Attention", value: formatNumber(maxAttnVal, 3), highlight: true },
        { label: "Active Head", value: `Head ${selectedHead} / 8` },
        { label: "Temperature (τ)", value: formatNumber(temperature, 1) },
      ]}
      explanations={[
        {
          title: "Scaled Dot-Product Attention Formula",
          content:
            "Attention scores measure how much focus a token query Q should allocate to all context keys K in the sequence, scaled by the square root of key dimension to prevent vanishing softmax gradients.",
          latex: "\\text{Attention}(Q, K, V) = \\text{softmax}\\left( \\frac{Q K^T}{\\sqrt{d_k}} \\right) V",
        },
        {
          title: "Multi-Head Attention (MHA)",
          content:
            "Allows the model to jointly attend to information from different representation subspaces at different positions.",
          latex: "\\text{MHA}(Q, K, V) = \\text{Concat}(\\text{head}_1, \\dots, \\text{head}_h) W^O",
        },
      ]}
    />
  );
}
