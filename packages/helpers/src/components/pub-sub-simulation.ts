export type BuiltInGeneratorId = "sine" | "random" | "increment" | "constant";

export interface IColumnConfig {
  name: string;
  generator: string;
  start?: number;
  step?: number;
  // sine params
  min?: number;
  max?: number;
  period?: number;
  phase?: number;
  // increment params
  delta?: number;
  // constant params
  value?: number;
}

export interface ICustomGenerator {
  name: string;
  fn: (tickIndex: number, previousValue: number | null) => number | null;
}

export interface PubSubSimulationConfig {
  columns: IColumnConfig[];
  tickRate: number;
  customGenerators?: Record<string, ICustomGenerator>;
}

const sineGenerator = (col: IColumnConfig, tickIndex: number): number => {
  const min = col.min ?? 0;
  const max = col.max ?? 1;
  const period = col.period ?? 20;
  const phase = col.phase ?? 0;
  return min + (max - min) * (Math.sin(2 * Math.PI * tickIndex / period + phase) + 1) / 2;
};

const randomGenerator = (col: IColumnConfig): number => {
  const min = col.min ?? 0;
  const max = col.max ?? 1;
  return min + Math.random() * (max - min);
};

const incrementGenerator = (col: IColumnConfig, tickIndex: number): number => {
  const start = col.start ?? 0;
  const delta = col.delta ?? 1;
  const step = col.step ?? 1;
  return start + delta * Math.floor(tickIndex / step);
};

const constantGenerator = (col: IColumnConfig): number => {
  return col.value ?? 0;
};

export interface IGeneratorState {
  runGenerator: (col: IColumnConfig, tickIndex: number, customGenerators?: Record<string, ICustomGenerator>) => number | null;
  resetEmittedValues: () => void;
  flushNonNumericWarnings: () => void;
}

export const createGeneratorState = (): IGeneratorState => {
  const lastEmittedValues = new Map<string, number | null>();
  const nonNumericColumns = new Set<string>();

  const resetEmittedValues = () => {
    if (nonNumericColumns.size > 0) {
      console.error(
        "[pub-sub-simulation] Non-numeric custom generator output during recording for columns:",
        Array.from(nonNumericColumns)
      );
    }
    lastEmittedValues.clear();
    nonNumericColumns.clear();
  };

  const flushNonNumericWarnings = () => {
    if (nonNumericColumns.size > 0) {
      console.error(
        "[pub-sub-simulation] Non-numeric custom generator output during recording for columns:",
        Array.from(nonNumericColumns)
      );
      nonNumericColumns.clear();
    }
  };

  const runGenerator = (
    col: IColumnConfig,
    tickIndex: number,
    customGenerators?: Record<string, ICustomGenerator>
  ): number | null => {
    const colName = col.name;
    const step = col.step ?? 1;

    if (tickIndex === 0 && col.start !== undefined && col.generator !== "increment") {
      const startVal = col.start;
      lastEmittedValues.set(colName, startVal);
      return startVal;
    }

    if (
      step > 1 &&
      col.generator !== "sine" &&
      col.generator !== "constant" &&
      tickIndex % step !== 0
    ) {
      return lastEmittedValues.get(colName) ?? null;
    }

    let result: number | null;
    switch (col.generator) {
      case "sine":
        result = sineGenerator(col, tickIndex);
        break;
      case "random":
        result = randomGenerator(col);
        break;
      case "increment":
        result = incrementGenerator(col, tickIndex);
        break;
      case "constant":
        result = constantGenerator(col);
        break;
      default: {
        const custom = customGenerators?.[col.generator];
        if (!custom) {
          console.warn(`[pub-sub-simulation] Unknown generator "${col.generator}" for column "${colName}"; falling back to constant: 0.`);
          result = 0;
          break;
        }
        const prev = lastEmittedValues.get(colName) ?? null;
        const rawResult = custom.fn(tickIndex, prev);
        if (typeof rawResult === "number" && Number.isFinite(rawResult)) {
          result = rawResult;
        } else if (typeof rawResult === "string") {
          const parsed = parseFloat(rawResult as any);
          if (Number.isFinite(parsed)) {
            result = parsed;
          } else {
            nonNumericColumns.add(colName);
            result = null;
          }
        } else {
          result = null;
        }
        break;
      }
    }

    lastEmittedValues.set(colName, result);
    return result;
  };

  return { runGenerator, resetEmittedValues, flushNonNumericWarnings };
};
