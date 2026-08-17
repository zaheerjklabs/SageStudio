export function createCoordSystem(
  width: number,
  height: number,
  padding: number,
  xRange: [number, number],
  yRange: [number, number]
) {
  const plotW = Math.max(1, width - padding * 2);
  const plotH = Math.max(1, height - padding * 2);
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
  gridColor = "rgba(128,128,128,0.12)"
) {
  const { toCanvas } = createCoordSystem(width, height, padding, xRange, yRange);
  const [xMin, xMax] = xRange;
  const [yMin, yMax] = yRange;

  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 0.75;

  const xStep = niceStep(xMax - xMin);
  const yStep = niceStep(yMax - yMin);

  for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax; x += xStep) {
    const { cx } = toCanvas(x, 0);
    ctx.beginPath();
    ctx.moveTo(cx, padding);
    ctx.lineTo(cx, height - padding);
    ctx.stroke();

    // Axis tick label
    ctx.fillStyle = "rgba(128,128,128,0.5)";
    ctx.font = "9px monospace";
    ctx.textAlign = "center";
    ctx.fillText(x.toFixed(xStep < 1 ? 1 : 0), cx, height - padding + 14);
  }

  for (let y = Math.ceil(yMin / yStep) * yStep; y <= yMax; y += yStep) {
    const { cy } = toCanvas(0, y);
    ctx.beginPath();
    ctx.moveTo(padding, cy);
    ctx.lineTo(width - padding, cy);
    ctx.stroke();

    // Axis tick label
    ctx.fillStyle = "rgba(128,128,128,0.5)";
    ctx.font = "9px monospace";
    ctx.textAlign = "right";
    ctx.fillText(y.toFixed(yStep < 1 ? 1 : 0), padding - 6, cy + 3);
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

  ctx.strokeStyle = "rgba(128,128,128,0.5)";
  ctx.lineWidth = 1.25;

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

export function drawVectorArrow(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  color: string = "#6366f1",
  lineWidth: number = 2,
  headSize: number = 8
) {
  const angle = Math.atan2(toY - fromY, toX - fromX);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;

  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(
    toX - headSize * Math.cos(angle - Math.PI / 6),
    toY - headSize * Math.sin(angle - Math.PI / 6)
  );
  ctx.lineTo(
    toX - headSize * Math.cos(angle + Math.PI / 6),
    toY - headSize * Math.sin(angle + Math.PI / 6)
  );
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawGlowCircle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  fillColor: string,
  glowColor: string = fillColor,
  strokeColor: string = "#ffffff"
) {
  ctx.save();
  ctx.shadowColor = glowColor;
  ctx.shadowBlur = 10;

  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = fillColor;
  ctx.fill();

  if (strokeColor) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
  ctx.restore();
}

function niceStep(range: number): number {
  const rough = range / 7;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const residual = rough / mag;
  if (residual > 5) return 10 * mag;
  if (residual > 2) return 5 * mag;
  if (residual > 1) return 2 * mag;
  return mag;
}

export const CLUSTER_COLORS = [
  "#6366f1", // Indigo
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#8b5cf6", // Purple
  "#06b6d4", // Cyan
  "#ec4899", // Pink
  "#84cc16", // Lime
];

export function clearCanvas(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.clearRect(0, 0, width, height);
}
