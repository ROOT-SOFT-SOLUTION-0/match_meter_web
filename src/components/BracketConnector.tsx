import React, { useEffect, useRef } from 'react';

interface BracketConnectorProps {
  containerWidth: number;
  containerHeight: number;
}

/**
 * BracketConnector renders canvas-based smooth bezier curve connections
 * between bracket match cards, similar to tournament diagrams.
 */
export const BracketConnector: React.FC<BracketConnectorProps> = ({
  containerWidth,
  containerHeight,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) {
      console.warn('⚠️ Canvas ref not available');
      return;
    }

    if (containerWidth <= 0 || containerHeight <= 0) {
      console.warn(`⚠️ Invalid canvas dimensions: ${containerWidth}x${containerHeight}`);
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      console.error('❌ Failed to get canvas 2D context');
      return;
    }

    // Handle DPI scaling for crisp rendering
    const dpr = window.devicePixelRatio || 1;
    canvas.width = containerWidth * dpr;
    canvas.height = containerHeight * dpr;

    // Scale context to handle DPI
    ctx.scale(dpr, dpr);

    // Clear canvas
    ctx.clearRect(0, 0, containerWidth, containerHeight);

    console.log(`🎨 Rendering canvas: ${containerWidth}x${containerHeight} (DPI: ${dpr})`);

    // Get all bracket pairs and cards
    const bracketColumns = document.querySelectorAll('.bracket-column');

    if (bracketColumns.length < 2) {
      console.log(`⚠️ Only ${bracketColumns.length} column(s) found, need at least 2 for connectors`);
      return;
    }

    // Draw connections between each column
    Array.from(bracketColumns).forEach((column, colIndex) => {
      if (colIndex === bracketColumns.length - 1) return; // Skip final column

      const nextColumn = bracketColumns[colIndex + 1];
      const pairs = Array.from(column.querySelectorAll('.bracket-pair'));
      const nextPairs = Array.from(nextColumn.querySelectorAll('.bracket-pair'));

      console.log(`Round ${colIndex}: ${pairs.length} pairs, next round: ${nextPairs.length} pairs`);

      pairs.forEach((pair, pairIndex) => {
        const cards = pair.querySelectorAll('.bracket-card');
        if (cards.length === 0) return;

        // Get the first and second card positions
        const firstCard = cards[0] as HTMLElement;
        const secondCard = cards[cards.length - 1] as HTMLElement;

        if (!firstCard || !secondCard) return;

        const firstRect = firstCard.getBoundingClientRect();
        const secondRect = secondCard.getBoundingClientRect();
        const containerRect = canvasRef.current?.parentElement?.getBoundingClientRect();

        if (!containerRect) return;

        // Calculate positions relative to canvas container
        const firstMidY = firstRect.top - containerRect.top + firstRect.height / 2;
        const secondMidY = secondRect.top - containerRect.top + secondRect.height / 2;
        const midpointY = (firstMidY + secondMidY) / 2;

        // Start from right edge of current card
        const startX = firstRect.right - containerRect.left;
        
        // Determine which match in next round this bracket-pair connects to
        const nextPairIndex = Math.floor(pairIndex / 2);
        const matchIndexInNextPair = pairIndex % 2;
        const nextPair = nextPairs[nextPairIndex];
        let endX = startX + 40; // Default gap

        if (nextPair) {
          const nextCards = nextPair.querySelectorAll('.bracket-card');
          if (nextCards.length > matchIndexInNextPair) {
            const nextCard = nextCards[matchIndexInNextPair] as HTMLElement;
            const nextRect = nextCard.getBoundingClientRect();
            const nextStartX = nextRect.left - containerRect.left;
            // Gap is between cards, scaled proportionally
            endX = startX + (nextStartX - startX) * 0.35;
          }
        }

        // Draw connection with cubic bezier for smooth curves
        ctx.strokeStyle = 'rgba(200, 80, 80, 0.45)';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // First card to midpoint
        const gapX = endX - startX;
        const cp1X = startX + gapX * 0.4;
        const cp2X = endX - gapX * 0.4;

        ctx.beginPath();
        ctx.moveTo(startX, firstMidY);
        ctx.bezierCurveTo(cp1X, firstMidY, cp2X, midpointY, endX, midpointY);
        ctx.stroke();

        // Second card to midpoint
        ctx.beginPath();
        ctx.moveTo(startX, secondMidY);
        ctx.bezierCurveTo(cp1X, secondMidY, cp2X, midpointY, endX, midpointY);
        ctx.stroke();

        // Connect midpoint to the correct match in next round
        if (nextPair) {
          const nextCards = nextPair.querySelectorAll('.bracket-card');
          
          // Connect to the specific match that corresponds to this bracket-pair
          if (nextCards.length > matchIndexInNextPair) {
            const nextCard = nextCards[matchIndexInNextPair] as HTMLElement;
            const nextRect = nextCard.getBoundingClientRect();
            const nextMidY = nextRect.top - containerRect.top + nextRect.height / 2;
            const nextStartX = nextRect.left - containerRect.left;

            const nextGapX = nextStartX - endX;
            const nextCp1X = endX + nextGapX * 0.4;
            const nextCp2X = nextStartX - nextGapX * 0.4;

            ctx.beginPath();
            ctx.moveTo(endX, midpointY);
            ctx.bezierCurveTo(nextCp1X, midpointY, nextCp2X, nextMidY, nextStartX, nextMidY);
            ctx.stroke();

            console.log(
              `Connecting pair ${pairIndex} -> pair ${nextPairIndex} match ${matchIndexInNextPair}`
            );
          }
        }
      });
    });

    console.log(`✅ Connectors drawn for ${bracketColumns.length} columns`);
  }, [containerWidth, containerHeight]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ width: '100%', height: '100%' }}
    />
  );
};
