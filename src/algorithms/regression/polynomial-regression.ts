import type { DataPoint } from "@/types";

export class PolynomialRegressionEngine {
  coefficients: number[];
  learningRate: number;
  lossHistory: number[];
  degree: number;

  constructor(degree: number, learningRate: number) {
    this.degree = degree;
    this.coefficients = Array(degree + 1).fill(0);
    this.learningRate = learningRate;
    this.lossHistory = [];
  }

  predict(x: number): number {
    let y = 0;
    for (let i = 0; i <= this.degree; i++) {
      y += this.coefficients[i] * Math.pow(x, i);
    }
    return y;
  }

  meanSquaredError(data: DataPoint[]): number {
    let sum = 0;
    for (const point of data) {
      const pred = this.predict(point.x);
      sum += (pred - point.y) ** 2;
    }
    return sum / data.length;
  }

  gradientStep(data: DataPoint[]): void {
    const gradients = Array(this.degree + 1).fill(0);

    for (const point of data) {
      const pred = this.predict(point.x);
      const error = pred - point.y;
      for (let i = 0; i <= this.degree; i++) {
        gradients[i] += (2 * error * Math.pow(point.x, i)) / data.length;
      }
    }

    for (let i = 0; i <= this.degree; i++) {
      this.coefficients[i] -= this.learningRate * gradients[i];
    }

    this.lossHistory.push(this.meanSquaredError(data));
  }

  reset(degree?: number): void {
    if (degree !== undefined) {
      this.degree = degree;
    }
    this.coefficients = Array(this.degree + 1).fill(0);
    this.lossHistory = [];
  }

  getState(data: DataPoint[]) {
    return {
      coefficients: this.coefficients,
      loss: this.meanSquaredError(data),
      lossHistory: this.lossHistory,
      degree: this.degree,
    };
  }
}
