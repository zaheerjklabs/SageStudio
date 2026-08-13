# Quick Start Guide

## 🚀 What's New

### 5 New Algorithms Added
1. **Logistic Regression** - Binary classification with sigmoid curves
2. **K-Nearest Neighbors** - Interactive mouse-based classification
3. **Principal Component Analysis** - Dimensionality reduction visualization
4. **Normal Distribution** - Statistical bell curve explorer
5. **Polynomial Regression** - Curve fitting with adjustable complexity

### Better UI
- **Side-by-side layout**: Controls on left, visualization on right
- **Sticky visualization**: Stays in view while adjusting parameters
- **More intuitive workflow**: Change parameters → See results immediately

---

## 🎯 Running the Project

### Option 1: Development Mode
```powershell
# If you have execution policy issues, run this first:
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

# Then start the dev server
npm run dev
```

### Option 2: Using Node Directly
```powershell
node node_modules/next/dist/bin/next dev
```

### Option 3: Build and Start
```powershell
node node_modules/next/dist/bin/next build
node node_modules/next/dist/bin/next start
```

---

## 📍 Testing New Algorithms

### 1. Logistic Regression
**URL:** `http://localhost:3000/simulations/logistic-regression`

**What to Try:**
- Adjust learning rate to see convergence speed
- Change threshold to see classification boundary move
- Watch accuracy improve as model trains

**Key Feature:** Real-time sigmoid curve fitting

---

### 2. K-Nearest Neighbors (KNN)
**URL:** `http://localhost:3000/simulations/knn`

**What to Try:**
- **Move your mouse** over the visualization!
- Change K value to see more/fewer neighbors
- Watch decision boundary change with K
- See neighbor connections light up

**Key Feature:** Mouse-interactive classification

---

### 3. Principal Component Analysis (PCA)
**URL:** `http://localhost:3000/simulations/pca`

**What to Try:**
- Rotate the data to see PC vectors adjust
- Toggle projection lines on/off
- Increase spread to see variance explained change
- Watch principal components adapt

**Key Feature:** Live eigenvector visualization

---

### 4. Normal Distribution
**URL:** `http://localhost:3000/simulations/normal-distribution`

**What to Try:**
- Adjust mean to shift the curve
- Change standard deviation to widen/narrow
- Enable histogram to see samples overlay
- Generate new random samples

**Key Feature:** Sample histogram overlay on PDF

---

### 5. Polynomial Regression
**URL:** `http://localhost:3000/simulations/polynomial-regression`

**What to Try:**
- Start with degree 1 (linear)
- Increase to 3-4 (good fit)
- Try 5-6 to see overfitting
- Add noise to see model struggle

**Key Feature:** Visual demonstration of overfitting

---

## 🎨 UI Layout Highlights

### Before
```
┌─────────────────────────────┐
│    Visualization (top)      │
├─────────────────┬───────────┤
│   Controls      │  Metrics  │
└─────────────────┴───────────┘
```

### After (Side-by-Side)
```
┌──────────┬──────────────────┐
│ Controls │                  │
│          │   Visualization  │
│ Metrics  │    (sticky)      │
│          │                  │
└──────────┴──────────────────┘
```

**Benefits:**
- No more scrolling back and forth
- Visualization stays visible
- Better use of wide screens
- Professional ML tool aesthetic

---

## 📂 File Structure

### New Algorithm Implementations
```
src/algorithms/
├── classification/
│   ├── logistic-regression.ts  ← NEW
│   └── knn.ts                   ← NEW
├── dimensionality-reduction/
│   └── pca.ts                   ← NEW
├── regression/
│   └── polynomial-regression.ts ← NEW
└── statistics/
    └── normal-distribution.ts   ← NEW
```

### New Visualizations
```
src/visualizations/
├── machine-learning/
│   ├── LogisticRegressionViz.tsx  ← NEW
│   ├── KNNViz.tsx                  ← NEW
│   ├── PCAViz.tsx                  ← NEW
│   └── PolynomialRegressionViz.tsx ← NEW
└── statistics/
    └── NormalDistributionViz.tsx   ← NEW
```

