import type { DataPoint } from "@/types";

export class KNNEngine {
  k: number;
  data: DataPoint[];

  constructor(k: number, data: DataPoint[]) {
    this.k = k;
    this.data = data;
  }

  distance(p1: DataPoint, p2: DataPoint): number {
    return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
  }

  findNeighbors(query: DataPoint): DataPoint[] {
    const distances = this.data.map((point) => ({
      point,
      distance: this.distance(query, point),
    }));

    distances.sort((a, b) => a.distance - b.distance);

    return distances.slice(0, this.k).map((d) => d.point);
  }

  predict(query: DataPoint): number {
    const neighbors = this.findNeighbors(query);
    const votes = neighbors.reduce((acc, n) => {
      acc[n.label || 0] = (acc[n.label || 0] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    let maxVotes = 0;
    let predictedClass = 0;
    for (const [label, count] of Object.entries(votes)) {
      if (count > maxVotes) {
        maxVotes = count;
        predictedClass = parseInt(label);
      }
    }

    return predictedClass;
  }

  getAccuracy(testData: DataPoint[]): number {
    let correct = 0;
    for (const point of testData) {
      if (this.predict(point) === point.label) {
        correct++;
      }
    }
    return correct / testData.length;
  }
}
