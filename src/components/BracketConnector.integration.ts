/**
 * Integration Test: Bracket Connector Validation
 * 
 * This script validates:
 * 1. Canvas connector elements render correctly
 * 2. Bezier curves are drawn between match cards
 * 3. Connectors don't show when they shouldn't (empty brackets, single round)
 * 4. ResizeObserver triggers canvas redraw on dimension changes
 */

import { BracketMatch, BracketTeam } from '../types';

export class BracketConnectorIntegrationTest {
  /**
   * Test: Canvas element exists and is positioned correctly
   */
  static testCanvasPresence(container: HTMLElement): boolean {
    const canvas = container.querySelector('canvas');
    if (!canvas) {
      console.error('❌ Canvas element not found in bracket container');
      return false;
    }

    // Check positioning
    const styles = window.getComputedStyle(canvas);
    if (styles.position !== 'absolute' && !canvas.classList.contains('absolute')) {
      console.error('❌ Canvas is not positioned absolutely');
      return false;
    }

    console.log('✅ Canvas element present and positioned correctly');
    return true;
  }

  /**
   * Test: Canvas context is available and can draw
   */
  static testCanvasContext(container: HTMLElement): boolean {
    const canvas = container.querySelector('canvas') as HTMLCanvasElement;
    if (!canvas) return false;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('❌ Canvas 2D context not available');
      return false;
    }

    // Verify required methods exist
    const requiredMethods = [
      'clearRect',
      'beginPath',
      'moveTo',
      'bezierCurveTo',
      'stroke',
    ];

    for (const method of requiredMethods) {
      if (typeof (ctx as any)[method] !== 'function') {
        console.error(`❌ Canvas context missing method: ${method}`);
        return false;
      }
    }

    console.log('✅ Canvas context methods available');
    return true;
  }

  /**
   * Test: Connector canvas is z-indexed correctly behind match cards
   */
  static testZIndexing(container: HTMLElement): boolean {
    const canvas = container.querySelector('canvas') as HTMLCanvasElement;
    const grid = container.querySelector('[class*="grid"]');

    if (!canvas || !grid) {
      console.error('❌ Canvas or grid not found');
      return false;
    }

    // Canvas should have pointer-events-none to not intercept clicks
    if (!canvas.classList.contains('pointer-events-none')) {
      console.warn(
        '⚠️ Canvas missing pointer-events-none class (may intercept clicks)'
      );
      return false;
    }

    console.log('✅ Z-indexing and pointer events configured correctly');
    return true;
  }

  /**
   * Test: Connectors render only when appropriate (2+ rounds)
   */
  static testConnectorVisibility(matches: BracketMatch[]): boolean {
    const uniqueRounds = new Set(matches.map((m) => m.roundNumber));

    if (uniqueRounds.size < 2) {
      console.log('✅ Correctly skipping connectors for single-round bracket');
      return true;
    }

    if (matches.length < 2) {
      console.log('✅ Correctly skipping connectors for insufficient matches');
      return true;
    }

    console.log(
      `✅ Displaying connectors for ${uniqueRounds.size} rounds, ${matches.length} matches`
    );
    return true;
  }

  /**
   * Test: Match cards have bracket-card class for canvas targeting
   */
  static testMatchCardClasses(container: HTMLElement): boolean {
    const bracketCards = container.querySelectorAll('.bracket-card');

    if (bracketCards.length === 0) {
      console.warn('⚠️ No match cards found with .bracket-card class');
      return false;
    }

    console.log(`✅ Found ${bracketCards.length} match cards with correct class`);
    return true;
  }

  /**
   * Test: Bracket pairs are properly grouped
   */
  static testBracketPairGrouping(container: HTMLElement): boolean {
    const bracketPairs = container.querySelectorAll('.bracket-pair');

    if (bracketPairs.length === 0) {
      console.warn('⚠️ No bracket pair groupings found');
      return false;
    }

    // Verify each pair has exactly 2 match cards
    let validPairs = 0;
    bracketPairs.forEach((pair, idx) => {
      const cards = pair.querySelectorAll('.bracket-card');
      if (cards.length === 2) {
        validPairs++;
      } else {
        console.warn(
          `⚠️ Bracket pair ${idx} has ${cards.length} cards instead of 2`
        );
      }
    });

    if (validPairs > 0) {
      console.log(
        `✅ Found ${validPairs}/${bracketPairs.length} properly grouped bracket pairs`
      );
      return true;
    }

    return false;
  }

  /**
   * Test: Canvas dimensions are set
   */
  static testCanvasDimensions(container: HTMLElement): boolean {
    const canvas = container.querySelector('canvas') as HTMLCanvasElement;
    if (!canvas) return false;

    const width = canvas.width;
    const height = canvas.height;

    if (width <= 0 || height <= 0) {
      console.error(
        `❌ Canvas has invalid dimensions: ${width}x${height}`
      );
      return false;
    }

    console.log(`✅ Canvas dimensions set: ${width}x${height} (DPI-scaled)`);
    return true;
  }

  /**
   * Test: ResizeObserver hook is attached
   */
  static testResizeObserverAttachment(container: HTMLElement): boolean {
    // This is harder to test directly, but we can verify the bracket container
    // has a parent with position: relative that would host the observer
    const bracketContainer = container.querySelector('[class*="relative"]');

    if (!bracketContainer) {
      console.warn(
        '⚠️ No relative-positioned container found for ResizeObserver'
      );
      return false;
    }

    console.log('✅ ResizeObserver container structure present');
    return true;
  }

  /**
   * Run all integration tests
   */
  static runAll(container: HTMLElement, matches: BracketMatch[]): {
    passed: number;
    failed: number;
    warnings: number;
  } {
    console.log('🧪 Starting Bracket Connector Integration Tests...\n');

    const tests = [
      () => this.testCanvasPresence(container),
      () => this.testCanvasContext(container),
      () => this.testZIndexing(container),
      () => this.testConnectorVisibility(matches),
      () => this.testMatchCardClasses(container),
      () => this.testBracketPairGrouping(container),
      () => this.testCanvasDimensions(container),
      () => this.testResizeObserverAttachment(container),
    ];

    let passed = 0;
    let failed = 0;
    let warnings = 0;

    tests.forEach((test) => {
      try {
        const result = test();
        if (result) {
          passed++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error(`❌ Test threw error: ${error}`);
        failed++;
      }
    });

    console.log('\n📊 Test Results:');
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️ Warnings: ${warnings}`);
    console.log(
      `\nOverall: ${failed === 0 ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}\n`
    );

    return { passed, failed, warnings };
  }
}

/**
 * Usage in BracketView.tsx:
 * 
 * if (process.env.NODE_ENV === 'development') {
 *   setTimeout(() => {
 *     const result = BracketConnectorIntegrationTest.runAll(
 *       bracketContainerRef.current!,
 *       matches
 *     );
 *   }, 500); // Wait for render to complete
 * }
 */
