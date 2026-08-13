import type { DataPoint } from "@/types";

export class PCAEngine {
  data: DataPoint[];
  mean: { x: number; y: number };
  pc1: { x: number; y: number };
  pc2: { x: number; y: number };
  variance1: number;
  variance2: number;

  constructor(data: DataPoint[]) {
    this.data = data;
    this.mean = { x: 0, y: 0 };
    this.pc1 = { x: 0, y: 0 };
    this.pc2 = { x: 0, y: 0 };
    this.variance1 = 0;
    this.variance2 = 0;
    this.compute();
  }

  compute(): void {
    // Calculate mean
    let sumX = 0;
    let sumY = 0;
    for (const point of this.data) {
      sumX += point.x;
      sumY += point.y;
    }
    this.mean = {
      x: sumX / this.data.length,
      y: sumY / this.data.length,
    };

    // Center the data
    const centered = this.data.map((p) => ({
      x: p.x - this.mean.x,
      y: p.y - this.mean.y,
    }));

    // Compute covariance matrix
    let cov_xx = 0;
    let cov_xy = 0;
    let cov_yy = 0;

    for (const p of centered) {
      cov_xx += p.x * p.x;
      cov_xy += p.x * p.y;
      cov_yy += p.y * p.y;
    }

    cov_xx /= this.data.length;
    cov_xy /= this.data.length;
    cov_yy /= this.data.length;

    // Compute eigenvalues and eigenvectors
    const trace = cov_xx + cov_yy;
    const det = cov_xx * cov_yy - cov_xy * cov_xy;
    const lambda1 = trace / 2 + Math.sqrt((trace / 2) ** 2 - det);
    const lambda2 = trace / 2 - Math.sqrt((trace / 2) ** 2 - det);

    this.variance1 = lambda1;
    this.variance2 = lambda2;

    // First principal component
    if (Math.abs(cov_xy) > 1e-10) {
      const v1x = lambda1 - cov_yy;
      const v1y = cov_xy;
      const norm1 = Math.sqrt(v1x * v1x + v1y * v1y);
      this.pc1 = { x: v1x / norm1, y: v1y / norm1 };

      const v2x = lambda2 - cov_yy;
      const v2y = cov_xy;
      const norm2 = Math.sqrt(v2x * v2x + v2y * v2y);
      this.pc2 = { x: v2x / norm2, y: v2y / norm2 };
    } else {
      if (cov_xx > cov_yy) {
        this.pc1 = { x: 1, y: 0 };
        this.pc2 = { x: 0, y: 1 };
      } else {
        this.pc1 = { x: 0, y: 1 };
        this.pc2 = { x: -1, y: 0 };
      }
    }
  }

  project(point: DataPoint, component: 1 | 2 = 1): number {
    const centered = {
      x: point.x - this.mean.x,
      y: point.y - this.mean.y,
    };
    const pc = component === 1 ? this.pc1 : this.pc2;
    return centered.x * pc.x + centered.y * pc.y;
  }

  getVarianceExplained(): number {
    const total = this.variance1 + this.variance2;
    return total > 0 ? this.variance1 / total : 0;
  }

  reconstruct(projection: number, component: 1 | 2 = 1): DataPoint {
    const pc = component === 1 ? this.pc1 : this.pc2;
    return {
      x: this.mean.x + projection * pc.x,
      y: this.mean.y + projection * pc.y,
    };
  }
}
