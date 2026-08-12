import type { DataPoint } from "@/types";
import { randomSeed } from "@/lib/utils";

export function generateRegressionData(
  n: number,
  slope: number,
  intercept: number,
  noise: number,
  seed = 42
): DataPoint[] {
  const rand = randomSeed(seed);
  const points: DataPoint[] = [];
  for (let i = 0; i < n; i++) {
    const x = rand() * 10 - 5;
    const y = slope * x + intercept + (rand() - 0.5) * noise * 2;
    points.push({ x, y });
  }
  return points;
}

export function generateClassificationBlobs(
  n: number,
  noise: number,
  seed = 42
): DataPoint[] {
  const rand = randomSeed(seed);
  const points: DataPoint[] = [];
  const perClass = Math.floor(n / 2);
  for (let i = 0; i < perClass; i++) {
    points.push({
      x: rand() * 2 - 1 + 2,
      y: rand() * 2 - 1 + 2,
      label: 0,
    });
    points.push({
      x: rand() * 2 - 1 - 2,
      y: rand() * 2 - 1 - 2,
      label: 1,
    });
  }
  const extra = n - perClass * 2;
  for (let i = 0; i < extra; i++) {
    const label = rand() > 0.5 ? 0 : 1;
    const cx = label === 0 ? 2 : -2;
    const cy = label === 0 ? 2 : -2;
    points.push({
      x: rand() * 2 - 1 + cx + (rand() - 0.5) * noise,
      y: rand() * 2 - 1 + cy + (rand() - 0.5) * noise,
      label,
    });
  }
  return points;
}

export function generateCircles(n: number, noise: number, seed = 42): DataPoint[] {
  const rand = randomSeed(seed);
  const points: DataPoint[] = [];
  const perClass = Math.floor(n / 2);
  for (let i = 0; i < perClass; i++) {
    const angle = rand() * Math.PI * 2;
    const r = 1 + rand() * 0.5;
    points.push({
      x: Math.cos(angle) * r + (rand() - 0.5) * noise,
      y: Math.sin(angle) * r + (rand() - 0.5) * noise,
      label: 0,
    });
    const angle2 = rand() * Math.PI * 2;
    const r2 = 3 + rand() * 0.5;
    points.push({
      x: Math.cos(angle2) * r2 + (rand() - 0.5) * noise,
      y: Math.sin(angle2) * r2 + (rand() - 0.5) * noise,
      label: 1,
    });
  }
  return points;
}

export function generateXOR(n: number, noise: number, seed = 42): DataPoint[] {
  const rand = randomSeed(seed);
  const points: DataPoint[] = [];
  const perClass = Math.floor(n / 2);
  for (let i = 0; i < perClass; i++) {
    const x = rand() * 4 - 2;
    const y = rand() * 4 - 2;
    const label = (x > 0) !== (y > 0) ? 1 : 0;
    points.push({
      x: x + (rand() - 0.5) * noise,
      y: y + (rand() - 0.5) * noise,
      label,
    });
    const x2 = rand() * 4 - 2;
    const y2 = rand() * 4 - 2;
    const label2 = (x2 > 0) !== (y2 > 0) ? 1 : 0;
    points.push({
      x: x2 + (rand() - 0.5) * noise,
      y: y2 + (rand() - 0.5) * noise,
      label: label2,
    });
  }
  return points;
}

export function generateSpiral(n: number, noise: number, seed = 42): DataPoint[] {
  const rand = randomSeed(seed);
  const points: DataPoint[] = [];
  const perClass = Math.floor(n / 2);
  for (let i = 0; i < perClass; i++) {
    const t = (i / perClass) * 4 * Math.PI;
    const r = t / (4 * Math.PI) * 4;
    points.push({
      x: Math.cos(t) * r + (rand() - 0.5) * noise,
      y: Math.sin(t) * r + (rand() - 0.5) * noise,
      label: 0,
    });
    points.push({
      x: Math.cos(t + Math.PI) * r + (rand() - 0.5) * noise,
      y: Math.sin(t + Math.PI) * r + (rand() - 0.5) * noise,
      label: 1,
    });
  }
  return points;
}

export function generateClusteringData(
  k: number,
  n: number,
  spread: number,
  seed = 42
): DataPoint[] {
  const rand = randomSeed(seed);
  const points: DataPoint[] = [];
  const centroids: { x: number; y: number }[] = [];
  for (let c = 0; c < k; c++) {
    const angle = (c / k) * Math.PI * 2;
    centroids.push({
      x: Math.cos(angle) * 4,
      y: Math.sin(angle) * 4,
    });
  }
  const perCluster = Math.floor(n / k);
  for (let c = 0; c < k; c++) {
    for (let i = 0; i < perCluster; i++) {
      points.push({
        x: centroids[c].x + (rand() - 0.5) * spread * 2,
        y: centroids[c].y + (rand() - 0.5) * spread * 2,
        cluster: c,
      });
    }
  }
  return points;
}

export type DatasetType =
  | "blobs"
  | "circles"
  | "xor"
  | "spiral"
  | "regression"
  | "clustering";

export function generateDataset(
  type: DatasetType,
  n: number,
  noise: number,
  seed = 42,
  extra?: { k?: number; spread?: number; slope?: number; intercept?: number }
): DataPoint[] {
  switch (type) {
    case "blobs":
      return generateClassificationBlobs(n, noise, seed);
    case "circles":
      return generateCircles(n, noise, seed);
    case "xor":
      return generateXOR(n, noise, seed);
    case "spiral":
      return generateSpiral(n, noise, seed);
    case "regression":
      return generateRegressionData(
        n,
        extra?.slope ?? 1.5,
        extra?.intercept ?? 0.5,
        noise,
        seed
      );
    case "clustering":
      return generateClusteringData(
        extra?.k ?? 3,
        n,
        extra?.spread ?? 1.5,
        seed
      );
    default:
      return generateClassificationBlobs(n, noise, seed);
  }
}
