# SageStudio Project Structure

## 📁 Complete File Tree

```
SageStudio/
├── src/
│   ├── algorithms/               # Core algorithm implementations
│   │   ├── classification/
│   │   │   ├── decision-tree.ts
│   │   │   ├── logistic-regression.ts    ⭐ NEW
│   │   │   └── knn.ts                     ⭐ NEW
│   │   ├── clustering/
│   │   │   └── k-means.ts
│   │   ├── datasets.ts           # Data generation utilities
│   │   ├── dimensionality-reduction/
│   │   │   └── pca.ts                     ⭐ NEW
│   │   ├── mathematics/
│   │   │   └── functions.ts
│   │   ├── neural-networks/
│   │   │   ├── activations.ts
│   │   │   └── network.ts
│   │   ├── optimization/
│   │   │   └── gradient-descent.ts
│   │   ├── regression/
│   │   │   ├── linear-regression.ts
│   │   │   └── polynomial-regression.ts   ⭐ NEW
│   │   └── statistics/
│   │       └── normal-distribution.ts     ⭐ NEW
│   │
│   ├── visualizations/           # Interactive visualizations
│   │   ├── deep-learning/
│   │   │   ├── ActivationFunctionsViz.tsx
│   │   │   ├── CNNVisualizerViz.tsx
│   │   │   ├── LSTMVisualizerViz.tsx
│   │   │   └── TransformerAttentionViz.tsx
│   │   ├── machine-learning/
│   │   │   ├── DecisionTreeViz.tsx
│   │   │   ├── KMeansViz.tsx
│   │   │   ├── LinearRegressionViz.tsx    (UPDATED)
│   │   │   ├── LogisticRegressionViz.tsx  ⭐ NEW
│   │   │   ├── KNNViz.tsx                  ⭐ NEW
│   │   │   ├── PCAViz.tsx                  ⭐ NEW
│   │   │   └── PolynomialRegressionViz.tsx ⭐ NEW
│   │   ├── mathematics/
│   │   │   └── FunctionVisualizerViz.tsx
│   │   ├── neural-networks/
│   │   │   └── NeuralNetworkPlaygroundViz.tsx
│   │   ├── optimization/
│   │   │   └── GradientDescentViz.tsx
│   │   └── statistics/
│   │       └── NormalDistributionViz.tsx   ⭐ NEW
│   │
│   ├── components/               # Reusable UI components
│   │   ├── controls/
│   │   │   └── Slider.tsx
│   │   ├── layout/
│   │   │   ├── Footer.tsx
│   │   │   ├── Logo.tsx
│   │   │   ├── Navbar.tsx
│   │   │   ├── SearchDialog.tsx
│   │   │   └── ThemeProvider.tsx
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   └── Formula.tsx
│   │   └── visualization/
│   │       ├── HeroVisualization.tsx
│   │       └── LabLayout.tsx              ⚙️ MODIFIED
│   │
│   ├── app/                      # Next.js app router
│   │   ├── about/
│   │   │   └── page.tsx
│   │   ├── explore/
│   │   │   └── page.tsx
│   │   ├── simulations/
│   │   │   └── [slug]/
│   │   │       └── page.tsx              ⚙️ MODIFIED
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   │
│   ├── data/
│   │   └── algorithms.ts                 ⚙️ MODIFIED
│   │
│   ├── lib/
│   │   ├── canvas.ts             # Canvas utilities
│   │   └── utils.ts              # Helper functions
│   │
│   ├── store/
│   │   ├── favorites.ts
│   │   └── theme.ts
│   │
│   └── types/
│       ├── css.d.ts
│       ├── index.ts
│       └── react-katex.d.ts
│
├── public/                       # Static assets
│   ├── banner.svg
│   ├── logo.png
│   └── logo.svg
│
├── .eslintrc.json
├── .gitignore
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tsconfig.json
├── LICENSE
├── README.md
├── IMPROVEMENTS_SUMMARY.md       ⭐ NEW - What changed
├── UI_COMPARISON.md              ⭐ NEW - Layout comparison
├── QUICK_START.md                ⭐ NEW - Getting started
└── PROJECT_STRUCTURE.md          ⭐ NEW - This file
```

---

## 🎯 Key Components

### Algorithm Layer
```
src/algorithms/
  Purpose: Pure TypeScript implementations of ML/Math algorithms
  Pattern: Class-based with methods for training, prediction, state
  Testing: Deterministic, reproducible results
```

