"use client";

import { useState } from "react";
import { LabLayout } from "@/components/visualization/LabLayout";
import { Slider } from "@/components/controls/Slider";
import { formatNumber } from "@/lib/utils";

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

export default function LSTMVisualizerViz() {
  const [forgetGate, setForgetGate] = useState(0.7);
  const [inputGate, setInputGate] = useState(0.8);
  const [outputGate, setOutputGate] = useState(0.6);
  const [candidate, setCandidate] = useState(0.5);
  const [prevCell, setPrevCell] = useState(1.0);
  const [prevHidden, setPrevHidden] = useState(0.3);

  const newCell = forgetGate * prevCell + inputGate * candidate;
  const newHidden = outputGate * Math.tanh(newCell);

  return (
    <LabLayout
      algorithmId="lstm-visualizer"
      title="LSTM Cell"
      subtitle="Explore gates, cell state, and hidden state."
      visualization={
        <div className="w-full h-full flex items-center justify-center p-4">
          <svg viewBox="0 0 700 400" className="w-full max-w-3xl">
            {/* Cell state line */}
            <line x1="50" y1="80" x2="650" y2="80" stroke="var(--accent)" strokeWidth="3" />
            <text x="350" y="65" textAnchor="middle" fill="var(--muted-foreground)" fontSize="12">Cell State (c)</text>
            <text x="350" y="100" textAnchor="middle" fill="var(--accent)" fontSize="14" fontWeight="bold">
              cₜ = {formatNumber(newCell, 3)}
            </text>

            {/* Forget gate */}
            <rect x="120" y="130" width="100" height="50" rx="8" fill="var(--card)" stroke="#ef4444" strokeWidth="2" />
            <text x="170" y="150" textAnchor="middle" fill="var(--foreground)" fontSize="11" fontWeight="600">Forget Gate</text>
            <text x="170" y="168" textAnchor="middle" fill="#ef4444" fontSize="13" fontWeight="bold">fₜ = {formatNumber(forgetGate, 2)}</text>
            <line x1="170" y1="130" x2="170" y2="80" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4" />
            <text x="200" y="125" fill="var(--muted-foreground)" fontSize="10">×</text>

            {/* Input gate */}
            <rect x="280" y="130" width="100" height="50" rx="8" fill="var(--card)" stroke="#10b981" strokeWidth="2" />
            <text x="330" y="150" textAnchor="middle" fill="var(--foreground)" fontSize="11" fontWeight="600">Input Gate</text>
            <text x="330" y="168" textAnchor="middle" fill="#10b981" fontSize="13" fontWeight="bold">iₜ = {formatNumber(inputGate, 2)}</text>

            {/* Candidate */}
            <rect x="280" y="220" width="100" height="50" rx="8" fill="var(--card)" stroke="#6366f1" strokeWidth="2" />
            <text x="330" y="240" textAnchor="middle" fill="var(--foreground)" fontSize="11" fontWeight="600">Candidate</text>
            <text x="330" y="258" textAnchor="middle" fill="#6366f1" fontSize="13" fontWeight="bold">c̃ₜ = {formatNumber(candidate, 2)}</text>
            <line x1="330" y1="220" x2="330" y2="180" stroke="#6366f1" strokeWidth="1.5" />
            <text x="350" y="200" fill="var(--muted-foreground)" fontSize="10">×</text>

            {/* Output gate */}
            <rect x="480" y="130" width="100" height="50" rx="8" fill="var(--card)" stroke="#f59e0b" strokeWidth="2" />
            <text x="530" y="150" textAnchor="middle" fill="var(--foreground)" fontSize="11" fontWeight="600">Output Gate</text>
            <text x="530" y="168" textAnchor="middle" fill="#f59e0b" fontSize="13" fontWeight="bold">oₜ = {formatNumber(outputGate, 2)}</text>

            {/* Hidden state */}
            <line x1="530" y1="180" x2="530" y2="300" stroke="var(--sage)" strokeWidth="2" />
            <rect x="480" y="300" width="100" height="50" rx="8" fill="var(--sage-muted)" stroke="var(--sage)" strokeWidth="2" />
            <text x="530" y="320" textAnchor="middle" fill="var(--foreground)" fontSize="11" fontWeight="600">Hidden State</text>
            <text x="530" y="338" textAnchor="middle" fill="var(--sage)" fontSize="13" fontWeight="bold">hₜ = {formatNumber(newHidden, 3)}</text>

            {/* tanh on cell state */}
            <rect x="430" y="60" width="60" height="30" rx="6" fill="var(--card)" stroke="var(--border)" />
            <text x="460" y="80" textAnchor="middle" fill="var(--muted-foreground)" fontSize="11">tanh</text>
            <line x1="460" y1="90" x2="530" y2="130" stroke="var(--border)" strokeWidth="1.5" />

            {/* Previous states */}
            <text x="30" y="85" fill="var(--muted-foreground)" fontSize="11">cₜ₋₁={formatNumber(prevCell, 1)}</text>
            <text x="30" y="330" fill="var(--muted-foreground)" fontSize="11">hₜ₋₁={formatNumber(prevHidden, 1)}</text>
            <line x1="80" y1="325" x2="480" y2="325" stroke="var(--border)" strokeWidth="1" strokeDasharray="4" />
          </svg>
        </div>
      }
      controls={
        <>
          <Slider label="Forget Gate (fₜ)" value={forgetGate} min={0} max={1} step={0.01} onChange={setForgetGate} tooltip="Controls what to forget from cell state" />
          <Slider label="Input Gate (iₜ)" value={inputGate} min={0} max={1} step={0.01} onChange={setInputGate} tooltip="Controls what new info to store" />
          <Slider label="Output Gate (oₜ)" value={outputGate} min={0} max={1} step={0.01} onChange={setOutputGate} tooltip="Controls what to output" />
          <Slider label="Candidate (c̃ₜ)" value={candidate} min={-1} max={1} step={0.01} onChange={setCandidate} tooltip="New candidate values" />
          <Slider label="Previous Cell (cₜ₋₁)" value={prevCell} min={0} max={2} step={0.01} onChange={setPrevCell} />
          <Slider label="Previous Hidden (hₜ₋₁)" value={prevHidden} min={-1} max={1} step={0.01} onChange={setPrevHidden} />
        </>
      }
      metrics={[
        { label: "Cell State", value: formatNumber(newCell, 3), highlight: true },
        { label: "Hidden State", value: formatNumber(newHidden, 3), highlight: true },
        { label: "Forget", value: formatNumber(forgetGate, 2) },
        { label: "Input", value: formatNumber(inputGate, 2) },
      ]}
      explanations={[
        {
          title: "What is happening?",
          content: "The LSTM cell uses gates to control information flow. The forget gate decides what to discard, the input gate decides what to store, and the output gate decides what to reveal.",
        },
        {
          title: "Mathematics",
          content: "Each gate is computed using sigmoid activation, producing values between 0 and 1.",
          latex: "f_t = \\sigma(W_f \\cdot [h_{t-1}, x_t] + b_f)",
        },
        {
          title: "Cell State Update",
          content: "The cell state is updated by combining forgotten previous state with new candidate information.",
          latex: "c_t = f_t \\odot c_{t-1} + i_t \\odot \\tilde{c}_t",
        },
      ]}
    />
  );
}
