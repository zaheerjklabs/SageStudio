"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { LabLayout } from "@/components/visualization/LabLayout";
import { Slider } from "@/components/controls/Slider";
import { formatNumber } from "@/lib/utils";

const PSEUDOCODE = [
  "1. Forget Gate: f_t = σ(W_f · [h_{t-1}, x_t] + b_f)  →  Discards irrelevant past memory",
  "2. Input Gate: i_t = σ(W_i · [h_{t-1}, x_t] + b_i)  →  Decides which new values to write",
  "3. Candidate Cell: C̃_t = tanh(W_c · [h_{t-1}, x_t] + b_c)  →  Creates new memory candidates",
  "4. Cell State Update: C_t = f_t ⊙ C_{t-1} + i_t ⊙ C̃_t  →  Blends long-term memory",
  "5. Output Gate: o_t = σ(W_o · [h_{t-1}, x_t] + b_o)  →  Filters output information",
  "6. Hidden State: h_t = o_t ⊙ tanh(C_t)  →  Emits current time-step recurrence",
];

export default function LSTMVisualizerViz() {
  const [forgetGate, setForgetGate] = useState(0.75);
  const [inputGate, setInputGate] = useState(0.85);
  const [candidate, setCandidate] = useState(0.6);
  const [outputGate, setOutputGate] = useState(0.7);
  const [prevCell, setPrevCell] = useState(1.1);
  const [prevHidden, setPrevHidden] = useState(0.4);

  const [currentStep, setCurrentStep] = useState(4);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [activeCodeLine, setActiveCodeLine] = useState(4);

  const svgRef = useRef<SVGSVGElement>(null);
  const animTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Mathematical outputs
  const newCell = forgetGate * prevCell + inputGate * candidate;
  const newHidden = outputGate * Math.tanh(newCell);

  const step = () => {
    setCurrentStep((s) => {
      const next = (s + 1) % 5;
      setActiveCodeLine(next === 0 ? 0 : next === 1 ? 1 : next === 2 ? 3 : next === 3 ? 4 : 5);
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

  // Auto-play loop
  useEffect(() => {
    if (isRunning && !isPaused) {
      const delay = Math.max(100, 700 / speed);
      animTimerRef.current = setTimeout(() => {
        step();
      }, delay);
    }
    return () => {
      if (animTimerRef.current) clearTimeout(animTimerRef.current);
    };
  }, [isRunning, isPaused, currentStep, speed]);

  const handlePlay = () => {
    setIsRunning(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    setIsPaused(true);
    setIsRunning(false);
  };

  return (
    <LabLayout
      algorithmId="lstm-visualizer"
      title="Long Short-Term Memory (LSTM) Cell"
      subtitle="Step through memory gating mechanisms: Forget, Input, Candidate, Cell State, and Output gates."
      currentStep={currentStep + 1}
      maxSteps={5}
      isConverged={currentStep === 4}
      statusMessage={`Cell State C_t = ${formatNumber(newCell, 4)} · Hidden State h_t = ${formatNumber(newHidden, 4)}`}
      stepPhase={`Stage ${currentStep + 1}/5: ${
        currentStep === 0
          ? "Forget Gate Filtering"
          : currentStep === 1
          ? "Input Gate & Candidate Memory"
          : currentStep === 2
          ? "Cell State Highway Update"
          : currentStep === 3
          ? "Output Gate Activation"
          : "Hidden State Projection"
      }`}
      playbackSpeed={speed}
      onStep={step}
      onStepBackward={stepBackward}
      onRun={handlePlay}
      onPause={handlePause}
      onReset={() => setCurrentStep(0)}
      onSpeedChange={setSpeed}
      pseudocode={PSEUDOCODE}
      activePseudocodeLine={activeCodeLine}
      svgRef={svgRef}
      datasetToExport={{
        forgetGate,
        inputGate,
        candidate,
        outputGate,
        prevCell,
        prevHidden,
        newCell,
        newHidden,
      }}
      visualization={
        <div className="w-full h-full flex items-center justify-center p-4 bg-[#090d16]">
          <svg
            ref={svgRef}
            viewBox="0 0 700 380"
            className="w-full max-w-2xl filter drop-shadow-xl"
          >
            {/* Long-term Cell State Highway (Top Line) */}
            <line
              x1="50"
              y1="75"
              x2="650"
              y2="75"
              stroke={currentStep >= 2 ? "#6366f1" : "rgba(99, 102, 241, 0.4)"}
              strokeWidth="4"
            />
            <text x="350" y="55" textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="600">
              Cell State Highway (Cₜ)
            </text>
            <text
              x="350"
              y="95"
              textAnchor="middle"
              fill="#6366f1"
              fontSize="14"
              fontWeight="bold"
            >
              Cₜ = {formatNumber(newCell, 3)}
            </text>

            {/* Forget Gate */}
            <rect
              x="110"
              y="130"
              width="105"
              height="55"
              rx="10"
              fill="rgba(15, 23, 42, 0.95)"
              stroke="#ef4444"
              strokeWidth={currentStep === 0 ? 3 : 1.5}
              className={currentStep === 0 ? "filter drop-shadow-[0_0_8px_rgba(239,68,68,0.7)]" : ""}
            />
            <text x="162" y="152" textAnchor="middle" fill="#f8fafc" fontSize="11" fontWeight="600">
              Forget Gate
            </text>
            <text x="162" y="172" textAnchor="middle" fill="#ef4444" fontSize="13" fontWeight="bold">
              fₜ = {formatNumber(forgetGate, 2)}
            </text>
            <line
              x1="162"
              y1="130"
              x2="162"
              y2="75"
              stroke="#ef4444"
              strokeWidth="2"
              strokeDasharray="4"
            />
            <circle cx="162" cy="75" r="8" fill="#ef4444" />
            <text x="162" y="79" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">
              ×
            </text>

            {/* Input Gate */}
            <rect
              x="270"
              y="130"
              width="105"
              height="55"
              rx="10"
              fill="rgba(15, 23, 42, 0.95)"
              stroke="#10b981"
              strokeWidth={currentStep === 1 ? 3 : 1.5}
              className={currentStep === 1 ? "filter drop-shadow-[0_0_8px_rgba(16,185,129,0.7)]" : ""}
            />
            <text x="322" y="152" textAnchor="middle" fill="#f8fafc" fontSize="11" fontWeight="600">
              Input Gate
            </text>
            <text x="322" y="172" textAnchor="middle" fill="#10b981" fontSize="13" fontWeight="bold">
              iₜ = {formatNumber(inputGate, 2)}
            </text>

            {/* Candidate Memory */}
            <rect
              x="270"
              y="225"
              width="105"
              height="55"
              rx="10"
              fill="rgba(15, 23, 42, 0.95)"
              stroke="#8b5cf6"
              strokeWidth={currentStep === 1 ? 3 : 1.5}
              className={currentStep === 1 ? "filter drop-shadow-[0_0_8px_rgba(139,92,246,0.7)]" : ""}
            />
            <text x="322" y="247" textAnchor="middle" fill="#f8fafc" fontSize="11" fontWeight="600">
              Candidate
            </text>
            <text x="322" y="267" textAnchor="middle" fill="#8b5cf6" fontSize="13" fontWeight="bold">
              C̃ₜ = {formatNumber(candidate, 2)}
            </text>

            {/* Input + Candidate Interaction */}
            <line x1="322" y1="225" x2="322" y2="185" stroke="#8b5cf6" strokeWidth="2" />
            <circle cx="322" cy="75" r="8" fill="#10b981" />
            <text x="322" y="79" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="bold">
              +
            </text>

            {/* Output Gate */}
            <rect
              x="475"
              y="130"
              width="105"
              height="55"
              rx="10"
              fill="rgba(15, 23, 42, 0.95)"
              stroke="#f59e0b"
              strokeWidth={currentStep === 3 ? 3 : 1.5}
              className={currentStep === 3 ? "filter drop-shadow-[0_0_8px_rgba(245,158,11,0.7)]" : ""}
            />
            <text x="527" y="152" textAnchor="middle" fill="#f8fafc" fontSize="11" fontWeight="600">
              Output Gate
            </text>
            <text x="527" y="172" textAnchor="middle" fill="#f59e0b" fontSize="13" fontWeight="bold">
              oₜ = {formatNumber(outputGate, 2)}
            </text>

            {/* Hidden State Output Box */}
            <rect
              x="475"
              y="295"
              width="105"
              height="55"
              rx="10"
              fill="rgba(15, 23, 42, 0.95)"
              stroke="#06b6d4"
              strokeWidth={currentStep === 4 ? 3 : 1.5}
              className={currentStep === 4 ? "filter drop-shadow-[0_0_8px_rgba(6,182,212,0.7)]" : ""}
            />
            <text x="527" y="317" textAnchor="middle" fill="#f8fafc" fontSize="11" fontWeight="600">
              Hidden State
            </text>
            <text x="527" y="337" textAnchor="middle" fill="#06b6d4" fontSize="13" fontWeight="bold">
              hₜ = {formatNumber(newHidden, 3)}
            </text>

            {/* tanh on cell state line to output */}
            <line x1="527" y1="185" x2="527" y2="295" stroke="#06b6d4" strokeWidth="2.5" />
            <rect
              x="440"
              y="60"
              width="50"
              height="28"
              rx="6"
              fill="#0f172a"
              stroke="#64748b"
              strokeWidth="1.5"
            />
            <text x="465" y="78" textAnchor="middle" fill="#cbd5e1" fontSize="10" fontWeight="bold">
              tanh
            </text>
            <line x1="465" y1="88" x2="527" y2="130" stroke="#64748b" strokeWidth="1.5" />

            {/* Inputs from previous step */}
            <text x="30" y="80" fill="#94a3b8" fontSize="10">
              Cₜ₋₁ = {formatNumber(prevCell, 1)}
            </text>
            <text x="30" y="325" fill="#94a3b8" fontSize="10">
              hₜ₋₁ = {formatNumber(prevHidden, 1)}
            </text>
            <line
              x1="75"
              y1="320"
              x2="475"
              y2="320"
              stroke="rgba(148, 163, 184, 0.3)"
              strokeWidth="1.5"
              strokeDasharray="4"
            />
          </svg>
        </div>
      }
      controls={
        <>
          <Slider
            label="Forget Gate Value (fₜ)"
            value={forgetGate}
            min={0}
            max={1}
            step={0.01}
            onChange={setForgetGate}
            tooltip="Fraction of previous long-term cell state preserved"
          />
          <Slider
            label="Input Gate Value (iₜ)"
            value={inputGate}
            min={0}
            max={1}
            step={0.01}
            onChange={setInputGate}
            tooltip="Fraction of new candidate information admitted into cell state"
          />
          <Slider
            label="Candidate Memory (C̃ₜ)"
            value={candidate}
            min={-1}
            max={1}
            step={0.01}
            onChange={setCandidate}
            tooltip="Newly generated candidate values created via tanh"
          />
          <Slider
            label="Output Gate Value (oₜ)"
            value={outputGate}
            min={0}
            max={1}
            step={0.01}
            onChange={setOutputGate}
            tooltip="Filtering coefficient for exposing cell state to next hidden layer"
          />
          <Slider
            label="Previous Cell State (Cₜ₋₁)"
            value={prevCell}
            min={0}
            max={2}
            step={0.05}
            onChange={setPrevCell}
          />
        </>
      }
      metrics={[
        { label: "Updated Cell State Cₜ", value: formatNumber(newCell, 4), highlight: true },
        { label: "Updated Hidden State hₜ", value: formatNumber(newHidden, 4), highlight: true },
        { label: "Forget Fraction", value: `${(forgetGate * 100).toFixed(0)}%` },
        { label: "Input Fraction", value: `${(inputGate * 100).toFixed(0)}%` },
      ]}
      explanations={[
        {
          title: "Constant Error Carousel & Gated Highway",
          content:
            "LSTMs mitigate vanishing gradients in vanilla RNNs by maintaining an additive linear cell state highway C_t that gradients can flow through across long temporal sequences without exponential decay.",
        },
        {
          title: "Mathematical Gate Equations",
          content:
            "Sigmoid activation σ compresses outputs to [0, 1] acting as soft computational switches. Tanh maps activations to [-1, 1] for stable centered memory updates.",
          latex:
            "f_t = \\sigma(W_f x_t + U_f h_{t-1} + b_f), \\quad C_t = f_t \\odot C_{t-1} + i_t \\odot \\tilde{C}_t, \\quad h_t = o_t \\odot \\tanh(C_t)",
        },
      ]}
    />
  );
}
