export type MathFunction =
  | "x2"
  | "sin"
  | "cos"
  | "exp"
  | "log"
  | "linear"
  | "custom";

export interface FunctionParams {
  a: number;
  b: number;
  c: number;
  d: number;
}

export function evaluateFunction(
  x: number,
  fn: MathFunction,
  params: FunctionParams,
  customExpr?: string
): number {
  const { a, b, c, d } = params;
  switch (fn) {
    case "x2":
      return a * x * x + b * x + c;
    case "sin":
      return a * Math.sin(b * x + c) + d;
    case "cos":
      return a * Math.cos(b * x + c) + d;
    case "exp":
      return a * Math.exp(b * x) + c;
    case "log":
      return x > 0 ? a * Math.log(x) + b : NaN;
    case "linear":
      return a * x + b;
    case "custom":
      return evaluateCustom(x, customExpr ?? "x");
    default:
      return x * x;
  }
}

export function evaluateDerivative(
  x: number,
  fn: MathFunction,
  params: FunctionParams
): number {
  const { a, b, c } = params;
  switch (fn) {
    case "x2":
      return 2 * a * x + b;
    case "sin":
      return a * b * Math.cos(b * x + c);
    case "cos":
      return -a * b * Math.sin(b * x + c);
    case "exp":
      return a * b * Math.exp(b * x);
    case "log":
      return x > 0 ? a / x : NaN;
    case "linear":
      return a;
    default:
      return 2 * x;
  }
}

function evaluateCustom(x: number, expr: string): number {
  try {
    const sanitized = expr
      .replace(/\^/g, "**")
      .replace(/(\d)x/g, "$1*x")
      .replace(/x(\d)/g, "x*$1")
      .replace(/x/g, `(${x})`)
      .replace(/sin/g, "Math.sin")
      .replace(/cos/g, "Math.cos")
      .replace(/tan/g, "Math.tan")
      .replace(/exp/g, "Math.exp")
      .replace(/log/g, "Math.log")
      .replace(/sqrt/g, "Math.sqrt")
      .replace(/pi/gi, String(Math.PI))
      .replace(/e(?![xp])/gi, String(Math.E));
    // eslint-disable-next-line no-new-func
    const result = new Function(`return ${sanitized}`)();
    return typeof result === "number" && isFinite(result) ? result : NaN;
  } catch {
    return NaN;
  }
}

export function sampleFunction(
  fn: MathFunction,
  params: FunctionParams,
  xMin: number,
  xMax: number,
  steps: number,
  customExpr?: string
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  const step = (xMax - xMin) / steps;
  for (let i = 0; i <= steps; i++) {
    const x = xMin + i * step;
    const y = evaluateFunction(x, fn, params, customExpr);
    if (!isNaN(y) && isFinite(y)) {
      points.push({ x, y });
    }
  }
  return points;
}

export const FUNCTION_PRESETS: { id: MathFunction; label: string; latex: string }[] = [
  { id: "x2", label: "Quadratic", latex: "y = ax^2 + bx + c" },
  { id: "sin", label: "Sine", latex: "y = a\\sin(bx + c) + d" },
  { id: "cos", label: "Cosine", latex: "y = a\\cos(bx + c) + d" },
  { id: "exp", label: "Exponential", latex: "y = ae^{bx} + c" },
  { id: "log", label: "Logarithm", latex: "y = a\\ln(x) + b" },
  { id: "linear", label: "Linear", latex: "y = ax + b" },
];
