// Color and dash-style palette used by chart.tsx and legend.tsx. Kept in a
// shared helper so the two always agree on which style corresponds to which
// active-column position.
//
// Colors come from the color swatch in this Zeplin design:
// https://app.zeplin.io/project/5e4baae7fb685faac9bf4a0a/screen/68bb06fadbce4439b6cbcb60

const COLORS = [
  "#B03EFF",
  "#0068EA",
  "#01A762",
  "#FA6400",
  "#FF0801",
  "#803E75",
  "#666666",
  "#C10020",
  "#53377A",
  "#000000",
];

const DASH_STYLES: number[][] = [
  [],                    // 1. Solid
  [5, 5],                // 2. Standard Dash
  [2, 2],                // 3. Fine Dots
  [10, 5],               // 4. Long Dash
  [10, 3, 2, 3],         // 5. Dash-Dot
  [15, 3, 3, 3, 3, 3],   // 6. Long Dash, Two Dots
  [1, 4],                // 7. Sparse Dots
  [8, 2, 8, 2],          // 8. Thick Dashes, Tight Gaps
  [4, 1, 1, 1],          // 9. Short Dash, Dot
  [10, 10, 2, 2],        // 10. Wide Dash, Fine Dot
];

export interface IColumnStyle {
  color: string;
  borderDash: number[];
}

export const columnStyle = (index: number): IColumnStyle => {
  if (!Number.isFinite(index) || index < 0) {
    return { color: COLORS[0], borderDash: DASH_STYLES[0] };
  }
  const i = Math.floor(index);
  return {
    color: COLORS[i % COLORS.length],
    borderDash: DASH_STYLES[i % DASH_STYLES.length],
  };
};
