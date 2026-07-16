import { WidgetSize } from "../types/widgets";

/**
 * WidgetLayout describes the placement and layout flags for each widget.
 * - col: 0 | 1; Column index
 * - gridRowEnd: number; CSS Grid row end index
 * - gridRowStart: number; CSS Grid row start index
 * - size: WidgetSize; The size of the widget (short, tall, or very-tall)
 * - spansFullWidth: boolean; True if widget should span both columns
 * - spanToMatchTall?: boolean; True if this short widget should match height of a tall neighbor
 */
export interface WidgetLayout {
  col: 0 | 1;
  gridRowEnd: number;
  gridRowStart: number;
  size: WidgetSize;
  spansFullWidth: boolean;
  spanToMatchTall?: boolean;
}

export const sizeToRowSpan: Record<WidgetSize, number> = {
  "short": 1,
  "tall": 2,
  "very-tall": 3
};

/**
 * Computes layout information for all widgets.
 * 
 * Algorithm:
 * 1. Place each widget in the shortest column (simulating CSS Grid auto-placement)
 * 2. Determine which widgets should span full width (two columns)
 * 3. Determine which short widgets should match the height of adjacent tall widgets
 * 
 * @param widgetSizes - Array of widget sizes in display order
 * @returns Array of WidgetLayout objects describing layout information for each widget
 */
export const computeLayoutForAllWidgets = (widgetSizes: WidgetSize[]): WidgetLayout[] => {
  if (!widgetSizes.length) return [];

  const columnHeights = [0, 0];
  const placements: { size: WidgetSize; col: 0 | 1; gridRowStart: number; gridRowEnd: number }[] = [];

  // Phase 1: Simulate CSS Grid auto-placement
  widgetSizes.forEach(size => {
    const span = sizeToRowSpan[size];

    if (size === "very-tall") {
      // Very-tall widgets span both columns, forcing a new row
      const maxHeight = Math.max(...columnHeights);
      placements.push({ size, col: 0, gridRowStart: maxHeight, gridRowEnd: maxHeight + span });
      columnHeights[0] = columnHeights[1] = maxHeight + span;
    } else {
      // Short and tall widgets go in the shortest column
      const col = columnHeights[0] <= columnHeights[1] ? 0 : 1;
      const gridRowStart = columnHeights[col];
      placements.push({ size, col: col as 0 | 1, gridRowStart, gridRowEnd: gridRowStart + span });
      columnHeights[col] += span;
    }
  });

  // Initialize layout objects
  const layout: WidgetLayout[] = placements.map(placement => ({
    col: placement.col,
    gridRowEnd: placement.gridRowEnd,
    gridRowStart: placement.gridRowStart,
    size: placement.size,
    spansFullWidth: false
  }));

  // Phase 2: Determine layout modifiers based on neighbor relationships
  for (let i = 0; i < placements.length; i++) {
    const widget = placements[i];
    const oppositeCol = widget.col === 0 ? 1 : 0;

    // Find widgets in opposite column that overlap vertically (share a band)
    const neighbors = placements
      .map((other, j) => ({ other, j }))
      .filter(({ other, j }) =>
        j !== i &&
        other.col === oppositeCol &&
        other.gridRowStart < widget.gridRowEnd &&
        other.gridRowEnd > widget.gridRowStart
      );

    // Widgets span full width if very-tall OR if alone in their band
    const hasNeighbor = neighbors.length > 0;
    layout[i].spansFullWidth = widget.size === "very-tall" || !hasNeighbor;

    // Special case: tall widget with exactly one short neighbor
    // The short widget should expand to match the tall widget's height
    if (widget.size === "tall") {
      const shortNeighbors = neighbors.filter(({ other }) => other.size === "short");
      const isOnlyNeighborShort = shortNeighbors.length === 1 && neighbors.length === 1;
      
      if (isOnlyNeighborShort) {
        const shortIndex = shortNeighbors[0].j;
        layout[shortIndex].spanToMatchTall = true;
      }
    }
  }

  return layout;
};
