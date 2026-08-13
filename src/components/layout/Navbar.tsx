"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Sun,
  Moon,
  Menu,
  X,
  User,
} from "lucide-react";

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}
import { useThemeStore } from "@/store/theme";
import { cn } from "@/lib/utils";
import { SearchDialog } from "./SearchDialog";
import { Logo } from "./Logo";

const navLinks = [
  { href: "/explore", label: "Explore" },
  { href: "/explore?category=mathematics", label: "Mathematics" },
  { href: "/explore?category=machine-learning", label: "Machine Learning" },
  { href: "/explore?category=deep-learning", label: "Deep Learning" },
  { href: "/explore?category=neural-networks", label: "Neural Networks" },
  { href: "/explore?category=optimization", label: "Optimization" },
  { href: "/simulations/neural-network-playground", label: "Playground" },
  { href: "/about", label: "About" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, toggleTheme } = useThemeStore();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
          scrolled
            ? "bg-[var(--background)]/80 backdrop-blur-xl border-b border-[var(--border)]"
            : "bg-transparent"
        )}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Logo />

          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] rounded-md hover:bg-[var(--card-hover)] transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-sm text-[var(--muted-foreground)] border border-[var(--border)] rounded-lg hover:bg-[var(--card-hover)] transition-colors"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
              <span className="hidden md:inline">Search</span>
              <kbd className="hidden md:inline text-[10px] px-1.5 py-0.5 rounded bg-[var(--card)] border border-[var(--border)] font-mono">
                ⌘K
              </kbd>
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)] transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex p-2 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)] transition-colors"
              aria-label="GitHub"
            >
              <GithubIcon className="w-4 h-4" />
            </a>

            <button
              className="hidden sm:flex p-2 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--card-hover)] transition-colors"
              aria-label="Profile"
            >
              <User className="w-4 h-4" />
            </button>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-lg text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden border-b border-[var(--border)] bg-[var(--background)]/95 backdrop-blur-xl overflow-hidden"
            >
              <div className="px-4 py-4 space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block px-3 py-2.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] rounded-lg hover:bg-[var(--card-hover)]"
                  >
                    {link.label}
                  </Link>
                ))}
                <button
                  onClick={() => {
                    setSearchOpen(true);
                    setMobileOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-[var(--muted-foreground)] rounded-lg hover:bg-[var(--card-hover)]"
                >
                  <Search className="w-4 h-4" />
                  Search
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
