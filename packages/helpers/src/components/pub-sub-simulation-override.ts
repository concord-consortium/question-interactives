import { IColumnConfig, PubSubSimulationConfig } from "./pub-sub-simulation";

const DEFAULT_TICK_RATE = 250;
const STORAGE_PREFIX = "pub-sub-sim:";

export const loadOverride = (
  url: string,
  passedIn: PubSubSimulationConfig
): PubSubSimulationConfig => {
  const key = STORAGE_PREFIX + url;
  const raw = localStorage.getItem(key);
  if (!raw) {
    return sanitizeTickRate(passedIn);
  }
  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.warn(`[pub-sub-simulation] Malformed localStorage entry for "${key}" — deleted, using passed-in config.`);
    localStorage.removeItem(key);
    return sanitizeTickRate(passedIn);
  }
  const columns: IColumnConfig[] = Array.isArray(parsed.columns) ? parsed.columns : passedIn.columns;
  const tickRate = typeof parsed.tickRate === "number" ? parsed.tickRate : passedIn.tickRate;

  // Validate each column's generator — unknown slugs fall back to constant: 0
  const customGenerators = passedIn.customGenerators ?? {};
  const builtIns = new Set(["sine", "random", "increment", "constant"]);
  const sanitizedColumns = columns.map((col: IColumnConfig) => {
    if (!builtIns.has(col.generator) && !customGenerators[col.generator]) {
      console.warn(`[pub-sub-simulation] Unknown generator "${col.generator}" for column "${col.name}"; falling back to constant: 0.`);
      return { ...col, generator: "constant", value: 0 };
    }
    return col;
  });

  return sanitizeTickRate({
    columns: sanitizedColumns,
    tickRate,
    customGenerators: passedIn.customGenerators,
  });
};

export const saveOverride = (url: string, config: { columns: IColumnConfig[]; tickRate: number }) => {
  localStorage.setItem(STORAGE_PREFIX + url, JSON.stringify({ columns: config.columns, tickRate: config.tickRate }));
};

export const clearOverride = (url: string) => {
  localStorage.removeItem(STORAGE_PREFIX + url);
};

export const hasOverride = (
  effective: PubSubSimulationConfig,
  passedIn: PubSubSimulationConfig
): boolean => {
  if (effective.tickRate !== passedIn.tickRate) {
    return true;
  }
  return JSON.stringify(effective.columns) !== JSON.stringify(passedIn.columns);
};

const sanitizeTickRate = (config: PubSubSimulationConfig): PubSubSimulationConfig => {
  if (Number.isFinite(config.tickRate) && config.tickRate > 0) {
    return config;
  }
  console.warn(
    `[pub-sub-simulation] Invalid tickRate (${config.tickRate}); defaulting to ${DEFAULT_TICK_RATE}ms.`
  );
  return { ...config, tickRate: DEFAULT_TICK_RATE };
};
