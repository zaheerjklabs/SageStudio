"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { LabLayout } from "@/components/visualization/LabLayout";
import { Slider } from "@/components/controls/Slider";
import { DecisionTreeEngine, type TreeNode } from "@/algorithms/classification/decision-tree";
import { formatNumber } from "@/lib/utils";

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
  const nodeW = Math.max(80, width);
  const nodeH = 50;
  const vGap = 80;

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
            strokeWidth={1.5}
          />
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
            strokeWidth={1.5}
          />
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
        className="cursor-pointer"
        role="button"
        tabIndex={0}
        aria-label={node.isLeaf ? `Leaf: Class ${node.value}` : `Split: ${node.feature} < ${node.threshold}`}
      >
        <rect
          x={x - nodeW / 2}
          y={y - nodeH / 2}
          width={nodeW}
          height={nodeH}
          rx={8}
          fill={isSelected ? "var(--accent-muted)" : "var(--card)"}
          stroke={isSelected ? "var(--accent)" : "var(--border)"}
          strokeWidth={isSelected ? 2 : 1}
        />
        <text
          x={x}
          y={y - 5}
          textAnchor="middle"
          fill="var(--foreground)"
          fontSize={11}
          fontWeight={600}
        >
          {node.isLeaf ? `Class ${node.value}` : `${node.feature} < ${node.threshold?.toFixed(0)}`}
        </text>
        <text
          x={x}
          y={y + 12}
          textAnchor="middle"
          fill="var(--muted-foreground)"
          fontSize={9}
        >
          {node.isLeaf
            ? `${node.samples} samples`
            : `Gini: ${node.gini.toFixed(3)}`}
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

  const engineRef = useRef(new DecisionTreeEngine());

  const rebuild = useCallback(() => {
    engineRef.current.generateData(dataSize);
    const t = engineRef.current.build(maxDepth, minSamples, criterion);
    setTree(t);
    setSelectedNode(null);
  }, [maxDepth, minSamples, criterion, dataSize]);

  useEffect(() => { rebuild(); }, [rebuild]);

  return (
    <LabLayout
      algorithmId="decision-tree"
      title="Decision Tree"
      subtitle="Build and explore decision trees visually."
      onReset={rebuild}
      onRandomize={rebuild}
      visualization={
        <div className="w-full h-full overflow-auto flex items-start justify-center p-4">
          {tree && (
            <svg width="100%" height="400" viewBox="0 0 600 400" className="min-w-[500px]">
              <TreeNodeViz
                node={tree}
                x={300}
                y={40}
                width={500}
                depth={0}
                maxDepth={maxDepth}
                selectedId={selectedNode?.id ?? null}
                onSelect={setSelectedNode}
              />
            </svg>
          )}
        </div>
      }
      controls={
        <>
          <Slider label="Max Depth" value={maxDepth} min={1} max={5} step={1} onChange={setMaxDepth} tooltip="Maximum tree depth" />
          <Slider label="Min Samples" value={minSamples} min={2} max={20} step={1} onChange={setMinSamples} tooltip="Minimum samples to split" />
          <Slider label="Dataset Size" value={dataSize} min={20} max={200} step={10} onChange={setDataSize} />
          <div className="space-y-2">
            <label className="text-sm font-medium">Criterion</label>
            <select
              value={criterion}
              onChange={(e) => setCriterion(e.target.value as "gini" | "entropy")}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--background)] text-sm"
            >
              <option value="gini">Gini Impurity</option>
              <option value="entropy">Entropy</option>
            </select>
          </div>
        </>
      }
      metrics={[
        { label: "Max Depth", value: maxDepth },
        { label: "Criterion", value: criterion },
        { label: "Samples", value: dataSize },
        {
          label: "Selected Gini",
          value: selectedNode ? formatNumber(selectedNode.gini) : "—",
          highlight: !!selectedNode,
        },
      ]}
      explanations={[
        {
          title: "What is happening?",
          content: "The tree recursively splits data on features (age, income) to minimize impurity. Click any node to see its statistics.",
        },
        {
          title: "Mathematics",
          content: criterion === "gini"
            ? "Gini impurity measures the probability of misclassification."
            : "Entropy measures the information content (uncertainty) of a split.",
          latex: criterion === "gini"
            ? "Gini = 1 - \\sum_{i=1}^{C} p_i^2"
            : "H = -\\sum_{i=1}^{C} p_i \\log_2(p_i)",
        },
      ]}
    />
  );
}
