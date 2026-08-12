import { activate, activateDerivative, type ActivationType } from "./activations";

export interface NetworkConfig {
  layers: number[];
  activation: ActivationType;
  learningRate: number;
}

export interface NeuronState {
  activation: number;
  z: number;
  bias: number;
  weights: number[];
}

export interface NetworkState {
  layers: NeuronState[][];
  loss: number;
  accuracy: number;
  epoch: number;
  lossHistory: number[];
}

function randomMatrix(rows: number, cols: number, scale = 0.5): number[][] {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => (Math.random() - 0.5) * scale)
  );
}

export class NeuralNetworkEngine {
  weights: number[][][] = [];
  biases: number[][] = [];
  config: NetworkConfig;
  lossHistory: number[] = [];
  epoch = 0;
  lastActivations: number[][] = [];
  lastZs: number[][] = [];

  constructor(config: NetworkConfig) {
    this.config = config;
    this.initialize();
  }

  initialize(): void {
    const { layers } = this.config;
    this.weights = [];
    this.biases = [];
    for (let i = 0; i < layers.length - 1; i++) {
      this.weights.push(randomMatrix(layers[i + 1], layers[i]));
      this.biases.push(Array.from({ length: layers[i + 1] }, () => (Math.random() - 0.5) * 0.1));
    }
    this.lossHistory = [];
    this.epoch = 0;
  }

  forward(input: number[]): number[] {
    let current = input;
    this.lastActivations = [input];
    this.lastZs = [];

    for (let l = 0; l < this.weights.length; l++) {
      const z = this.biases[l].map((b, i) =>
        b + this.weights[l][i].reduce((sum, w, j) => sum + w * current[j], 0)
      );
      this.lastZs.push(z);
      const isOutput = l === this.weights.length - 1;
      const actType = isOutput ? "sigmoid" : this.config.activation;
      current = z.map((v) => activate(v, actType));
      this.lastActivations.push(current);
    }
    return current;
  }

  predict(inputs: number[][]): number[][] {
    return inputs.map((input) => this.forward(input));
  }

  trainStep(
    inputs: number[][],
    labels: number[][],
  ): number {
    let totalLoss = 0;
    const lr = this.config.learningRate;

    for (let s = 0; s < inputs.length; s++) {
      const output = this.forward(inputs[s]);
      const target = labels[s];

      let loss = 0;
      for (let i = 0; i < output.length; i++) {
        loss += (output[i] - target[i]) ** 2;
      }
      totalLoss += loss / output.length;

      const deltas: number[][] = [];
      const outputDelta = output.map((o, i) => 2 * (o - target[i]) * activateDerivative(this.lastZs[this.lastZs.length - 1][i], "sigmoid"));
      deltas.unshift(outputDelta);

      for (let l = this.weights.length - 2; l >= 0; l--) {
        const nextDelta = this.weights[l + 1].map((_, j) => {
          let sum = 0;
          for (let k = 0; k < deltas[0].length; k++) {
            sum += this.weights[l + 1][k][j] * deltas[0][k];
          }
          return sum * activateDerivative(this.lastZs[l][j], this.config.activation);
        });
        deltas.unshift(nextDelta);
      }

      for (let l = 0; l < this.weights.length; l++) {
        const prevAct = this.lastActivations[l];
        for (let i = 0; i < this.weights[l].length; i++) {
          for (let j = 0; j < this.weights[l][i].length; j++) {
            this.weights[l][i][j] -= lr * deltas[l][i] * prevAct[j];
          }
          this.biases[l][i] -= lr * deltas[l][i];
        }
      }
    }

    const avgLoss = totalLoss / inputs.length;
    this.lossHistory.push(avgLoss);
    this.epoch++;
    return avgLoss;
  }

  getAccuracy(inputs: number[][], labels: number[][]): number {
    let correct = 0;
    for (let i = 0; i < inputs.length; i++) {
      const output = this.forward(inputs[i]);
      const pred = output[0] > 0.5 ? 1 : 0;
      const actual = labels[i][0] > 0.5 ? 1 : 0;
      if (pred === actual) correct++;
    }
    return inputs.length > 0 ? correct / inputs.length : 0;
  }

  getNeuronState(layer: number, neuron: number): NeuronState | null {
    if (layer >= this.weights.length) return null;
    return {
      activation: this.lastActivations[layer + 1]?.[neuron] ?? 0,
      z: this.lastZs[layer]?.[neuron] ?? 0,
      bias: this.biases[layer]?.[neuron] ?? 0,
      weights: this.weights[layer]?.[neuron] ?? [],
    };
  }

  updateConfig(config: Partial<NetworkConfig>): void {
    const newLayers = config.layers ?? this.config.layers;
    const layersChanged =
      config.layers && JSON.stringify(config.layers) !== JSON.stringify(this.config.layers);

    this.config = { ...this.config, ...config };

    if (layersChanged) {
      this.initialize();
    }
  }
}

export function dataToNetworkInput(
  points: { x: number; y: number }[]
): { inputs: number[][]; labels: number[][] } {
  const inputs = points.map((p) => [p.x / 5, p.y / 5]);
  const labels = points.map((p) => [(p as { label?: number }).label ?? 0]);
  return { inputs, labels };
}
