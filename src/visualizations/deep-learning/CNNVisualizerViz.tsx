"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { LabLayout } from "@/components/visualization/LabLayout";
import { Slider } from "@/components/controls/Slider";
import { formatNumber } from "@/lib/utils";

export type FilterPreset = "edge" | "sobelH" | "sobelV" | "sharpen" | "blur" | "ridge";

const FILTER_PRESETS: { label: string; value: FilterPreset; kernel: number[][] }[] = [
  {
    label: "Edge Detection",
    value: "edge",
    kernel: [
      [-1, -1, -1],
      [-1, 8, -1],
      [-1, -1, -1],
    ],
  },
  {
    label: "Sobel Horizontal",
    value: "sobelH",
    kernel: [
      [-1, -2, -1],
      [0, 0, 0],
      [1, 2, 1],
    ],
  },
  {
    label: "Sobel Vertical",
    value: "sobelV",
    kernel: [
      [-1, 0, 1],
      [-2, 0, 2],
      [-1, 0, 1],
    ],
  },
  {
    label: "Sharpen",
    value: "sharpen",
    kernel: [
      [0, -1, 0],
      [-1, 5, -1],
      [0, -1, 0],
    ],
  },
  {
    label: "Gaussian Blur",
    value: "blur",
    kernel: [
      [0.0625, 0.125, 0.0625],
      [0.125, 0.25, 0.125],
      [0.0625, 0.125, 0.0625],
    ],
  },
];

const PSEUDOCODE = [
  "1. Slide kernel K over input matrix at current stride offset (i, j)",
  "2. Compute element-wise product: S(i, j) = Σ Σ Image(i+m, j+n) * Kernel(m, n)",
  "3. Apply non-linear ReLU activation: FeatureMap(i, j) = max(0, S(i, j) + bias)",
  "4. Advance receptive field window: j ← j + stride (wrap to next row if j ≥ W)",
  "5. Downsample feature maps via 2x2 Max Pooling: Pooled(p, q) = max(FeatureMap[2p:2p+2, 2q:2q+2])",
];

function generateBaseImage(size: number): number[][] {
  const img: number[][] = [];
  for (let i = 0; i < size; i++) {
    const row: number[] = [];
    for (let j = 0; j < size; j++) {
      const cx = size / 2;
      const cy = size / 2;
      const dist = Math.hypot(i - cx + 0.5, j - cy + 0.5);
      // Geometric cross/circle test pattern
      if (dist < 1.8) row.push(1.0);
      else if (dist < 3.2) row.push(0.65);
      else if (i === 1 || j === 1 || i === size - 2 || j === size - 2) row.push(0.85);
      else row.push(0.1);
    }
    img.push(row);
  }
  return img;
}

