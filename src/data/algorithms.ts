import type { AlgorithmMeta } from "@/types";

export const CATEGORY_LABELS: Record<string, string> = {
  mathematics: "Mathematics",
  "machine-learning": "Machine Learning",
  "deep-learning": "Deep Learning",
  "neural-networks": "Neural Networks",
  optimization: "Optimization",
  statistics: "Statistics",
};

export const algorithms: AlgorithmMeta[] = [
  {
    id: "function-visualizer",
    title: "Function Visualizer",
    subtitle: "Explore mathematical functions interactively",
    description: "Plot functions, tangents, and derivatives in real time.",
    category: "mathematics",
    subCategory: "functions",
    tags: ["Mathematics", "Calculus", "Graphs"],
    featured: true,
    mvp: true,
    path: "/simulations/function-visualizer",
    keywords: ["function", "graph", "sin", "cos", "derivative", "tangent"],
  },
  {
    id: "gradient-descent",
    title: "Gradient Descent",
    subtitle: "See optimization happen in real time",
    description: "Watch optimizers navigate loss landscapes toward minima.",
    category: "optimization",
    subCategory: "general",
    tags: ["Optimization", "Mathematics", "ML"],
    featured: true,
    mvp: true,
    path: "/simulations/gradient-descent",
    keywords: ["gradient descent", "sgd", "momentum", "adam", "optimization"],
  },
  {
    id: "linear-regression",
    title: "Linear Regression",
    subtitle: "Watch a model learn the relationship between data points",
    description: "Train a regression line with gradient descent on synthetic data.",
    category: "machine-learning",
    subCategory: "regression",
    tags: ["Regression", "ML", "Supervised"],
    featured: true,
    mvp: true,
    path: "/simulations/linear-regression",
    keywords: ["linear regression", "mse", "slope", "intercept"],
  },
  {
    id: "polynomial-regression",
    title: "Polynomial Regression",
    subtitle: "Fit curves to data with polynomial functions",
    description: "Learn how polynomial degree affects model complexity and overfitting.",
    category: "machine-learning",
    subCategory: "regression",
    tags: ["Regression", "ML", "Supervised"],
    featured: true,
    mvp: true,
    path: "/simulations/polynomial-regression",
    keywords: ["polynomial regression", "curve fitting", "overfitting"],
  },
  {
    id: "k-means",
    title: "K-Means Clustering",
    subtitle: "Watch clusters form step by step",
    description: "Assign points to clusters and animate centroid updates.",
    category: "machine-learning",
    subCategory: "clustering",
    tags: ["Clustering", "Unsupervised", "ML"],
    featured: true,
    mvp: true,
    path: "/simulations/k-means",
    keywords: ["k-means", "clustering", "centroids"],
  },
  {
    id: "decision-tree",
    title: "Decision Tree",
    subtitle: "Build and explore decision trees visually",
    description: "See splits, entropy, and information gain at each node.",
    category: "machine-learning",
    subCategory: "classification",
    tags: ["Classification", "Trees", "ML"],
    featured: true,
    mvp: true,
    path: "/simulations/decision-tree",
    keywords: ["decision tree", "entropy", "gini", "split"],
  },
  {
    id: "neural-network-playground",
    title: "Neural Network Playground",
    subtitle: "Build and train neural networks interactively",
    description: "Construct networks, choose activations, and watch them learn.",
    category: "neural-networks",
    subCategory: "general",
    tags: ["Neural Networks", "Deep Learning", "Training"],
    featured: true,
    mvp: true,
    path: "/simulations/neural-network-playground",
    keywords: ["neural network", "playground", "backpropagation", "training"],
  },
  {
    id: "activation-functions",
    title: "Activation Functions",
    subtitle: "Explore activation functions and their derivatives",
    description: "Compare ReLU, Sigmoid, Tanh, GELU and more.",
    category: "deep-learning",
    subCategory: "activations",
    tags: ["Deep Learning", "Neural Networks", "Functions"],
    featured: true,
    mvp: true,
    path: "/simulations/activation-functions",
    keywords: ["relu", "sigmoid", "tanh", "gelu", "activation"],
  },
  {
    id: "cnn-visualizer",
    title: "CNN Visualizer",
    subtitle: "See convolution, pooling, and feature maps",
    description: "Watch kernels slide over images and produce feature maps.",
    category: "deep-learning",
    subCategory: "general",
    tags: ["CNN", "Deep Learning", "Computer Vision"],
    featured: true,
    mvp: true,
    path: "/simulations/cnn-visualizer",
    keywords: ["cnn", "convolution", "pooling", "feature map"],
  },
  {
    id: "lstm-visualizer",
    title: "LSTM Cell",
    subtitle: "Explore gates, cell state, and hidden state",
    description: "Manipulate LSTM gate values and see information flow.",
    category: "deep-learning",
    subCategory: "general",
    tags: ["LSTM", "RNN", "Deep Learning"],
    featured: true,
    mvp: true,
    path: "/simulations/lstm-visualizer",
    keywords: ["lstm", "rnn", "gates", "cell state"],
  },
  {
    id: "transformer-attention",
    title: "Transformer Attention",
    subtitle: "Visualize self-attention and token relationships",
    description: "Interactive attention heatmap with multi-head attention.",
    category: "deep-learning",
    subCategory: "general",
    tags: ["Transformer", "Attention", "NLP"],
    featured: true,
    mvp: true,
    path: "/simulations/transformer-attention",
    keywords: ["transformer", "attention", "self-attention", "multi-head"],
  },
  {
    id: "logistic-regression",
    title: "Logistic Regression",
    subtitle: "Binary classification with sigmoid decision boundary",
    description: "Train a classifier and adjust the decision threshold.",
    category: "machine-learning",
    subCategory: "classification",
    tags: ["Classification", "ML", "Supervised"],
    featured: true,
    mvp: true,
    path: "/simulations/logistic-regression",
    keywords: ["logistic regression", "sigmoid", "classification"],
  },
  {
    id: "knn",
    title: "K-Nearest Neighbors",
    subtitle: "Classify by proximity to nearest neighbors",
    description: "Move a query point and see K neighbors highlighted.",
    category: "machine-learning",
    subCategory: "classification",
    tags: ["Classification", "KNN", "ML"],
    featured: true,
    mvp: true,
    path: "/simulations/knn",
    keywords: ["knn", "k-nearest neighbors", "distance"],
  },
  {
    id: "svm",
    title: "Support Vector Machine",
    subtitle: "Find the optimal separating hyperplane",
    description: "Explore linear, polynomial, and RBF kernels.",
    category: "machine-learning",
    subCategory: "classification",
    tags: ["Classification", "SVM", "ML"],
    path: "/simulations/svm",
    keywords: ["svm", "support vector", "kernel", "margin"],
  },
  {
    id: "pca",
    title: "Principal Component Analysis",
    subtitle: "Project data onto principal components",
    description: "See variance explained and 2D/3D projections.",
    category: "machine-learning",
    subCategory: "dimensionality-reduction",
    tags: ["PCA", "Dimensionality", "ML"],
    featured: true,
    mvp: true,
    path: "/simulations/pca",
    keywords: ["pca", "principal component", "variance"],
  },
  {
    id: "derivatives",
    title: "Derivative Explorer",
    subtitle: "Visualize f(x) and f'(x) together",
    description: "Move along a curve and see tangent slope change.",
    category: "mathematics",
    subCategory: "functions",
    tags: ["Calculus", "Derivatives", "Mathematics"],
    path: "/simulations/derivatives",
    keywords: ["derivative", "tangent", "slope", "calculus"],
  },
  {
    id: "normal-distribution",
    title: "Normal Distribution",
    subtitle: "Explore the bell curve interactively",
    description: "Adjust mean and variance to see distribution change.",
    category: "statistics",
    subCategory: "probability",
    tags: ["Statistics", "Probability", "Distribution"],
    featured: true,
    mvp: true,
    path: "/simulations/normal-distribution",
    keywords: ["normal", "gaussian", "distribution", "statistics"],
  },
  {
    id: "loss-functions",
    title: "Loss Function Explorer",
    subtitle: "Compare MSE, cross-entropy, and more",
    description: "See how loss changes with predictions.",
    category: "optimization",
    subCategory: "general",
    tags: ["Loss", "Optimization", "ML"],
    path: "/simulations/loss-functions",
    keywords: ["loss", "mse", "cross entropy", "hinge"],
  },
];

export function getAlgorithmById(id: string): AlgorithmMeta | undefined {
  return algorithms.find((a) => a.id === id);
}

export function getAlgorithmsByCategory(category: string): AlgorithmMeta[] {
  return algorithms.filter((a) => a.category === category);
}

export function getFeaturedAlgorithms(): AlgorithmMeta[] {
  return algorithms.filter((a) => a.featured);
}

export function getMvpAlgorithms(): AlgorithmMeta[] {
  return algorithms.filter((a) => a.mvp);
}

export function searchAlgorithms(query: string): AlgorithmMeta[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  return algorithms.filter(
    (a) =>
      a.title.toLowerCase().includes(q) ||
      a.description.toLowerCase().includes(q) ||
      a.keywords.some((k) => k.includes(q)) ||
      a.tags.some((t) => t.toLowerCase().includes(q))
  );
}
