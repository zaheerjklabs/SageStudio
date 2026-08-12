"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { searchAlgorithms, CATEGORY_LABELS } from "@/data/algorithms";
import type { AlgorithmMeta } from "@/types";

interface SearchDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SearchDialog({ open, onClose }: SearchDialogProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AlgorithmMeta[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setResults([]);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setResults(searchAlgorithms(query));
  }, [query]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const grouped = results.reduce<Record<string, AlgorithmMeta[]>>((acc, algo) => {
    const cat = CATEGORY_LABELS[algo.category] ?? algo.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(algo);
    return acc;
  }, {});

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg mx-4 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 border-b border-[var(--border)]">
          <Search className="w-4 h-4 text-[var(--muted)] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search algorithms, concepts..."
            className="flex-1 py-3.5 bg-transparent text-sm text-[var(--foreground)] placeholder:text-[var(--muted)] outline-none"
          />
          <button onClick={onClose} className="p-1 text-[var(--muted)] hover:text-[var(--foreground)]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {query && results.length === 0 && (
            <p className="px-4 py-8 text-sm text-center text-[var(--muted-foreground)]">
              No results for &ldquo;{query}&rdquo;
            </p>
          )}

          {!query && (
            <p className="px-4 py-8 text-sm text-center text-[var(--muted-foreground)]">
              Try &ldquo;gradient descent&rdquo;, &ldquo;relu&rdquo;, or &ldquo;k-means&rdquo;
            </p>
          )}

          {Object.entries(grouped).map(([category, algos]) => (
            <div key={category}>
              <p className="px-4 py-2 text-xs font-medium text-[var(--muted)] uppercase tracking-wider">
                {category}
              </p>
              {algos.map((algo) => (
                <Link
                  key={algo.id}
                  href={algo.path}
                  onClick={onClose}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-[var(--card-hover)] transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-[var(--foreground)]">{algo.title}</p>
                    <p className="text-xs text-[var(--muted-foreground)]">{algo.subtitle}</p>
                  </div>
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
