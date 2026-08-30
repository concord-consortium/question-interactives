const clampPrecision = (precision: number | undefined | null, def: number): number => {
  const p = typeof precision === "number" && Number.isFinite(precision)
    ? Math.floor(precision)
    : def;

  if (!Number.isSafeInteger(p) || p < 0) return 0;
  if (p > 5) return 5;
  return p;
};

export const formatValue = (value: number, formatType?: string, precision?: number): string => {
  if (typeof value !== "number" || !isFinite(value)) {
    return String(value);
  }

  switch (formatType) {
    case "decimal": {
      const decimalPlaces = clampPrecision(precision, 2);
      return value.toFixed(decimalPlaces);
    }

    case "percent": {
      const decimalPlaces = clampPrecision(precision, 0);
      return (value * 100).toFixed(decimalPlaces);
    }

    case "integer":
    default:
      return Math.round(value).toString();
  }
};
