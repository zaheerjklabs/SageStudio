"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { LabLayout } from "@/components/visualization/LabLayout";
import { Slider } from "@/components/controls/Slider";
import { DecisionTreeEngine, type TreeNode } from "@/algorithms/classification/decision-tree";
import { formatNumber } from "@/lib/utils";

const PSEUDOCODE = [
  "1. Start with entire dataset at root node",
  "2. For each candidate feature X_j and split threshold θ: compute impurity (Gini / Entropy)",
  "3. Calculate Information Gain: IG = Impurity(Parent) - Σ (N_child / N_parent) * Impurity(Child)",
  "4. Choose feature and threshold with maximal Information Gain",
  "5. Partition dataset into Left (X_j < θ) and Right (X_j ≥ θ) subsets",
  "6. Recursively repeat until max depth reached or node becomes pure (Impurity = 0)",
];

function TreeNodeViz({
  node,
  x,
  y,
  width,
  depth,
  maxDepth,
  selectedId,
  onSelect,
}: {
  node: TreeNode;
  x: number;
  y: number;
  width: number;
  depth: number;
  maxDepth: number;
  selectedId: string | null;
  onSelect: (node: TreeNode) => void;
}) {
  const isSelected = selectedId === node.id;
  const nodeW = Math.max(90, width * 0.75);
  const nodeH = 54;
  const vGap = 75;

  return (
    <g>
      {node.left && (
        <>
          <line
            x1={x}
            y1={y + nodeH / 2}
            x2={x - width / 4}
            y2={y + vGap - nodeH / 2}
            stroke="var(--border)"
            strokeWidth={1.75}
          />
          <text
            x={(x + (x - width / 4)) / 2 - 8}
            y={y + vGap / 2}
            fill="var(--muted-foreground)"
            fontSize={9}
            textAnchor="middle"
          >
            True
          </text>
          <TreeNodeViz
            node={node.left}
            x={x - width / 4}
            y={y + vGap}
            width={width / 2}
            depth={depth + 1}
            maxDepth={maxDepth}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        </>
      )}
      {node.right && (
        <>
          <line
            x1={x}
            y1={y + nodeH / 2}
            x2={x + width / 4}
            y2={y + vGap - nodeH / 2}
            stroke="var(--border)"
            strokeWidth={1.75}
          />
          <text
            x={(x + (x + width / 4)) / 2 + 8}
            y={y + vGap / 2}
            fill="var(--muted-foreground)"
            fontSize={9}
            textAnchor="middle"
          >
            False
          </text>
          <TreeNodeViz
            node={node.right}
            x={x + width / 4}
            y={y + vGap}
            width={width / 2}
            depth={depth + 1}
            maxDepth={maxDepth}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        </>
      )}
      <g
        onClick={() => onSelect(node)}
        className="cursor-pointer transition-transform hover:scale-105"
        role="button"
        tabIndex={0}
        aria-label={node.isLeaf ? `Leaf: Class ${node.value}` : `Split: ${node.feature} < ${node.threshold}`}
      >
        <rect
          x={x - nodeW / 2}
          y={y - nodeH / 2}
          width={nodeW}
          height={nodeH}
          rx={10}
          fill={
            isSelected
              ? "rgba(99, 102, 241, 0.25)"
              : node.isLeaf
              ? node.value === 1
                ? "rgba(16, 185, 129, 0.18)"
                : "rgba(239, 68, 68, 0.18)"
              : "var(--card)"
          }
          stroke={
            isSelected
              ? "var(--accent)"
              : node.isLeaf
              ? node.value === 1
                ? "#10b981"
                : "#ef4444"
              : "var(--border)"
          }
          strokeWidth={isSelected ? 2.5 : 1.25}
        />
        <text
          x={x}
          y={y - 6}
          textAnchor="middle"
          fill="var(--foreground)"
          fontSize={11}
          fontWeight={600}
        >
          {node.isLeaf ? `🎯 Class ${node.value}` : `${node.feature} < ${node.threshold?.toFixed(1)}`}
        </text>
        <text
          x={x}
          y={y + 11}
          textAnchor="middle"
          fill="var(--muted-foreground)"
          fontSize={9.5}
        >
          {node.isLeaf
            ? `${node.samples} samples`
            : `Gini: ${node.gini.toFixed(3)} · N=${node.samples}`}
        </text>
      </g>
    </g>
  );
}

