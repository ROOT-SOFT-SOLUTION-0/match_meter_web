# Bracket Connector Testing Guide

This directory contains comprehensive tests for the BracketConnector component and its integration with BracketView.

## Test Files

### 1. **BracketConnector.test.tsx** (Unit Tests)
Tests the BracketConnector component in isolation.

**What it tests:**
- ✅ Component renders without crashing
- ✅ Canvas element is created
- ✅ Canvas dimensions are set correctly
- ✅ Connector rendering skipped for single-column brackets
- ✅ Canvas is non-interactive (pointer-events-none)
- ✅ Canvas positioning (absolute + inset-0)
- ✅ Component updates on dimension changes

**Run:**
```bash
npm test -- BracketConnector.test.tsx
```

---

### 2. **BracketView.test.tsx** (Integration Tests)
Tests BracketView with BracketConnector integration.

**What it tests:**
- ✅ Bracket renders with connector canvas overlay
- ✅ Matches are grouped in bracket pairs
- ✅ Canvas connector element exists
- ✅ Z-index layering is correct
- ✅ Modals don't show initially
- ✅ Team names display in match cards
- ✅ Canvas dimensions are set on mount

**Run:**
```bash
npm test -- BracketView.test.tsx
```

---

### 3. **BracketConnector.integration.ts** (Runtime Integration Tests)
Validates connector functionality during development via console logs.

**What it tests:**
- ✅ Canvas element present and positioned absolutely
- ✅ Canvas 2D context available with required methods
- ✅ Z-indexing and pointer events configured
- ✅ Connectors render only when appropriate (2+ rounds)
- ✅ Match cards have .bracket-card class
- ✅ Bracket pairs properly grouped
- ✅ Canvas dimensions are set (DPI-scaled)
- ✅ ResizeObserver container structure present

**Automatic Run:**
Automatically runs in development when bracket loads (see console).

**Manual Run (in browser console):**
```javascript
// After bracket loads
BracketConnectorIntegrationTest.runAll(document.querySelector('[class*="bracket"]'), matchesArray);
```

---

## How to Run All Tests

### Run All Unit/Integration Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm test -- --watch
```

### Run Specific Test Suite
```bash
npm test -- BracketConnector.test.tsx
npm test -- BracketView.test.tsx
```

### Run Tests with Coverage
```bash
npm test -- --coverage BracketConnector BracketView
```

---

## Development Integration

The integration tests automatically run in **development mode only** when:
1. A bracket is loaded successfully
2. The component references exist
3. After a 500ms delay (to ensure render completes)

**Output appears in browser console:**
```
🧪 Starting Bracket Connector Integration Tests...

✅ Canvas element present and positioned correctly
✅ Canvas context methods available
✅ Z-indexing and pointer events configured correctly
✅ Displaying connectors for 2 rounds, 4 matches
✅ Found 4 match cards with correct class
✅ Found 2/2 properly grouped bracket pairs
✅ Canvas dimensions set: 1200x800 (DPI-scaled)
✅ ResizeObserver container structure present

📊 Test Results:
✅ Passed: 8
❌ Failed: 0
⚠️ Warnings: 0

Overall: ✅ ALL TESTS PASSED
```

---

## Debugging Connector Issues

### If connectors don't show:
1. **Check console logs** - Look for test output and errors
2. **Verify canvas exists** - Open DevTools, find `<canvas>` in DOM
3. **Check bracket rounds** - Need 2+ rounds for connectors to render
4. **Verify match cards** - Look for `.bracket-card` class on match elements
5. **Check dimensions** - Canvas dimensions should match container size

### Example Debug Steps:
```javascript
// In console, after bracket loads:

// 1. Check canvas exists
document.querySelector('canvas') // Should return canvas element

// 2. Check context
document.querySelector('canvas').getContext('2d') // Should return context

// 3. Check match cards
document.querySelectorAll('.bracket-card').length // Should be > 0

// 4. Check bracket pairs
document.querySelectorAll('.bracket-pair').length // Should be > 0

// 5. Run full integration test
BracketConnectorIntegrationTest.runAll(
  document.querySelector('[class*="relative"]'),
  window.__bracketMatches // if available
);
```

---

## Test Results Interpretation

### ✅ Passed Tests
All systems working correctly. Connectors should display smoothly.

### ❌ Failed Tests
Check the specific test output message for remediation steps.

### ⚠️ Warnings
Non-critical issues. Connectors may still work but could have visual quirks.

---

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Canvas not visible | Canvas has `display: none` or wrong positioning | Check CSS classes applied to canvas |
| No connector lines shown | Bracket has < 2 rounds | Create multi-round bracket to test |
| Lines not smooth | Canvas context not scaling for DPI | Verify `ctx.scale(dpr, dpr)` is called |
| Connector lines overlapping matches | Z-index issue | Check `pointer-events-none` class |
| Canvas resizes but doesn't redraw | ResizeObserver not attached | Check browser DevTools, run integration test |

---

## Files Modified

- `BracketConnector.tsx` - Main connector component
- `BracketView.tsx` - Integrated tests runner
- `src/index.css` - CSS connector lines disabled (canvas handles it now)

---

## Next Steps

After confirming all tests pass:
1. ✅ **Production Build** - Run `npm run build` and verify bundle includes all components
2. ✅ **Visual Regression Test** - Compare bracket styling with designer mockups
3. ✅ **Performance Test** - Test with large brackets (16+ rounds) to verify canvas performance
4. ✅ **Cross-browser Test** - Verify rendering in Chrome, Firefox, Safari, Edge

---

**Created**: 2026-04-05  
**Last Updated**: 2026-04-05
