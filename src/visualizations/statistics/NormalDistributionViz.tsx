"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { LabLayout } from "@/components/visualization/LabLayout";
import { Slider } from "@/components/controls/Slider";
import { NormalDistribution } from "@/algorithms/statistics/normal-distribution";
import { formatNumber } from "@/lib/utils";
import {
  drawGrid,
  drawAxes,
  createCoordSystem,
  clearCanvas,
} from "@/lib/canvas";

export default function NormalDistributionViz() {
  const [mean, setMean] = useState(0);
  const [stdDev, setStdDev] = useState(1);
  const [showSamples, setShowSamples] = useState(false);
  const [numSamples, setNumSamples] = useState(1000);
  const [samples, setSamples] = useState<number[]>([]);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const distributionRef = useRef(new NormalDistribution(mean, stdDev));

  useEffect(() => {
    distributionRef.current = new NormalDistribution(mean, stdDev);
    if (showSamples) {
      setSamples(distributionRef.current.generateSamples(numSamples));
    }
  }, [mean, stdDev, showSamples, numSamples]);

  const generateNewSamples = useCallback(() => {
    setSamples(distributionRef.current.generateSamples(numSamples));
  }, [numSamples]);

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
    const padding = 50;
    const xRange: [number, number] = [mean - 4 * stdDev, mean + 4 * stdDev];
    const maxPdf = distributionRef.current.pdf(mean);
    const yRange: [number, number] = [0, maxPdf * 1.2];
    const { toCanvas } = createCoordSystem(w, h, padding, xRange, yRange);

    clearCanvas(ctx, w, h);
    drawGrid(ctx, w, h, padding, xRange, yRange);
    drawAxes(ctx, w, h, padding, xRange, yRange);

    const dist = distributionRef.current;

    // Draw bell curve
    ctx.beginPath();
    for (let x = xRange[0]; x <= xRange[1]; x += (xRange[1] - xRange[0]) / 200) {
      const y = dist.pdf(x);
      const { cx, cy } = toCanvas(x, y);
      if (x === xRange[0]) {
        ctx.moveTo(cx, cy);
      } else {
        ctx.lineTo(cx, cy);
      }
    }
    ctx.strokeStyle = "#6366f1";
    ctx.lineWidth = 3;
    ctx.stroke();

    // Fill under curve
    ctx.lineTo(toCanvas(xRange[1], 0).cx, toCanvas(xRange[1], 0).cy);
    ctx.lineTo(toCanvas(xRange[0], 0).cx, toCanvas(xRange[0], 0).cy);
    ctx.closePath();
    ctx.fillStyle = "rgba(99, 102, 241, 0.1)";
    ctx.fill();

    // Draw mean line
    const meanStart = toCanvas(mean, 0);
    const meanEnd = toCanvas(mean, dist.pdf(mean));
    ctx.beginPath();
    ctx.moveTo(meanStart.cx, meanStart.cy);
    ctx.lineTo(meanEnd.cx, meanEnd.cy);
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 2.5;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw standard deviation markers
    [-2, -1, 1, 2].forEach((sigma) => {
      const x = mean + sigma * stdDev;
      const y = dist.pdf(x);
      const pos = toCanvas(x, y);
      ctx.beginPath();
      ctx.arc(pos.cx, pos.cy, 4, 0, Math.PI * 2);
      ctx.fillStyle = sigma === -1 || sigma === 1 ? "#10b981" : "#8b5cf6";
      ctx.fill();
    });

    // Draw histogram if samples are shown
    if (showSamples && samples.length > 0) {
      const bins = 40;
      const binWidth = (xRange[1] - xRange[0]) / bins;
      const histogram = new Array(bins).fill(0);
      
      samples.forEach((sample) => {
        const binIndex = Math.floor((sample - xRange[0]) / binWidth);
        if (binIndex >= 0 && binIndex < bins) {
          histogram[binIndex]++;
        }
      });

      const maxCount = Math.max(...histogram);
      const scale = (maxPdf * 1.1) / maxCount;

      histogram.forEach((count, i) => {
        const x = xRange[0] + i * binWidth;
        const height = count * scale;
        const start = toCanvas(x, 0);
        const end = toCanvas(x + binWidth, height);
        
        ctx.fillStyle = "rgba(16, 185, 129, 0.3)";
        ctx.fillRect(
          start.cx,
          start.cy,
          end.cx - start.cx,
          end.cy - start.cy
        );
      });
    }
  }, [mean, stdDev, showSamples, samples]);

  useEffect(() => {
    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [draw]);

  const prob68 = distributionRef.current.cdf(mean + stdDev) - distributionRef.current.cdf(mean - stdDev);
  const prob95 = distributionRef.current.cdf(mean + 2 * stdDev) - distributionRef.current.cdf(mean - 2 * stdDev);

  return (
    <LabLayout
      algorithmId="normal-distribution"
      title="Normal Distribution"
      subtitle="Explore the bell curve interactively"
      onRandomize={generateNewSamples}
      visualization={
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          aria-label="Normal distribution visualization"
        />
      }
      controls={
        <>
          <Slider
            label="Mean (μ)"
            value={mean}
            min={-5}
            max={5}
            step={0.1}
            onChange={setMean}
            tooltip="Center of the distribution"
            formatValue={(v) => v.toFixed(1)}
          />
          <Slider
            label="Std Dev (σ)"
            value={stdDev}
            min={0.1}
            max={3}
            step={0.1}
            onChange={setStdDev}
            tooltip="Spread of the distribution"
            formatValue={(v) => v.toFixed(1)}
          />
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showSamples"
              checked={showSamples}
              onChange={(e) => setShowSamples(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="showSamples" className="text-sm cursor-pointer">
              Show samples histogram
            </label>
          </div>
          {showSamples && (
            <Slider
              label="Sample Size"
              value={numSamples}
              min={100}
              max={5000}
              step={100}
              onChange={setNumSamples}
              tooltip="Number of random samples"
            />
          )}
        </>
      }
      metrics={[
        { label: "Mean (μ)", value: formatNumber(mean), highlight: true },
        { label: "Std Dev (σ)", value: formatNumber(stdDev), highlight: true },
        { label: "68% Range", value: `[${formatNumber(mean - stdDev)}, ${formatNumber(mean + stdDev)}]` },
        { label: "95% Range", value: `[${formatNumber(mean - 2 * stdDev)}, ${formatNumber(mean + 2 * stdDev)}]` },
      ]}
      explanations={[
        {
          title: "What is happening?",
          content:
            "The normal distribution (Gaussian) is a symmetric bell curve centered at the mean (orange line). The green dots mark ±1σ (68% of data), and purple dots mark ±2σ (95% of data).",
        },
        {
          title: "Probability Density Function",
          content:
            "The height of the curve at any point represents the relative likelihood of that value occurring.",
          latex:
            "f(x) = \\frac{1}{\\sigma\\sqrt{2\\pi}} e^{-\\frac{1}{2}\\left(\\frac{x-\\mu}{\\sigma}\\right)^2}",
        },
        {
          title: "68-95-99.7 Rule",
          content:
            "Approximately 68% of data falls within 1 standard deviation, 95% within 2 standard deviations, and 99.7% within 3 standard deviations of the mean.",
        },
      ]}
    />
  );
}
