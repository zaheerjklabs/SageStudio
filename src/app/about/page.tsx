export default function AboutPage() {
  return (
    <div className="min-h-screen pt-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">About SageStudio</h1>
        <p className="text-lg text-[var(--muted-foreground)] mb-8">
          Visualize. Experiment. Understand.
        </p>

        <div className="space-y-6 text-[var(--muted-foreground)] leading-relaxed">
          <p>
            SageStudio is an interactive visualization laboratory for mathematics, statistics,
            machine learning, deep learning, neural networks, and optimization — built by{" "}
            <span className="text-[var(--foreground)] font-medium">ZaheerJKLabs</span>.
          </p>
          <p>
            Our core philosophy is simple: <strong className="text-[var(--foreground)]">don&apos;t just read how an algorithm works — see it work.</strong>{" "}
            Every visualization lets you manipulate parameters using sliders, inputs, and controls,
            and immediately see the algorithm respond in real time.
          </p>
          <p>
            SageStudio implements real algorithms in TypeScript — not fake animations. When you
            change the learning rate, the optimizer actually moves differently. When you change K
            in K-Means, clusters actually reassign. When you add neurons, the network actually
            grows.
          </p>

          <h2 className="text-xl font-semibold text-[var(--foreground)] pt-4">Architecture</h2>
          <p>
            Each visualization follows a clean separation: Algorithm Engine → Model State →
            Visualization. This modular architecture makes it easy to add new algorithms without
            rewriting the application.
          </p>

          <h2 className="text-xl font-semibold text-[var(--foreground)] pt-4">Technology</h2>
          <p>
            Built with Next.js, React, TypeScript, Tailwind CSS, Canvas, D3.js, Framer Motion,
            and KaTeX for mathematical rendering. All computations run client-side — no backend
            required.
          </p>
        </div>
      </div>
    </div>
  );
}
