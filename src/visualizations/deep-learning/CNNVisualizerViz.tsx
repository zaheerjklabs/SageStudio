"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { LabLayout } from "@/components/visualization/LabLayout";
import { Slider } from "@/components/controls/Slider";

function generateImage(size: number): number[][] {
  const img: number[][] = [];
  for (let i = 0; i < size; i++) {
    const row: number[] = [];
    for (let j = 0; j < size; j++) {
      const cx = size / 2;
      const cy = size / 2;
      const dist = Math.sqrt((i - cx) ** 2 + (j - cy) ** 2);
      row.push(dist < size / 3 ? 1 : dist < size / 2 ? 0.5 : 0.1);
    }
    img.push(row);
  }
  return img;
}

function convolve(
  image: number[][],
  kernel: number[][],
  stride: number,
  posI: number,
  posJ: number
): number {
  const kSize = kernel.length;
  const half = Math.floor(kSize / 2);
  let sum = 0;
  for (let ki = 0; ki < kSize; ki++) {
    for (let kj = 0; kj < kSize; kj++) {
      const ii = posI * stride + ki - half;
      const jj = posJ * stride + kj - half;
      if (ii >= 0 && ii < image.length && jj >= 0 && jj < image[0].length) {
        sum += image[ii][jj] * kernel[ki][kj];
      }
    }
  }
  return Math.max(0, sum);
}

function maxPool(
  featureMap: number[][],
  poolSize: number,
  posI: number,
  posJ: number
): number {
  let max = -Infinity;
  for (let pi = 0; pi < poolSize; pi++) {
    for (let pj = 0; pj < poolSize; pj++) {
      const ii = posI * poolSize + pi;
      const jj = posJ * poolSize + pj;
      if (ii < featureMap.length && jj < featureMap[0].length) {
        max = Math.max(max, featureMap[ii][jj]);
      }
    }
  }
  return max;
}

export default function CNNVisualizerViz() {
  const [kernelSize, setKernelSize] = useState(3);
  const [stride, setStride] = useState(1);
  const [poolSize, setPoolSize] = useState(2);
  const [kernelVal, setKernelVal] = useState(1);
  const [posI, setPosI] = useState(0);
  const [posJ, setPosJ] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const imageSize = 8;

  const kernel = Array.from({ length: kernelSize }, () =>
    Array.from({ length: kernelSize }, () => kernelVal / (kernelSize * kernelSize))
  );
  const image = generateImage(imageSize);

  const outputSize = Math.floor((imageSize - kernelSize) / stride) + 1;
  const featureMap: number[][] = Array.from({ length: outputSize }, (_, i) =>
    Array.from({ length: outputSize }, (_, j) => convolve(image, kernel, stride, i, j))
  );
  const pooledSize = Math.floor(outputSize / poolSize);
  const pooled: number[][] = Array.from({ length: pooledSize }, (_, i) =>
    Array.from({ length: pooledSize }, (_, j) => maxPool(featureMap, poolSize, i, j))
  );

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

    const sections = 4;
    const sectionW = w / sections;
    const cellSize = Math.min(sectionW / (imageSize + 2), h / (imageSize + 4));

    const drawGrid = (
      data: number[][],
      offsetX: number,
      title: string,
      highlightI?: number,
      highlightJ?: number,
      highlightSize?: number
    ) => {
      const size = data.length;
      const startX = offsetX + (sectionW - size * cellSize) / 2;
      const startY = 40;

      ctx.fillStyle = "var(--muted-foreground)";
      ctx.font = "11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(title, offsetX + sectionW / 2, 20);

      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          const val = data[i][j];
          const x = startX + j * cellSize;
          const y = startY + i * cellSize;

          const isHighlight =
            highlightI !== undefined &&
            highlightJ !== undefined &&
            highlightSize !== undefined &&
            i >= highlightI &&
            i < highlightI + highlightSize &&
            j >= highlightJ &&
            j < highlightJ + highlightSize;

          ctx.fillStyle = isHighlight
            ? `rgba(245, 158, 11, 0.8)`
            : `rgba(99, 102, 241, ${val * 0.8 + 0.1})`;
          ctx.fillRect(x, y, cellSize - 1, cellSize - 1);
        }
      }
    };

    drawGrid(image, 0, "Input Image", posI, posJ, kernelSize);
    drawGrid(featureMap, sectionW, "Conv + ReLU");
    drawGrid(pooled, sectionW * 2, "Max Pool");
    drawGrid(pooled, sectionW * 3, "Output");

    // Arrow labels
    ctx.fillStyle = "var(--muted)";
    ctx.font = "16px sans-serif";
    for (let i = 0; i < 3; i++) {
      ctx.fillText("→", sectionW * (i + 1) - 8, h / 2);
    }
  }, [posI, posJ, kernelSize, stride, poolSize, kernelVal]);

  useEffect(() => {
    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [draw]);

  const animate = useCallback(() => {
    setIsAnimating(true);
    let i = 0;
    let j = 0;
    const maxPos = outputSize - 1;

    const step = () => {
      setPosI(i);
      setPosJ(j);
      j++;
      if (j > maxPos) {
        j = 0;
        i++;
      }
      if (i <= maxPos) {
        animRef.current = requestAnimationFrame(step);
      } else {
        setIsAnimating(false);
        setPosI(0);
        setPosJ(0);
      }
    };
    animRef.current = requestAnimationFrame(step);
  }, [outputSize]);

  useEffect(() => () => cancelAnimationFrame(animRef.current), []);

  return (
    <LabLayout
      algorithmId="cnn-visualizer"
      title="CNN Visualizer"
      subtitle="See convolution, pooling, and feature maps."
      onRun={animate}
      isTraining={isAnimating}
      visualization={
        <canvas ref={canvasRef} className="w-full h-full" aria-label="CNN pipeline visualization" />
      }
      controls={
        <>
          <Slider label="Kernel Size" value={kernelSize} min={2} max={5} step={1} onChange={setKernelSize} />
          <Slider label="Stride" value={stride} min={1} max={3} step={1} onChange={setStride} />
          <Slider label="Pooling Size" value={poolSize} min={2} max={3} step={1} onChange={setPoolSize} />
          <Slider label="Kernel Value" value={kernelVal} min={-2} max={2} step={0.1} onChange={setKernelVal} />
          <Slider label="Position Row" value={posI} min={0} max={Math.max(0, outputSize - 1)} step={1} onChange={setPosI} />
          <Slider label="Position Col" value={posJ} min={0} max={Math.max(0, outputSize - 1)} step={1} onChange={setPosJ} />
        </>
      }
      metrics={[
        { label: "Input Size", value: `${imageSize}×${imageSize}` },
        { label: "Feature Map", value: `${outputSize}×${outputSize}` },
        { label: "Pooled", value: `${pooledSize}×${pooledSize}` },
        { label: "Kernel", value: `${kernelSize}×${kernelSize}` },
      ]}
      explanations={[
        {
          title: "What is happening?",
          content: "The convolution kernel slides over the input image. Each position computes a weighted sum (highlighted in orange), passed through ReLU. Max pooling reduces spatial dimensions.",
        },
        {
          title: "Mathematics",
          content: "Convolution applies a learnable filter across the input.",
          latex: "(I * K)[i,j] = \\sum_m \\sum_n I[i+m, j+n] \\cdot K[m,n]",
        },
      ]}
    />
  );
}
