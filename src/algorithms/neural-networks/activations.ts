export type ActivationType =
  | "relu"
  | "sigmoid"
  | "tanh"
  | "leaky_relu"
  | "elu"
  | "gelu"
  | "softmax"
  | "linear";

export function activate(x: number, type: ActivationType, alpha = 0.01): number {
  switch (type) {
    case "relu":
      return Math.max(0, x);
    case "sigmoid":
      return 1 / (1 + Math.exp(-x));
    case "tanh":
      return Math.tanh(x);
    case "leaky_relu":
      return x > 0 ? x : alpha * x;
    case "elu":
      return x > 0 ? x : alpha * (Math.exp(x) - 1);
    case "gelu":
      return 0.5 * x * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x ** 3)));
    case "linear":
      return x;
    default:
      return x;
  }
}

export function activateDerivative(x: number, type: ActivationType, alpha = 0.01): number {
  switch (type) {
    case "relu":
      return x > 0 ? 1 : 0;
    case "sigmoid": {
      const s = 1 / (1 + Math.exp(-x));
      return s * (1 - s);
    }
    case "tanh": {
      const t = Math.tanh(x);
      return 1 - t * t;
    }
    case "leaky_relu":
      return x > 0 ? 1 : alpha;
    case "elu":
      return x > 0 ? 1 : alpha * Math.exp(x);
    case "gelu": {
      const cdf = 0.5 * (1 + Math.tanh(Math.sqrt(2 / Math.PI) * (x + 0.044715 * x ** 3)));
      const pdf = Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
      return cdf + x * pdf;
    }
    case "linear":
      return 1;
    default:
      return 1;
  }
}

export function softmax(arr: number[]): number[] {
  const max = Math.max(...arr);
  const exps = arr.map((v) => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

export const ACTIVATION_INFO: Record<
  ActivationType,
  { name: string; formula: string; derivative: string; range: string; properties: string }
> = {
  relu: {
    name: "ReLU",
    formula: "f(x) = \\max(0, x)",
    derivative: "f'(x) = \\begin{cases} 1 & x > 0 \\\\ 0 & x \\leq 0 \\end{cases}",
    range: "[0, ∞)",
    properties: "Most popular activation. Fast, avoids vanishing gradient for positive values.",
  },
  sigmoid: {
    name: "Sigmoid",
    formula: "f(x) = \\frac{1}{1 + e^{-x}}",
    derivative: "f'(x) = f(x)(1 - f(x))",
    range: "(0, 1)",
    properties: "Outputs probabilities. Suffers from vanishing gradients.",
  },
  tanh: {
    name: "Tanh",
    formula: "f(x) = \\tanh(x)",
    derivative: "f'(x) = 1 - \\tanh^2(x)",
    range: "(-1, 1)",
    properties: "Zero-centered. Better than sigmoid for hidden layers.",
  },
  leaky_relu: {
    name: "Leaky ReLU",
    formula: "f(x) = \\begin{cases} x & x > 0 \\\\ \\alpha x & x \\leq 0 \\end{cases}",
    derivative: "f'(x) = \\begin{cases} 1 & x > 0 \\\\ \\alpha & x \\leq 0 \\end{cases}",
    range: "(-∞, ∞)",
    properties: "Allows small negative gradients. α typically 0.01.",
  },
  elu: {
    name: "ELU",
    formula: "f(x) = \\begin{cases} x & x > 0 \\\\ \\alpha(e^x - 1) & x \\leq 0 \\end{cases}",
    derivative: "f'(x) = \\begin{cases} 1 & x > 0 \\\\ \\alpha e^x & x \\leq 0 \\end{cases}",
    range: "(-α, ∞)",
    properties: "Smoother than ReLU for negative inputs.",
  },
  gelu: {
    name: "GELU",
    formula: "f(x) = x \\cdot \\Phi(x)",
    derivative: "Used in transformers (BERT, GPT).",
    range: "(-∞, ∞)",
    properties: "Gaussian Error Linear Unit. State-of-the-art in transformers.",
  },
  softmax: {
    name: "Softmax",
    formula: "f(x_i) = \\frac{e^{x_i}}{\\sum_j e^{x_j}}",
    derivative: "Jacobian matrix of softmax.",
    range: "(0, 1), sums to 1",
    properties: "Multi-class output layer. Converts logits to probabilities.",
  },
  linear: {
    name: "Linear",
    formula: "f(x) = x",
    derivative: "f'(x) = 1",
    range: "(-∞, ∞)",
    properties: "Identity function. Used in regression output layers.",
  },
};

export function sampleActivation(
  type: ActivationType,
  xMin: number,
  xMax: number,
  steps: number,
  alpha = 0.01
): { x: number; y: number; dy: number }[] {
  const points: { x: number; y: number; dy: number }[] = [];
  const step = (xMax - xMin) / steps;
  for (let i = 0; i <= steps; i++) {
    const x = xMin + i * step;
    points.push({
      x,
      y: activate(x, type, alpha),
      dy: activateDerivative(x, type, alpha),
    });
  }
  return points;
}