export default function CNNVisualizerViz() {
  const [filterType, setFilterType] = useState<FilterPreset>("edge");
  const [stride, setStride] = useState(1);
  const [poolSize, setPoolSize] = useState(2);
  const [posI, setPosI] = useState(0);
  const [posJ, setPosJ] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [activeCodeLine, setActiveCodeLine] = useState(1);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animTimerRef = useRef<NodeJS.Timeout | null>(null);

  const imageSize = 8;
  const activeKernel =
    FILTER_PRESETS.find((f) => f.value === filterType)?.kernel || FILTER_PRESETS[0].kernel;
  const kSize = activeKernel.length;

  const image = generateBaseImage(imageSize);
  const outSize = Math.floor((imageSize - kSize) / stride) + 1;
  const totalSteps = outSize * outSize;
  const currentStep = posI * outSize + posJ;

  // Compute full Feature Map with ReLU
  const featureMap: number[][] = Array.from({ length: outSize }, (_, i) =>
    Array.from({ length: outSize }, (_, j) => {
      let sum = 0;
      for (let ki = 0; ki < kSize; ki++) {
        for (let kj = 0; kj < kSize; kj++) {
          const ii = i * stride + ki;
          const jj = j * stride + kj;
          if (ii < imageSize && jj < imageSize) {
            sum += image[ii][jj] * activeKernel[ki][kj];
          }
        }
      }
      return Math.max(0, sum);
    })
  );

  // Compute Max Pooling
  const pooledSize = Math.floor(outSize / poolSize);
  const pooled: number[][] = Array.from({ length: Math.max(1, pooledSize) }, (_, pi) =>
    Array.from({ length: Math.max(1, pooledSize) }, (_, pj) => {
      let maxVal = -Infinity;
      for (let di = 0; di < poolSize; di++) {
        for (let dj = 0; dj < poolSize; dj++) {
          const fi = pi * poolSize + di;
          const fj = pj * poolSize + dj;
          if (fi < outSize && fj < outSize) {
            maxVal = Math.max(maxVal, featureMap[fi][fj]);
          }
        }
      }
      return Math.max(0, maxVal === -Infinity ? 0 : maxVal);
    })
  );

  // Advance 1 Convolution Step
  const step = useCallback(() => {
    setPosJ((prevJ) => {
      if (prevJ + 1 < outSize) {
        setActiveCodeLine(1);
        return prevJ + 1;
      } else {
        setPosI((prevI) => {
          if (prevI + 1 < outSize) {
            setActiveCodeLine(1);
            return prevI + 1;
          } else {
            // Reached end of feature map
            setIsRunning(false);
            setActiveCodeLine(4);
            return prevI;
          }
        });
        return 0;
      }
    });
  }, [outSize]);

  // Step Backward
  const stepBackward = useCallback(() => {
    setPosJ((prevJ) => {
      if (prevJ > 0) {
        return prevJ - 1;
      } else {
        setPosI((prevI) => Math.max(0, prevI - 1));
        return outSize - 1;
      }
    });
  }, [outSize]);

  // Auto-play loop
  useEffect(() => {
    if (isRunning && !isPaused && currentStep < totalSteps - 1) {
      const delay = Math.max(50, 450 / speed);
      animTimerRef.current = setTimeout(() => {
        step();
      }, delay);
    }
    return () => {
      if (animTimerRef.current) clearTimeout(animTimerRef.current);
    };
  }, [isRunning, isPaused, currentStep, totalSteps, speed, step]);

  const handlePlay = () => {
    if (currentStep >= totalSteps - 1) {
      setPosI(0);
      setPosJ(0);
    }
    setIsRunning(true);
    setIsPaused(false);
  };

  const handlePause = () => {
    setIsPaused(true);
    setIsRunning(false);
  };

  const handleFastForward = () => {
    setIsRunning(false);
    setIsPaused(false);
    setPosI(outSize - 1);
    setPosJ(outSize - 1);
    setActiveCodeLine(4);
  };

  // Draw 4-stage Pipeline on Canvas
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

    const sections = 3;
    const sectionW = w / sections;
    const maxGridSize = 8;
    const cellSize = Math.min((sectionW - 30) / maxGridSize, (h - 70) / maxGridSize);

    // Draw Grid Matrix Helper
    const drawMatrix = (
      data: number[][],
      secIdx: number,
      title: string,
      highlight?: { r: number; c: number; sizeR: number; sizeC: number; color: string }
    ) => {
      const rows = data.length;
      const cols = data[0].length;
      const startX = secIdx * sectionW + (sectionW - cols * cellSize) / 2;
      const startY = 55;

      ctx.fillStyle = "rgba(148, 163, 184, 0.9)";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(title, secIdx * sectionW + sectionW / 2, 30);

      // Matrix background border
      ctx.strokeStyle = "rgba(148, 163, 184, 0.2)";
      ctx.lineWidth = 1;
      ctx.strokeRect(startX - 2, startY - 2, cols * cellSize + 4, rows * cellSize + 4);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const val = Math.min(1, Math.max(0, data[r][c]));
          const x = startX + c * cellSize;
          const y = startY + r * cellSize;

          const isHl =
            highlight &&
            r >= highlight.r &&
            r < highlight.r + highlight.sizeR &&
            c >= highlight.c &&
            c < highlight.c + highlight.sizeC;

          ctx.fillStyle = isHl
            ? highlight.color
            : `rgba(99, 102, 241, ${0.1 + val * 0.85})`;
          ctx.fillRect(x + 1, y + 1, cellSize - 2, cellSize - 2);

          // Value text
          ctx.fillStyle = isHl ? "#ffffff" : val > 0.4 ? "#ffffff" : "rgba(255,255,255,0.7)";
          ctx.font = "9px monospace";
          ctx.fillText(val.toFixed(1), x + cellSize / 2, y + cellSize / 2 + 3);
        }
      }
    };

    // Stage 1: Input Image with highlighted Receptive Field
    drawMatrix(image, 0, "1. Input Receptive Field", {
      r: posI * stride,
      c: posJ * stride,
      sizeR: kSize,
      sizeC: kSize,
      color: "rgba(245, 158, 11, 0.85)", // Amber highlight
    });

    // Stage 2: Feature Map with active output pixel
    drawMatrix(featureMap, 1, "2. Conv + ReLU Map", {
      r: posI,
      c: posJ,
      sizeR: 1,
      sizeC: 1,
      color: "rgba(236, 72, 153, 0.9)", // Pink highlight
    });

    // Stage 3: Max Pooled Map
    const poolR = Math.floor(posI / poolSize);
    const poolC = Math.floor(posJ / poolSize);
    drawMatrix(pooled, 2, "3. Max Pooling (2x2)", {
      r: poolR,
      c: poolC,
      sizeR: 1,
      sizeC: 1,
      color: "rgba(16, 185, 129, 0.9)", // Emerald highlight
    });

    // Inter-stage flow arrows
    ctx.fillStyle = "rgba(148, 163, 184, 0.5)";
    ctx.font = "bold 18px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("➔", sectionW, h / 2 + 10);
    ctx.fillText("➔", sectionW * 2, h / 2 + 10);
  }, [image, featureMap, pooled, posI, posJ, stride, kSize, poolSize]);

  useEffect(() => {
    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [draw]);

  const activeOutputVal = featureMap[posI]?.[posJ] ?? 0;

  return (
    <LabLayout
      algorithmId="cnn-visualizer"
      title="Convolutional Neural Network (CNN) Visualizer"
      subtitle="Step through sliding kernel convolution, ReLU activation, and max pooling operations."
      currentStep={currentStep + 1}
      maxSteps={totalSteps}
      isRunning={isRunning}
      isPaused={isPaused}
      isConverged={currentStep >= totalSteps - 1}
      statusMessage={`Sliding Window at Row ${posI + 1}, Col ${posJ + 1} · Active Conv Output = ${activeOutputVal.toFixed(2)}`}
      stepPhase={`Kernel at (${posI}, ${posJ}) · Filter: ${filterType.toUpperCase()}`}
      playbackSpeed={speed}
      onStep={step}
      onStepBackward={stepBackward}
      onRun={handlePlay}
      onPause={handlePause}
      onFastForward={handleFastForward}
      onReset={() => {
        setPosI(0);
        setPosJ(0);
      }}
      onSpeedChange={setSpeed}
      pseudocode={PSEUDOCODE}
      activePseudocodeLine={activeCodeLine}
      canvasRef={canvasRef}
      datasetToExport={{
        filterType,
        kernel: activeKernel,
        stride,
        posI,
        posJ,
        featureMap,
        pooled,
      }}
      visualization={
        <div className="relative w-full h-full bg-[#090d16] flex items-center justify-center p-3">
          <canvas ref={canvasRef} className="w-full h-full" aria-label="CNN pipeline visualization" />
          <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-[11px] text-slate-300 pointer-events-none border border-white/10">
            Amber = Receptive Field · Pink = Conv Output · Green = Pooled Window
          </div>
        </div>
      }
      controls={
        <>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              Convolution Kernel Filter
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as FilterPreset)}
              className="w-full px-3 py-2 rounded-xl border border-[var(--border)] bg-[var(--background)] text-sm font-medium"
            >
              {FILTER_PRESETS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          <Slider
            label="Kernel Stride (s)"
            value={stride}
            min={1}
            max={2}
            step={1}
            onChange={setStride}
            tooltip="Number of pixels the kernel shifts per sliding step"
          />
          <Slider
            label="Pooling Factor"
            value={poolSize}
            min={2}
            max={3}
            step={1}
            onChange={setPoolSize}
            tooltip="Spatial window size for max downsampling"
          />
        </>
      }
      metrics={[
        { label: "Active Conv Output", value: formatNumber(activeOutputVal, 3), highlight: true },
        { label: "Kernel Position", value: `(${posI}, ${posJ})`, highlight: true },
        { label: "Feature Map Dim", value: `${outSize} × ${outSize}` },
        { label: "Pooled Dim", value: `${pooledSize} × ${pooledSize}` },
      ]}
      explanations={[
        {
          title: "2D Discrete Cross-Correlation (Convolution)",
          content:
            "A learnable weight kernel slides spatially over the input tensor, performing element-wise multiplications and summations to extract localized features like edges, corners, and textures.",
          latex: "S(i, j) = (I * K)(i, j) = \\sum_{m} \\sum_{n} I(i+m, j+n) K(m, n)",
        },
        {
          title: "Rectified Linear Unit (ReLU) & Max Pooling",
          content:
            "ReLU introduces non-linearity by zeroing out negative responses. Max pooling reduces spatial dimensionality while preserving translation invariance.",
          latex: "\\text{ReLU}(z) = \\max(0, z), \\quad \\text{Pool}(p, q) = \\max_{(i, j) \\in W_{p, q}} X(i, j)",
        },
      ]}
    />
  );
}
