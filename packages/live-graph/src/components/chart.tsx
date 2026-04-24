import React, { useEffect, useRef } from "react";
import { Line } from "react-chartjs-2";
import {
  CategoryScale,
  Chart as ChartJS,
  ChartData,
  ChartOptions,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  ScaleOptions,
  Title,
  Tooltip,
} from "chart.js";
import { columnStyle } from "./column-style";
import { IActiveColumn } from "./use-live-stream";
import { IAuthoredState } from "./types";

ChartJS.register(
  CategoryScale,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

ChartJS.defaults.font.family = "'Lato', sans-serif";
ChartJS.defaults.color = "#3f3f3f";

export interface IChartProps {
  authoredState: IAuthoredState;
  composedTitle?: string;
  activeColumns: IActiveColumn[];
  cols: string[];
  rows: (number | null)[][];
  updatedAt: number;
  recordingEpoch: number;
  visibility?: Record<string, boolean>;
  onXAxisCompressed?: () => void;
}

interface IAxisBounds {
  xMin: number;
  xMax: number;
  maxFiniteX: number | null;
}

export const computeAxisBounds = (
  rows: (number | null)[][],
  xAxisColIndex: number | null,
  authoredXAxisMax: number | undefined
): IAxisBounds => {
  const emptyFallback = (): IAxisBounds => {
    const low = 0;
    const high = authoredXAxisMax ?? 1;
    return { xMin: low, xMax: high > low ? high : low + 1, maxFiniteX: null };
  };

  if (rows.length === 0) {
    return emptyFallback();
  }

  if (xAxisColIndex !== null) {
    const finiteXs: number[] = [];
    for (const row of rows) {
      const v = row[xAxisColIndex];
      if (typeof v === "number" && Number.isFinite(v)) {
        finiteXs.push(v);
      }
    }
    if (finiteXs.length === 0) {
      return emptyFallback();
    }
    let lo = Infinity;
    let maxFinite = -Infinity;
    for (const v of finiteXs) {
      if (v < lo) { lo = v; }
      if (v > maxFinite) { maxFinite = v; }
    }
    let hi = authoredXAxisMax !== undefined
      ? Math.max(authoredXAxisMax, maxFinite)
      : maxFinite;
    if (hi <= lo) {
      hi = lo + 1;
    }
    return { xMin: lo, xMax: hi, maxFiniteX: maxFinite };
  }

  const lastIdx = rows.length - 1;
  let rowHi = authoredXAxisMax !== undefined
    ? Math.max(authoredXAxisMax, lastIdx)
    : lastIdx;
  if (rowHi <= 0) {
    rowHi = 1;
  }
  return { xMin: 0, xMax: rowHi, maxFiniteX: lastIdx };
};

// rAF coalescing is handled by Runtime, which passes an already-coalesced
// updatedAt value. React.memo ensures Chart only re-renders when the coalesced
// value (or other props like visibility/activeColumns) actually change.
const ChartInner: React.FC<IChartProps> = ({
  authoredState,
  composedTitle,
  activeColumns,
  cols,
  rows,
  updatedAt,
  recordingEpoch,
  visibility,
  onXAxisCompressed,
}) => {
  const xAxisColumn = authoredState.xAxisColumn?.trim();
  const xAxisColIndex = xAxisColumn ? cols.indexOf(xAxisColumn) : -1;
  const hasXCol = !!xAxisColumn && xAxisColIndex >= 0;
  const { xMin, xMax, maxFiniteX } = computeAxisBounds(
    rows,
    hasXCol ? xAxisColIndex : null,
    authoredState.xAxisMax
  );

  // Auto-compress transition detector. Fires once per false → true flip; resets
  // on each new recording-started (tracked via recordingEpoch).
  const hasExceededRef = useRef(false);
  const lastEpochRef = useRef(recordingEpoch);
  useEffect(() => {
    if (lastEpochRef.current !== recordingEpoch) {
      hasExceededRef.current = false;
      lastEpochRef.current = recordingEpoch;
    }
    if (
      authoredState.xAxisMax !== undefined &&
      maxFiniteX !== null &&
      Number.isFinite(maxFiniteX) &&
      maxFiniteX > authoredState.xAxisMax &&
      !hasExceededRef.current
    ) {
      hasExceededRef.current = true;
      onXAxisCompressed?.();
    }
  }, [updatedAt, recordingEpoch, maxFiniteX, authoredState.xAxisMax, onXAxisCompressed]);

  const datasets = activeColumns.map((col, i) => {
    const colIdx = cols.indexOf(col.column);
    const { color, borderDash } = columnStyle(i);
    const hidden = visibility ? visibility[col.column] === false : false;
    if (hasXCol) {
      const points: { x: number; y: number | null }[] = [];
      for (const row of rows) {
        const x = row[xAxisColIndex];
        if (typeof x === "number" && Number.isFinite(x)) {
          const y = colIdx >= 0 ? row[colIdx] : null;
          points.push({ x, y });
        }
      }
      return {
        label: col.label,
        data: points,
        borderColor: color,
        backgroundColor: color,
        borderDash,
        borderWidth: 1.5,
        pointRadius: 0,
        hidden,
      };
    }
    return {
      label: col.label,
      data: rows.map(row => (colIdx >= 0 ? row[colIdx] : null)),
      borderColor: color,
      backgroundColor: color,
      borderDash,
      borderWidth: 1.5,
      pointRadius: 0,
      hidden,
    };
  });

  const labels = hasXCol
    ? undefined
    : rows.map((_, idx) => String(idx));

  const titleFont = { size: 16, weight: "normal" as const };
  const labelFont = { size: 14, weight: "normal" as const };
  const tickFont = { size: 12 };

  const yAxisOptions: ScaleOptions<"linear"> = {
    title: {
      display: !!authoredState.yAxisLabel,
      text: authoredState.yAxisLabel,
      font: labelFont,
    },
    ticks: { font: tickFont },
    ...(authoredState.yAxisRangeMode === "fixed" && {
      ...(typeof authoredState.yMin === "number" && { min: authoredState.yMin }),
      ...(typeof authoredState.yMax === "number" && { max: authoredState.yMax }),
    }),
  };

  const xAxisTitle = {
    display: !!authoredState.xAxisLabel,
    text: authoredState.xAxisLabel,
    font: labelFont,
  };

  // Chart.js 3.x scale types are a complex discriminated union that doesn't
  // narrow well when the scale type is chosen at runtime. Build each variant
  // separately with its own partial type so the compiler validates the option
  // shapes while accepting the runtime branch.
  const xScaleOptions: ScaleOptions<"linear"> | ScaleOptions<"category"> = hasXCol
    ? { type: "linear" as const, min: xMin, max: xMax, title: xAxisTitle, ticks: { font: tickFont } }
    : rows.length > 0
      ? { type: "category" as const, min: String(xMin), max: String(xMax), title: xAxisTitle, ticks: { font: tickFont } }
      : { type: "category" as const, title: xAxisTitle, ticks: { font: tickFont } };

  const options: ChartOptions<"line"> = {
    animation: false,
    responsive: true,
    maintainAspectRatio: false,
    parsing: hasXCol ? false : undefined,
    plugins: {
      title: {
        display: !!composedTitle,
        text: composedTitle,
        align: authoredState.chartTitleAlignment ?? "center",
        font: titleFont,
        padding: { bottom: 12 },
      },
      legend: {
        display: false,
      },
    },
    scales: {
      x: xScaleOptions as ScaleOptions<"linear">,
      y: yAxisOptions,
    },
  };

  // Chart.js renders null y-values as gaps, but ScatterDataPoint types y as
  // non-nullable. Cast datasets to satisfy ChartData while preserving null gaps.
  const data: ChartData<"line"> = { labels, datasets: datasets as ChartData<"line">["datasets"] };
  return <Line data={data} options={options} />;
};

export const Chart = React.memo(ChartInner);
