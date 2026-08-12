export interface TreeNode {
  id: string;
  feature?: string;
  threshold?: number;
  left?: TreeNode;
  right?: TreeNode;
  value?: number;
  samples: number;
  gini: number;
  entropy: number;
  isLeaf: boolean;
}

export interface TreeSample {
  age: number;
  income: number;
  label: number;
}

function giniImpurity(labels: number[]): number {
  if (labels.length === 0) return 0;
  const counts: Record<number, number> = {};
  for (const l of labels) counts[l] = (counts[l] || 0) + 1;
  let impurity = 1;
  for (const c of Object.values(counts)) {
    const p = c / labels.length;
    impurity -= p * p;
  }
  return impurity;
}

function entropy(labels: number[]): number {
  if (labels.length === 0) return 0;
  const counts: Record<number, number> = {};
  for (const l of labels) counts[l] = (counts[l] || 0) + 1;
  let ent = 0;
  for (const c of Object.values(counts)) {
    const p = c / labels.length;
    if (p > 0) ent -= p * Math.log2(p);
  }
  return ent;
}

function generateSampleData(n: number, seed = 42): TreeSample[] {
  const data: TreeSample[] = [];
  let s = seed;
  const rand = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  for (let i = 0; i < n; i++) {
    const age = Math.floor(rand() * 60) + 20;
    const income = Math.floor(rand() * 100) + 20;
    const label = age < 35 && income < 50 ? 0 : age >= 35 || income >= 70 ? 1 : rand() > 0.5 ? 1 : 0;
    data.push({ age, income, label });
  }
  return data;
}

let nodeId = 0;

function buildTree(
  data: TreeSample[],
  features: string[],
  depth: number,
  maxDepth: number,
  minSamples: number,
  criterion: "gini" | "entropy"
): TreeNode {
  const id = `node-${nodeId++}`;
  const labels = data.map((d) => d.label);
  const impurityFn = criterion === "gini" ? giniImpurity : entropy;
  const currentImpurity = impurityFn(labels);

  const majority = labels.filter((l) => l === 1).length >= labels.length / 2 ? 1 : 0;

  if (depth >= maxDepth || data.length < minSamples || currentImpurity === 0) {
    return {
      id,
      value: majority,
      samples: data.length,
      gini: giniImpurity(labels),
      entropy: entropy(labels),
      isLeaf: true,
    };
  }

  let bestFeature = features[0];
  let bestThreshold = 0;
  let bestGain = -1;

  for (const feature of features) {
    const values = data.map((d) => d[feature as keyof TreeSample] as number);
    const unique = [...new Set(values)].sort((a, b) => a - b);

    for (let i = 0; i < unique.length - 1; i++) {
      const threshold = (unique[i] + unique[i + 1]) / 2;
      const left = data.filter((d) => (d[feature as keyof TreeSample] as number) < threshold);
      const right = data.filter((d) => (d[feature as keyof TreeSample] as number) >= threshold);

      if (left.length === 0 || right.length === 0) continue;

      const gain =
        currentImpurity -
        (left.length / data.length) * impurityFn(left.map((d) => d.label)) -
        (right.length / data.length) * impurityFn(right.map((d) => d.label));

      if (gain > bestGain) {
        bestGain = gain;
        bestFeature = feature;
        bestThreshold = threshold;
      }
    }
  }

  if (bestGain <= 0) {
    return {
      id,
      value: majority,
      samples: data.length,
      gini: giniImpurity(labels),
      entropy: entropy(labels),
      isLeaf: true,
    };
  }

  const leftData = data.filter(
    (d) => (d[bestFeature as keyof TreeSample] as number) < bestThreshold
  );
  const rightData = data.filter(
    (d) => (d[bestFeature as keyof TreeSample] as number) >= bestThreshold
  );

  return {
    id,
    feature: bestFeature,
    threshold: bestThreshold,
    samples: data.length,
    gini: giniImpurity(labels),
    entropy: entropy(labels),
    isLeaf: false,
    left: buildTree(leftData, features, depth + 1, maxDepth, minSamples, criterion),
    right: buildTree(rightData, features, depth + 1, maxDepth, minSamples, criterion),
  };
}

export class DecisionTreeEngine {
  tree: TreeNode | null = null;
  data: TreeSample[] = [];

  generateData(n: number, seed = 42): TreeSample[] {
    this.data = generateSampleData(n, seed);
    return this.data;
  }

  build(maxDepth: number, minSamples: number, criterion: "gini" | "entropy"): TreeNode {
    nodeId = 0;
    this.tree = buildTree(this.data, ["age", "income"], 0, maxDepth, minSamples, criterion);
    return this.tree;
  }

  predict(sample: TreeSample): number {
    if (!this.tree) return 0;
    let node: TreeNode | undefined = this.tree;
    while (node && !node.isLeaf) {
      const val = sample[node.feature as keyof TreeSample] as number;
      node = val < (node.threshold ?? 0) ? node.left : node.right;
    }
    return node?.value ?? 0;
  }
}

export function flattenTree(node: TreeNode): TreeNode[] {
  const nodes: TreeNode[] = [node];
  if (node.left) nodes.push(...flattenTree(node.left));
  if (node.right) nodes.push(...flattenTree(node.right));
  return nodes;
}
