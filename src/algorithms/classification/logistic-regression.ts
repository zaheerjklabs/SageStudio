import type { DataPoint } from "@/types";

export class LogisticRegressionEngine {
  weight: number;
  bias: number;
  learningRate: number;
  lossHistory: number[];

  constructor(weight: number, bias: number, learningRate: number) {
    this.weight = weight;
    this.bias = bias;
    this.learningRate = learningRate;
    this.lossHistory = [];
  }

  sigmoid(z: number): number {
    return 1 / (1 + Math.exp(-z));
  }

  predict(x: number): number {
    return this.sigmoid(this.weight * x + this.bias);
  }

  predictClass(x: number, threshold = 0.5): number {
    return this.predict(x) >= threshold ? 1 : 0;
  }

  logLoss(data: DataPoint[]): number {
    let loss = 0;
    for (const point of data) {
      const pred = this.predict(point.x);
      const eps = 1e-15;
      loss += -(
        point.label! * Math.log(pred + eps) +
        (1 - point.label!) * Math.log(1 - pred + eps)
      );
    }
    return loss / data.length;
  }

  gradientStep(data: DataPoint[]): void {
    let dw = 0;
    let db = 0;

    for (const point of data) {
      const pred = this.predict(point.x);
      const error = pred - point.label!;
      dw += error * point.x;
      db += error;
    }

    dw /= data.length;
    db /= data.length;

    this.weight -= this.learningRate * dw;
    this.bias -= this.learningRate * db;

    this.lossHistory.push(this.logLoss(data));
  }

  reset(weight: number, bias: number): void {
    this.weight = weight;
    this.bias = bias;
    this.lossHistory = [];
  }

  getState(data: DataPoint[]) {
    return {
      weight: this.weight,
      bias: this.bias,
      loss: this.logLoss(data),
      lossHistory: this.lossHistory,
    };
  }
}
