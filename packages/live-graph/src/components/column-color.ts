// Color palette used by both chart.tsx and legend.tsx. Kept in a shared helper so
// the two always agree on which color corresponds to which active-column position.
// Values come from the color swatch in this Zeplin design:
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

export const columnColor = (index: number): string => {
  if (!Number.isFinite(index) || index < 0) {
    return COLORS[0];
  }
  return COLORS[Math.floor(index) % COLORS.length];
};











