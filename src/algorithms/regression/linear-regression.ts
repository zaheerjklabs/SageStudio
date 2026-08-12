import type { DataPoint } from "@/types";

export interface LinearRegressionState {
  weight: number;
  bias: number;
  loss: number;
  lossHistory: number[];
  predictions: number[];
}

export class LinearRegressionEngine {
  weight: number;
  bias: number;
  learningRate: number;
  lossHistory: number[] = [];

  constructor(weight = 0, bias = 0, learningRate = 0.01) {
    this.weight = weight;
    this.bias = bias;
    this.learningRate = learningRate;
  }

  predict(x: number): number {
    return this.weight * x + this.bias;
  }

  predictAll(data: DataPoint[]): number[] {
    return data.map((p) => this.predict(p.x));
  }

  mse(data: DataPoint[]): number {
    if (data.length === 0) return 0;
    let sum = 0;
    for (const p of data) {
      const pred = this.predict(p.x);
      sum += (pred - p.y) ** 2;
    }
    return sum / data.length;
  }

  gradientStep(data: DataPoint[]): void {
    const n = data.length;
    if (n === 0) return;

    let dw = 0;
    let db = 0;
    for (const p of data) {
      const error = this.predict(p.x) - p.y;
      dw += error * p.x;
      db += error;
    }
    dw = (2 / n) * dw;
    db = (2 / n) * db;

    this.weight -= this.learningRate * dw;
    this.bias -= this.learningRate * db;

    this.lossHistory.push(this.mse(data));
  }

  trainEpoch(data: DataPoint[], epochs = 1): void {
    for (let i = 0; i < epochs; i++) {
      this.gradientStep(data);
    }
  }

  getState(data: DataPoint[]): LinearRegressionState {
    return {
      weight: this.weight,
      bias: this.bias,
      loss: this.mse(data),
      lossHistory: [...this.lossHistory],
      predictions: this.predictAll(data),
    };
  }

  reset(weight = 0, bias = 0): void {
    this.weight = weight;
    this.bias = bias;
    this.lossHistory = [];
  }
}
