"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Eye, Calculator } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { HeroVisualization } from "@/components/visualization/HeroVisualization";
import { getFeaturedAlgorithms, CATEGORY_LABELS } from "@/data/algorithms";

const categories = [
  { id: "mathematics", icon: Calculator, description: "Functions, derivatives, gradients, and more" },
  { id: "machine-learning", icon: Sparkles, description: "Regression, classification, clustering" },
  { id: "deep-learning", icon: Eye, description: "CNNs, RNNs, transformers, and attention" },
  { id: "neural-networks", icon: Sparkles, description: "Build and train neural networks" },
  { id: "optimization", icon: Calculator, description: "Gradient descent, Adam, and optimizers" },
  { id: "statistics", icon: Eye, description: "Distributions, probability, and statistics" },
];

const featured = getFeaturedAlgorithms().slice(0, 6);

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-30" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[var(--accent)]/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[var(--sage)]/5 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-sm font-medium text-[var(--accent)] mb-4 tracking-wide uppercase">
              Visualize. Experiment. Understand.
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-balance leading-[1.1]">
              Understand AI by{" "}
              <span className="gradient-text">seeing it work.</span>
            </h1>
            <p className="mt-6 text-lg text-[var(--muted-foreground)] max-w-lg leading-relaxed">
              Interactive visualizations for mathematics, machine learning, deep learning,
              neural networks, and optimization. Change the parameters. Watch the algorithm learn.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/explore">
                <Button size="lg">
                  Explore Visualizations
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/simulations/neural-network-playground">
                <Button variant="outline" size="lg">
                  Open Playground
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative aspect-square max-h-[500px] rounded-2xl border border-[var(--border)] bg-[var(--card)]/50 backdrop-blur overflow-hidden"
          >
            <HeroVisualization />
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-24 border-t border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight">Explore by Category</h2>
            <p className="mt-3 text-[var(--muted-foreground)]">
              From calculus to transformers — every concept visualized.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((cat, i) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link href={`/explore?category=${cat.id}`}>
                  <Card hover className="h-full">
                    <cat.icon className="w-6 h-6 text-[var(--accent)] mb-3" />
                    <h3 className="font-semibold text-lg">
                      {CATEGORY_LABELS[cat.id]}
                    </h3>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                      {cat.description}
                    </p>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="py-24 border-t border-[var(--border)] bg-[var(--card)]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight">Featured Visualizations</h2>
            <p className="mt-3 text-[var(--muted-foreground)]">
              Start with our most popular interactive laboratories.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featured.map((algo, i) => (
              <motion.div
                key={algo.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Link href={algo.path}>
                  <Card hover className="h-full flex flex-col">
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {algo.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent-muted)] text-[var(--accent)] font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <h3 className="font-semibold text-lg">{algo.title}</h3>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)] flex-1">
                      {algo.subtitle}
                    </p>
                    <span className="mt-4 text-sm text-[var(--accent)] font-medium inline-flex items-center gap-1">
                      Explore <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 border-t border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight mb-12">How It Works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { step: "01", title: "Choose a concept", desc: "Browse algorithms by category or search" },
              { step: "02", title: "Change parameters", desc: "Adjust sliders, inputs, and controls" },
              { step: "03", title: "Watch it happen", desc: "See real-time algorithm visualization" },
              { step: "04", title: "Understand the math", desc: "Read explanations with LaTeX formulas" },
            ].map((item) => (
              <div key={item.step}>
                <div className="text-4xl font-bold text-[var(--accent)]/20 mb-3">{item.step}</div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-[var(--muted-foreground)]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why SageStudio */}
      <section className="py-24 border-t border-[var(--border)] bg-[var(--card)]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-center mb-12">Why SageStudio?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "Interactive",
                desc: "Change parameters and experiment. Every control has a real effect on the visualization.",
              },
              {
                title: "Visual",
                desc: "See algorithms instead of only reading formulas. Watch training, clustering, and optimization happen.",
              },
              {
                title: "Mathematical",
                desc: "Connect the visualization to the underlying mathematics with beautiful LaTeX-rendered equations.",
              },
            ].map((item) => (
              <Card key={item.title} className="text-center">
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-[var(--muted-foreground)]">{item.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-[var(--border)]">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold tracking-tight mb-4">Start Exploring</h2>
          <p className="text-[var(--muted-foreground)] mb-8">
            Where AI, Mathematics, and Algorithms Come Alive.
          </p>
          <Link href="/explore">
            <Button size="lg">
              Start Exploring
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
}
