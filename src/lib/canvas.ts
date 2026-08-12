export function createCoordSystem(
  width: number,
  height: number,
  padding: number,
  xRange: [number, number],
  yRange: [number, number]
) {
  const plotW = width - padding * 2;
  const plotH = height - padding * 2;
  const [xMin, xMax] = xRange;
  const [yMin, yMax] = yRange;

  const toCanvas = (x: number, y: number) => ({
    cx: padding + ((x - xMin) / (xMax - xMin)) * plotW,
    cy: height - padding - ((y - yMin) / (yMax - yMin)) * plotH,
  });

  const fromCanvas = (cx: number, cy: number) => ({
    x: xMin + ((cx - padding) / plotW) * (xMax - xMin),
    y: yMin + ((height - padding - cy) / plotH) * (yMax - yMin),
  });

  return { toCanvas, fromCanvas, plotW, plotH, padding };
}

export function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  padding: number,
  xRange: [number, number],
  yRange: [number, number],
  gridColor = "rgba(128,128,128,0.1)"
) {
  const { toCanvas } = createCoordSystem(width, height, padding, xRange, yRange);
  const [xMin, xMax] = xRange;
  const [yMin, yMax] = yRange;

  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 0.5;

  const xStep = niceStep(xMax - xMin);
  const yStep = niceStep(yMax - yMin);

  for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax; x += xStep) {
    const { cx } = toCanvas(x, 0);
    ctx.beginPath();
    ctx.moveTo(cx, padding);
    ctx.lineTo(cx, height - padding);
    ctx.stroke();
  }

  for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax; y += yStep) {
    const { cy } = toCanvas(0, y);
    ctx.beginPath();
    ctx.moveTo(padding, cy);
    ctx.lineTo(width - padding, cy);
    ctx.stroke();
  }
}

export function drawAxes(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  padding: number,
  xRange: [number, number],
  yRange: [number, number]
) {
  const { toCanvas } = createCoordSystem(width, height, padding, xRange, yRange);

  ctx.strokeStyle = "rgba(128,128,128,0.4)";
  ctx.lineWidth = 1;

  if (xRange[0] <= 0 && xRange[1] >= 0) {
    const { cy } = toCanvas(0, 0);
    ctx.beginPath();
    ctx.moveTo(padding, cy);
    ctx.lineTo(width - padding, cy);
    ctx.stroke();
  }

  if (yRange[0] <= 0 && yRange[1] >= 0) {
    const { cx } = toCanvas(0, 0);
    ctx.beginPath();
    ctx.moveTo(cx, padding);
    ctx.lineTo(cx, height - padding);
    ctx.stroke();
  }
}

function niceStep(range: number): number {
  const rough = range / 8;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const residual = rough / mag;
  if (residual > 5) return 10 * mag;
  if (residual > 2) return 5 * mag;
  if (residual > 1) return 2 * mag;
  return mag;
}

export const CLUSTER_COLORS = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
];

export function clearCanvas(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.clearRect(0, 0, width, height);
}