### Visualization Layer
```
src/visualizations/
  Purpose: React components with canvas rendering
  Pattern: Hooks for state, refs for canvas, callbacks for drawing
  Features: Real-time animation, user interaction, parameter controls
```

### Component Library
```
src/components/
  Purpose: Reusable UI building blocks
  Pattern: Composition over inheritance
  Highlights: LabLayout (side-by-side), Slider (interactive), Formula (LaTeX)
```

---

## 🔄 Data Flow

```
User Interaction
      ↓
   Slider onChange
      ↓
   State Update (useState)
      ↓
   Algorithm Engine (useRef)
      ↓
   Canvas Draw (useCallback)
      ↓
   Visual Update (requestAnimationFrame)
```

---

## 🎨 Component Architecture

### LabLayout Component (Central Hub)
```typescript
<LabLayout
  algorithmId="knn"
  title="K-Nearest Neighbors"
  subtitle="Classify by proximity"
  
  // Controls (left side)
  controls={
    <Slider label="K" value={k} onChange={setK} />
  }
  
  // Metrics (left side, below controls)
  metrics={[
    { label: "K Value", value: "3" }
  ]}
  
  // Visualization (right side, sticky)
  visualization={
    <canvas ref={canvasRef} />
  }
  
  // Explanations (bottom, full width)
  explanations={[
    { title: "What?", content: "...", latex: "..." }
  ]}
  
  // Actions
  onRun={train}
  onReset={regenerate}
  isTraining={isTraining}
/>
```

---

## 🧩 Algorithm Pattern

Every algorithm follows this structure:

```typescript
export class AlgorithmEngine {
  // State
  private params: Parameters;
  public history: number[];

  constructor(initialParams) {
    this.params = initialParams;
    this.history = [];
  }

  // Core logic
  predict(input: DataPoint): number {
    // Algorithm implementation
  }

  // Training step
  step(data: DataPoint[]): void {
    // Update parameters
    this.history.push(this.loss(data));
  }

  // Loss/metrics
  loss(data: DataPoint[]): number {
    // Calculate error metric
  }

  // State management
  reset(newParams?: Parameters): void {
    this.params = newParams || this.params;
    this.history = [];
  }

  getState() {
    return {
      params: this.params,
      history: this.history,
      // ... other relevant state
    };
  }
}
```

---

## 🎬 Visualization Pattern

Every visualization follows this structure:

```typescript
export default function AlgorithmViz() {
  // State
  const [param1, setParam1] = useState(defaultValue);
  const [data, setData] = useState<DataPoint[]>([]);
  const [isTraining, setIsTraining] = useState(false);

  // Refs
  const engineRef = useRef(new AlgorithmEngine());
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  // Data generation
  const regenerate = useCallback(() => {
    const newData = generateData();
    setData(newData);
    engineRef.current.reset();
  }, [dependencies]);

  // Canvas drawing
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    // ... drawing logic
  }, [data, param1]);

  // Animation loop
  const train = useCallback(() => {
    setIsTraining(true);
    const loop = () => {
      engineRef.current.step(data);
      draw();
      animRef.current = requestAnimationFrame(loop);
    };
    loop();
  }, [data, draw]);

  // Effects
  useEffect(() => regenerate(), [regenerate]);
  useEffect(() => {
    draw();
    window.addEventListener('resize', draw);
    return () => window.removeEventListener('resize', draw);
  }, [draw]);
  useEffect(() => () => cancelAnimationFrame(animRef.current), []);

  return (
    <LabLayout
      controls={<Slider ... />}
      visualization={<canvas ref={canvasRef} />}
      metrics={[...]}
      explanations={[...]}
    />
  );
}
```

---

## 📊 Algorithm Categories

### Machine Learning (7 algorithms)
1. Linear Regression
2. Polynomial Regression ⭐ NEW
3. Logistic Regression ⭐ NEW
4. K-Nearest Neighbors ⭐ NEW
5. K-Means Clustering
6. Decision Tree
7. PCA ⭐ NEW

### Deep Learning (4 algorithms)
8. Neural Network Playground
9. Activation Functions
10. CNN Visualizer
11. LSTM Visualizer
12. Transformer Attention

### Mathematics (1 algorithm)
13. Function Visualizer

### Optimization (1 algorithm)
14. Gradient Descent

### Statistics (1 algorithm)
15. Normal Distribution ⭐ NEW

**Total: 15 Algorithms**

---

