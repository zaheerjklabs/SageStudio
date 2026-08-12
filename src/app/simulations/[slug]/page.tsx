import { notFound } from "next/navigation";
import { getAlgorithmById } from "@/data/algorithms";
import type { Metadata } from "next";

import FunctionVisualizerViz from "@/visualizations/mathematics/FunctionVisualizerViz";
import GradientDescentViz from "@/visualizations/optimization/GradientDescentViz";
import LinearRegressionViz from "@/visualizations/machine-learning/LinearRegressionViz";
import KMeansViz from "@/visualizations/machine-learning/KMeansViz";
import DecisionTreeViz from "@/visualizations/machine-learning/DecisionTreeViz";
import NeuralNetworkPlaygroundViz from "@/visualizations/neural-networks/NeuralNetworkPlaygroundViz";
import ActivationFunctionsViz from "@/visualizations/deep-learning/ActivationFunctionsViz";
import CNNVisualizerViz from "@/visualizations/deep-learning/CNNVisualizerViz";
import LSTMVisualizerViz from "@/visualizations/deep-learning/LSTMVisualizerViz";
import TransformerAttentionViz from "@/visualizations/deep-learning/TransformerAttentionViz";

const VIZ_MAP: Record<string, React.ComponentType> = {
  "function-visualizer": FunctionVisualizerViz,
  "gradient-descent": GradientDescentViz,
  "linear-regression": LinearRegressionViz,
  "k-means": KMeansViz,
  "decision-tree": DecisionTreeViz,
  "neural-network-playground": NeuralNetworkPlaygroundViz,
  "activation-functions": ActivationFunctionsViz,
  "cnn-visualizer": CNNVisualizerViz,
  "lstm-visualizer": LSTMVisualizerViz,
  "transformer-attention": TransformerAttentionViz,
};

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const algo = getAlgorithmById(slug);
  if (!algo) return { title: "Not Found — SageStudio" };
  return {
    title: `${algo.title} — SageStudio`,
    description: algo.description,
  };
}

export function generateStaticParams() {
  return Object.keys(VIZ_MAP).map((slug) => ({ slug }));
}

export default async function SimulationPage({ params }: PageProps) {
  const { slug } = await params;
  const VizComponent = VIZ_MAP[slug];

  if (!VizComponent) {
    notFound();
  }

  return <VizComponent />;
}
