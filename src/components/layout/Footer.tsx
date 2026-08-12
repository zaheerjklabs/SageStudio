"use client";

import Link from "next/link";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--card)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Logo />
            <p className="mt-4 text-sm text-[var(--muted-foreground)] max-w-sm">
              Visualize. Experiment. Understand. Interactive mathematics, machine learning, and deep learning visualizations.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3">Explore</h4>
            <ul className="space-y-2 text-sm text-[var(--muted-foreground)]">
              <li><Link href="/explore" className="hover:text-[var(--foreground)] transition-colors">All Visualizations</Link></li>
              <li><Link href="/explore?category=machine-learning" className="hover:text-[var(--foreground)] transition-colors">Machine Learning</Link></li>
              <li><Link href="/explore?category=deep-learning" className="hover:text-[var(--foreground)] transition-colors">Deep Learning</Link></li>
              <li><Link href="/simulations/neural-network-playground" className="hover:text-[var(--foreground)] transition-colors">Playground</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3">Resources</h4>
            <ul className="space-y-2 text-sm text-[var(--muted-foreground)]">
              <li><Link href="/about" className="hover:text-[var(--foreground)] transition-colors">About</Link></li>
              <li><a href="https://github.com" className="hover:text-[var(--foreground)] transition-colors">GitHub</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-[var(--border)] flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-[var(--muted)]">
            © {new Date().getFullYear()} SageStudio by ZaheerJKLabs
          </p>
          <p className="text-xs text-[var(--muted)]">
            Visualize. Experiment. Understand.
          </p>
        </div>
      </div>
    </footer>
  );
}
