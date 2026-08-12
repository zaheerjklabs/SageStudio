import type { DataPoint } from "@/types";

export interface Centroid {
  x: number;
  y: number;
  cluster: number;
}

export interface KMeansState {
  centroids: Centroid[];
  assignments: number[];
  inertia: number;
  iteration: number;
  converged: boolean;
}

export class KMeansEngine {
  centroids: Centroid[] = [];
  assignments: number[] = [];
  iteration = 0;
  converged = false;

  initialize(data: DataPoint[], k: number, method: "random" | "kmeans++" = "random"): void {
    this.iteration = 0;
    this.converged = false;
    this.centroids = [];

    if (method === "kmeans++" && data.length > 0) {
      const first = Math.floor(Math.random() * data.length);
      this.centroids.push({ x: data[first].x, y: data[first].y, cluster: 0 });

      for (let c = 1; c < k; c++) {
        const distances = data.map((p) => {
          let minDist = Infinity;
          for (const cent of this.centroids) {
            const d = (p.x - cent.x) ** 2 + (p.y - cent.y) ** 2;
            if (d < minDist) minDist = d;
          }
          return minDist;
        });
        const total = distances.reduce((a, b) => a + b, 0);
        let r = Math.random() * total;
        let idx = 0;
        for (let i = 0; i < distances.length; i++) {
          r -= distances[i];
          if (r <= 0) {
            idx = i;
            break;
          }
        }
        this.centroids.push({ x: data[idx].x, y: data[idx].y, cluster: c });
      }
    } else {
      const indices = new Set<number>();
      while (indices.size < k && indices.size < data.length) {
        indices.add(Math.floor(Math.random() * data.length));
      }
      let c = 0;
      for (const idx of indices) {
        this.centroids.push({ x: data[idx].x, y: data[idx].y, cluster: c++ });
      }
    }

    this.assign(data);
  }

  distance(a: { x: number; y: number }, b: { x: number; y: number }): number {
    return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
  }

  assign(data: DataPoint[]): void {
    this.assignments = data.map((p) => {
      let minDist = Infinity;
      let cluster = 0;
      for (const cent of this.centroids) {
        const d = this.distance(p, cent);
        if (d < minDist) {
          minDist = d;
          cluster = cent.cluster;
        }
      }
      return cluster;
    });
  }

  updateCentroids(data: DataPoint[]): boolean {
    const newCentroids: Centroid[] = [];
    let moved = false;

    for (const cent of this.centroids) {
      const clusterPoints = data.filter((_, i) => this.assignments[i] === cent.cluster);
      if (clusterPoints.length === 0) {
        newCentroids.push({ ...cent });
        continue;
      }
      const newX = clusterPoints.reduce((s, p) => s + p.x, 0) / clusterPoints.length;
      const newY = clusterPoints.reduce((s, p) => s + p.y, 0) / clusterPoints.length;
      if (Math.abs(newX - cent.x) > 0.001 || Math.abs(newY - cent.y) > 0.001) {
        moved = true;
      }
      newCentroids.push({ x: newX, y: newY, cluster: cent.cluster });
    }

    this.centroids = newCentroids;
    return moved;
  }

  step(data: DataPoint[]): KMeansState {
    this.assign(data);
    const moved = this.updateCentroids(data);
    this.iteration++;
    this.converged = !moved;
    return this.getState(data);
  }

  runUntilConverged(data: DataPoint[], maxIter = 100): KMeansState {
    for (let i = 0; i < maxIter; i++) {
      const state = this.step(data);
      if (state.converged) break;
    }
    return this.getState(data);
  }

  inertia(data: DataPoint[]): number {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const cent = this.centroids.find((c) => c.cluster === this.assignments[i]);
      if (cent) {
        sum += this.distance(data[i], cent) ** 2;
      }
    }
    return sum;
  }

  getState(data: DataPoint[]): KMeansState {
    return {
      centroids: [...this.centroids],
      assignments: [...this.assignments],
      inertia: this.inertia(data),
      iteration: this.iteration,
      converged: this.converged,
    };
  }
}
