export type Category =
  | "mathematics"
  | "machine-learning"
  | "deep-learning"
  | "neural-networks"
  | "optimization"
  | "statistics";

export type SubCategory =
  | "regression"
  | "classification"
  | "clustering"
  | "dimensionality-reduction"
  | "ensemble"
  | "functions"
  | "probability"
  | "activations"
  | "general";

export interface AlgorithmMeta {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  category: Category;
  subCategory: SubCategory;
  tags: string[];
  featured?: boolean;
  mvp?: boolean;
  path: string;
  keywords: string[];
}

export interface Point2D {
  x: number;
  y: number;
}

export interface DataPoint extends Point2D {
  label?: number;
  cluster?: number;
}

export interface TrainingState {
  epoch: number;
  loss: number;
  isTraining: boolean;
  isPaused: boolean;
}

export interface ControlConfig {
  id: string;
  label: string;
  type: "slider" | "number" | "select" | "toggle" | "button";
  value: number | string | boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: string | number }[];
  tooltip?: string;
}

export interface MetricItem {
  label: string;
  value: string | number;
  highlight?: boolean;
}

export interface ExplanationSection {
  title: string;
  content: string;
  latex?: string;
}

export interface StepItem {
  title: string;
  description: string;
  latex?: string;
}

export interface VisualizationState {
  algorithm: string;
  parameters: Record<string, number | string | boolean>;
  dataset: DataPoint[];
  modelState: Record<string, unknown>;
  trainingState: TrainingState;
  visualizationSettings: Record<string, unknown>;
}