export default function DecisionTreeViz() {
  const [maxDepth, setMaxDepth] = useState(3);
  const [minSamples, setMinSamples] = useState(5);
  const [criterion, setCriterion] = useState<"gini" | "entropy">("gini");
  const [dataSize, setDataSize] = useState(100);
  const [selectedNode, setSelectedNode] = useState<TreeNode | null>(null);
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [currentStep, setCurrentStep] = useState(3);
  const [activeCodeLine, setActiveCodeLine] = useState(3);

  const svgRef = useRef<SVGSVGElement>(null);
  const engineRef = useRef(new DecisionTreeEngine());

  const rebuild = useCallback(() => {
    engineRef.current.generateData(dataSize);
    const t = engineRef.current.build(currentStep, minSamples, criterion);
    setTree(t);
    setSelectedNode(null);
  }, [currentStep, minSamples, criterion, dataSize]);

  useEffect(() => {
    rebuild();
  }, [rebuild]);

  const step = () => {
    if (currentStep < 5) {
      const next = currentStep + 1;
      setCurrentStep(next);
      setMaxDepth(next);
      setActiveCodeLine(4);
    }
  };

  const stepBackward = () => {
    if (currentStep > 1) {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      setMaxDepth(prev);
      setActiveCodeLine(2);
    }
  };

  return (
    <LabLayout
      algorithmId="decision-tree"
      title="Decision Tree Classifier"
      subtitle="Construct recursive binary partitioning trees and visualize impurity splits step-by-step."
      currentStep={currentStep}
      maxSteps={5}
      isConverged={currentStep >= 5}
      statusMessage={`Tree Depth = ${currentStep} · Splitting Criterion = ${criterion.toUpperCase()}`}
      stepPhase={`Depth Level ${currentStep} Partitioning`}
      onStep={step}
      onStepBackward={stepBackward}
      onReset={() => {
        setCurrentStep(1);
        setMaxDepth(1);
      }}
      onRandomize={rebuild}
      pseudocode={PSEUDOCODE}
      activePseudocodeLine={activeCodeLine}
      svgRef={svgRef}
      datasetToExport={{
        maxDepth: currentStep,
        minSamples,
        criterion,
        tree,
      }}
      visualization={
        <div className="w-full h-full overflow-auto flex items-center justify-center p-4 bg-[var(--background)]">
          {tree && (
            <svg
              ref={svgRef}
              width="100%"
              height="380"
              viewBox="0 0 600 380"
              className="min-w-[500px]"
            >
              <TreeNodeViz
                node={tree}
                x={300}
                y={40}
                width={520}
                depth={0}
                maxDepth={currentStep}
                selectedId={selectedNode?.id ?? null}
                onSelect={setSelectedNode}
              />
            </svg>
          )}
        </div>
      }
      controls={
        <>
          <Slider
            label="Maximum Tree Depth"
            value={currentStep}
            min={1}
            max={5}
            step={1}
            onChange={(v) => {
              setCurrentStep(v);
              setMaxDepth(v);
            }}
            tooltip="Maximum levels of recursive binary splitting allowed"
          />
          <Slider
            label="Minimum Samples per Split"
            value={minSamples}
            min={2}
            max={20}
            step={1}
            onChange={setMinSamples}
            tooltip="Minimum number of data points required to justify a child split"
          />
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              Impurity Metric
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setCriterion("gini")}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  criterion === "gini"
                    ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                    : "border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--card-hover)]"
                }`}
              >
                Gini Impurity
              </button>
              <button
                onClick={() => setCriterion("entropy")}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all ${
                  criterion === "entropy"
                    ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                    : "border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--card-hover)]"
                }`}
              >
                Shannon Entropy
              </button>
            </div>
          </div>
          <Slider
            label="Dataset Size"
            value={dataSize}
            min={30}
            max={200}
            step={10}
            onChange={setDataSize}
          />
        </>
      }
      metrics={[
        { label: "Active Depth", value: `Depth ${currentStep}`, highlight: true },
        { label: "Impurity Metric", value: criterion === "gini" ? "Gini Index" : "Entropy", highlight: true },
        { label: "Min Split Samples", value: minSamples },
        {
          label: "Selected Node",
          value: selectedNode ? (selectedNode.isLeaf ? `Leaf (C${selectedNode.value})` : selectedNode.feature ?? "Split Node") : "Root Node",
        },
      ]}
      explanations={[
        {
          title: "Recursive Binary Splitting (CART Algorithm)",
          content:
            "At each node, the decision tree searches exhaustively over all feature thresholds to find the partition that maximizes purity.",
        },
        {
          title: "Gini Impurity & Shannon Entropy",
          content:
            "Measures the probability of misclassifying a randomly chosen element from the set if it were randomly labeled according to the class distribution.",
          latex:
            "\\text{Gini}(p) = 1 - \\sum_{k=1}^C p_k^2, \\quad \\text{Entropy}(p) = -\\sum_{k=1}^C p_k \\log_2(p_k)",
        },
        {
          title: "Information Gain",
          content:
            "The expected reduction in impurity achieved by partitioning data on attribute A.",
          latex: "\\text{Gain}(S, A) = \\text{Impurity}(S) - \\sum_{v \\in \\text{Values}(A)} \\frac{|S_v|}{|S|} \\text{Impurity}(S_v)",
        },
      ]}
    />
  );
}