## 🔧 Utility Modules

### Canvas Utilities (`src/lib/canvas.ts`)
```typescript
- drawGrid()           // Coordinate grid
- drawAxes()           // X and Y axes
- createCoordSystem()  // World ↔ Screen transformation
- clearCanvas()        // Clear with proper scaling
```

### Data Generation (`src/algorithms/datasets.ts`)
```typescript
- generateRegressionData()        // Linear data
- generateClassificationBlobs()   // 2-class clusters
- generateCircles()               // Circular pattern
- generateXOR()                   // XOR pattern
- generateSpiral()                // Spiral pattern
- generateClusteringData()        // K-cluster data
```

### Helpers (`src/lib/utils.ts`)
```typescript
- formatNumber()       // Format decimals
- randomSeed()         // Seeded random
- cn()                 // Class name merger
```

---

## 🎨 Styling System

### CSS Variables (Theme)
```css
--background: #...
--foreground: #...
--card: #...
--border: #...
--accent: #...
--muted: #...
```

### Component Styles
- Tailwind CSS utilities
- CSS modules (where needed)
- Responsive breakpoints (sm, md, lg, xl)

---

## 🚦 Routing Structure

```
/                           → Home page (hero + featured)
/explore                    → Browse all algorithms
/about                      → About the project
/simulations/[slug]         → Individual algorithm page
  ├─ /linear-regression
  ├─ /polynomial-regression    ⭐ NEW
  ├─ /logistic-regression      ⭐ NEW
  ├─ /knn                      ⭐ NEW
  ├─ /pca                      ⭐ NEW
  ├─ /normal-distribution      ⭐ NEW
  ├─ /k-means
  ├─ /decision-tree
  ├─ /neural-network-playground
  ├─ /activation-functions
  ├─ /gradient-descent
  ├─ /function-visualizer
  ├─ /cnn-visualizer
  ├─ /lstm-visualizer
  └─ /transformer-attention
```

---

## 📦 Dependencies Highlights

```json
{
  "next": "Latest",           // React framework
  "react": "Latest",          // UI library
  "typescript": "Latest",     // Type safety
  "tailwindcss": "Latest",    // Styling
  "lucide-react": "Latest",   // Icons
  "zustand": "Latest",        // State management
  "katex": "Latest"           // Math rendering
}
```

---

## 🎯 Build Process

```
Source Files (TypeScript/React)
      ↓
Next.js Compiler
      ↓
Optimized Bundle
      ↓
Static Assets + Server Components
      ↓
Production Build
```

---

## 📈 Performance Optimizations

1. **Canvas Rendering**
   - High-DPI support (devicePixelRatio)
   - RequestAnimationFrame for smooth 60fps
   - Memoized draw functions (useCallback)

2. **React Optimization**
   - useCallback for event handlers
   - useRef for non-reactive values
   - Proper dependency arrays

3. **Build Optimization**
   - Static generation for algorithm pages
   - Code splitting by route
   - Tree shaking unused code

---

## 🧪 Testing Strategy

### Manual Testing
- [ ] Visual inspection of each algorithm
- [ ] Interaction testing (sliders, buttons)
- [ ] Responsive design check
- [ ] Browser compatibility

### Automated Testing (Future)
- Unit tests for algorithms
- Integration tests for components
- E2E tests for user flows

---

## 🔮 Future Enhancements

### Potential Additions
- [ ] SVM visualization
- [ ] Random Forest
- [ ] Naive Bayes
- [ ] GANs
- [ ] Reinforcement Learning
- [ ] Time Series
- [ ] Confusion Matrix
- [ ] ROC Curves

### Feature Ideas
- [ ] Save/Load configurations
- [ ] Export visualizations as images
- [ ] Share algorithm settings via URL
- [ ] Code snippets for algorithms
- [ ] Tutorial mode with guided steps

---

## 📚 Learning Resources

Each algorithm includes:
- **Interactive controls** to adjust parameters
- **Real-time visualization** of the algorithm
- **Metrics display** showing key values
- **Explanations** with plain English + LaTeX
- **Step-by-step mode** (where applicable)

---

## 🎓 Code Style

### Conventions
- PascalCase for components
- camelCase for functions/variables
- kebab-case for file names
- Explicit return types on functions
- Descriptive variable names

### File Organization
- One component per file
- Co-locate related files
- Barrel exports for modules
- Consistent import ordering

---

This structure provides a solid foundation for an interactive ML learning platform! 🚀
