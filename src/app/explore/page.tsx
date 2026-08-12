"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { algorithms, CATEGORY_LABELS } from "@/data/algorithms";
import { Card } from "@/components/ui/Card";

function ExploreContent() {
  const searchParams = useSearchParams();
  const category = searchParams.get("category");

  const filtered = category
    ? algorithms.filter((a) => a.category === category)
    : algorithms;

  const grouped = filtered.reduce<Record<string, typeof algorithms>>((acc, algo) => {
    const cat = algo.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(algo);
    return acc;
  }, {});

  return (
    <div className="min-h-screen pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            {category ? CATEGORY_LABELS[category] ?? "Explore" : "Explore Visualizations"}
          </h1>
          <p className="mt-2 text-[var(--muted-foreground)]">
            {filtered.length} interactive visualizations available
          </p>
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2 mb-10">
          <Link
            href="/explore"
            className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              !category
                ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                : "border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--card-hover)]"
            }`}
          >
            All
          </Link>
          {Object.entries(CATEGORY_LABELS).map(([id, label]) => (
            <Link
              key={id}
              href={`/explore?category=${id}`}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                category === id
                  ? "bg-[var(--accent)] text-white border-[var(--accent)]"
                  : "border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--card-hover)]"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {category ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((algo, i) => (
              <motion.div
                key={algo.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={algo.path}>
                  <Card hover className="h-full flex flex-col">
                    {algo.mvp && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--sage-muted)] text-[var(--sage)] font-medium w-fit mb-2">
                        Featured
                      </span>
                    )}
                    <h3 className="font-semibold text-lg">{algo.title}</h3>
                    <p className="mt-1 text-sm text-[var(--muted-foreground)] flex-1">
                      {algo.subtitle}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {algo.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent-muted)] text-[var(--accent)]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                    <span className="mt-4 text-sm text-[var(--accent)] font-medium inline-flex items-center gap-1">
                      Explore <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        ) : (
          Object.entries(grouped).map(([cat, algos]) => (
            <div key={cat} className="mb-12">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">{CATEGORY_LABELS[cat]}</h2>
                <Link
                  href={`/explore?category=${cat}`}
                  className="text-sm text-[var(--accent)] hover:underline"
                >
                  View all
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {algos.slice(0, 3).map((algo) => (
                  <Link key={algo.id} href={algo.path}>
                    <Card hover className="h-full">
                      <h3 className="font-semibold">{algo.title}</h3>
                      <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                        {algo.subtitle}
                      </p>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-16 flex items-center justify-center">Loading...</div>}>
      <ExploreContent />
    </Suspense>
  );
}