### Updated Files
```
src/components/visualization/
└── LabLayout.tsx              ← MODIFIED (side-by-side)

src/data/
└── algorithms.ts              ← MODIFIED (added 5 algorithms)

src/app/simulations/[slug]/
└── page.tsx                   ← MODIFIED (added routes)
```

---

## 🔍 Key Features by Algorithm

### Logistic Regression
- ✓ Sigmoid activation visualization
- ✓ Decision threshold adjustment
- ✓ Log loss tracking
- ✓ Real-time accuracy metrics

### K-Nearest Neighbors
- ✓ Mouse-based query point
- ✓ Neighbor highlighting
- ✓ Distance visualization
- ✓ Vote counting display

### PCA
- ✓ Principal component vectors
- ✓ Variance explained calculation
- ✓ Projection line display
- ✓ Covariance visualization

### Normal Distribution
- ✓ Bell curve PDF
- ✓ Sample histogram overlay
- ✓ Standard deviation markers
- ✓ Box-Muller sampling

### Polynomial Regression
- ✓ Variable degree (1-6)
- ✓ Overfitting demonstration
- ✓ Coefficient learning
- ✓ MSE tracking

---

## 🎯 Testing Checklist

### Visual Tests
- [ ] Side-by-side layout renders correctly
- [ ] Visualization is sticky on scroll
- [ ] Controls are vertically stacked
- [ ] Metrics cards display properly
- [ ] Responsive on mobile (stacks vertically)

### Interaction Tests
- [ ] Sliders adjust parameters smoothly
- [ ] Run/Pause buttons work
- [ ] Reset button clears state
- [ ] Randomize generates new data
- [ ] KNN mouse tracking works

### Algorithm Tests
- [ ] Logistic regression converges
- [ ] KNN classifies correctly
- [ ] PCA finds principal components
- [ ] Normal distribution samples properly
- [ ] Polynomial regression fits curves

---

## 🐛 Troubleshooting

### PowerShell Execution Policy
If you see "running scripts is disabled":
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

### Build Errors
If TypeScript complains:
```powershell
# Clean and reinstall
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install
```

### Canvas Not Rendering
- Check browser console for errors
- Ensure canvas ref is properly set
- Verify useEffect dependencies

### Performance Issues
- Canvas renders at 60fps with requestAnimationFrame
- Training loops use proper cancellation
- useCallback memoizes expensive functions

---

## 📈 What's Improved

### User Experience
- ⚡ Faster workflow (no scrolling)
- 👁️ Better visibility (sticky viz)
- 🎯 Immediate feedback
- 🖱️ Interactive elements (KNN)

### Code Quality
- 📦 Modular algorithm implementations
- 🎨 Consistent component patterns
- 🧪 Reusable utilities
- 📝 Well-documented code

### Visual Design
- 🎨 Professional appearance
- 🌈 Consistent color schemes
- 📐 Square aspect ratios
- 💎 High-DPI support

---

## 🎓 Learning Path

### Beginner
1. Start with **Linear Regression**
2. Try **Logistic Regression**
3. Explore **Normal Distribution**

### Intermediate
4. Learn **KNN** (interactive!)
5. Understand **Polynomial Regression**
6. Study **PCA**

### Advanced
7. Dive into **Neural Network Playground**
8. Explore **Gradient Descent**
9. Master **Transformer Attention**

---

## 💡 Tips

1. **Adjust parameters slowly** to see gradual changes
2. **Use Reset often** to start fresh
3. **Try Randomize** to test different data
4. **Read explanations** below each visualization
5. **Experiment freely** - you can't break anything!

---

## 🚀 Next Steps

Want to add more algorithms?
1. Create algorithm logic in `src/algorithms/`
2. Create visualization in `src/visualizations/`
3. Add to `src/data/algorithms.ts`
4. Add route in `src/app/simulations/[slug]/page.tsx`
5. Follow the existing patterns!

---

## 📞 Support

If something doesn't work:
1. Check browser console for errors
2. Verify all files were created
3. Ensure imports are correct
4. Try clearing `.next` folder

---

## ✨ Summary

You now have:
- ✅ 5 new interactive algorithms
- ✅ Better side-by-side UI layout
- ✅ Professional ML visualization tool
- ✅ 15 total algorithms to explore
- ✅ Consistent, beautiful design

**Have fun learning! 🎉📊🤖**
