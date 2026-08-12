export type OptimizerType = "gd" | "sgd" | "momentum" | "rmsprop" | "adam";

export interface OptimizerState {
  x: number;
  y: number;
  loss: number;
  path: { x: number; y: number; loss: number }[];
  iteration: number;
}

export function lossFunction(x: number, y: number): number {
  return x * x + 10 * y * y;
}

export function gradient(x: number, y: number): { dx: number; dy: number } {
  return { dx: 2 * x, dy: 20 * y };
}

export class GradientDescentEngine {
  x: number;
  y: number;
  learningRate: number;
  optimizer: OptimizerType;
  path: { x: number; y: number; loss: number }[] = [];
  iteration = 0;

  private velocityX = 0;
  private velocityY = 0;
  private sqGradX = 0;
  private sqGradY = 0;
  private mX = 0;
  private mY = 0;
  private vX = 0;
  private vY = 0;
  private beta1 = 0.9;
  private beta2 = 0.999;
  private epsilon = 1e-8;
  private momentum = 0.9;

  constructor(
    x: number,
    y: number,
    learningRate = 0.1,
    optimizer: OptimizerType = "gd"
  ) {
    this.x = x;
    this.y = y;
    this.learningRate = learningRate;
    this.optimizer = optimizer;
    this.path.push({ x, y, loss: lossFunction(x, y) });
  }

  step(): OptimizerState {
    const { dx, dy } = gradient(this.x, this.y);
    const lr = this.learningRate;

    switch (this.optimizer) {
      case "gd":
        this.x -= lr * dx;
        this.y -= lr * dy;
        break;
      case "sgd": {
        const noise = 0.1;
        this.x -= lr * (dx + (Math.random() - 0.5) * noise);
        this.y -= lr * (dy + (Math.random() - 0.5) * noise);
        break;
      }
      case "momentum":
        this.velocityX = this.momentum * this.velocityX - lr * dx;
        this.velocityY = this.momentum * this.velocityY - lr * dy;
        this.x += this.velocityX;
        this.y += this.velocityY;
        break;
      case "rmsprop":
        this.sqGradX = 0.9 * this.sqGradX + 0.1 * dx * dx;
        this.sqGradY = 0.9 * this.sqGradY + 0.1 * dy * dy;
        this.x -= (lr * dx) / (Math.sqrt(this.sqGradX) + this.epsilon);
        this.y -= (lr * dy) / (Math.sqrt(this.sqGradY) + this.epsilon);
        break;
      case "adam":
        this.mX = this.beta1 * this.mX + (1 - this.beta1) * dx;
        this.mY = this.beta1 * this.mY + (1 - this.beta1) * dy;
        this.vX = this.beta2 * this.vX + (1 - this.beta2) * dx * dx;
        this.vY = this.beta2 * this.vY + (1 - this.beta2) * dy * dy;
        const mHatX = this.mX / (1 - Math.pow(this.beta1, this.iteration + 1));
        const mHatY = this.mY / (1 - Math.pow(this.beta1, this.iteration + 1));
        const vHatX = this.vX / (1 - Math.pow(this.beta2, this.iteration + 1));
        const vHatY = this.vY / (1 - Math.pow(this.beta2, this.iteration + 1));
        this.x -= (lr * mHatX) / (Math.sqrt(vHatX) + this.epsilon);
        this.y -= (lr * mHatY) / (Math.sqrt(vHatY) + this.epsilon);
        break;
    }

    this.iteration++;
    const loss = lossFunction(this.x, this.y);
    this.path.push({ x: this.x, y: this.y, loss });

    return this.getState();
  }

  reset(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.iteration = 0;
    this.path = [{ x, y, loss: lossFunction(x, y) }];
    this.velocityX = 0;
    this.velocityY = 0;
    this.sqGradX = 0;
    this.sqGradY = 0;
    this.mX = 0;
    this.mY = 0;
    this.vX = 0;
    this.vY = 0;
  }

  getState(): OptimizerState {
    return {
      x: this.x,
      y: this.y,
      loss: lossFunction(this.x, this.y),
      path: [...this.path],
      iteration: this.iteration,
    };
  }
}

export function computeLossLandscape(
  resolution: number,
  xRange: [number, number],
  yRange: [number, number]
): { x: number; y: number; z: number }[][] {
  const grid: { x: number; y: number; z: number }[][] = [];
  const [xMin, xMax] = xRange;
  const [yMin, yMax] = yRange;
  const xStep = (xMax - xMin) / resolution;
  const yStep = (yMax - yMin) / resolution;

  for (let i = 0; i <= resolution; i++) {
    const row: { x: number; y: number; z: number }[] = [];
    const y = yMin + i * yStep;
    for (let j = 0; j <= resolution; j++) {
      const x = xMin + j * xStep;
      row.push({ x, y, z: lossFunction(x, y) });
    }
    grid.push(row);
  }
  return grid;
}
