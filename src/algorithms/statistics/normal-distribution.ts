export class NormalDistribution {
  mean: number;
  stdDev: number;

  constructor(mean: number, stdDev: number) {
    this.mean = mean;
    this.stdDev = stdDev;
  }

  pdf(x: number): number {
    const coefficient = 1 / (this.stdDev * Math.sqrt(2 * Math.PI));
    const exponent = -((x - this.mean) ** 2) / (2 * this.stdDev ** 2);
    return coefficient * Math.exp(exponent);
  }

  cdf(x: number): number {
    const z = (x - this.mean) / this.stdDev;
    return 0.5 * (1 + this.erf(z / Math.sqrt(2)));
  }

  // Error function approximation
  erf(x: number): number {
    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const t = 1 / (1 + p * x);
    const y =
      1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  sample(): number {
    // Box-Muller transform
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return z0 * this.stdDev + this.mean;
  }

  generateSamples(n: number): number[] {
    return Array.from({ length: n }, () => this.sample());
  }
}
