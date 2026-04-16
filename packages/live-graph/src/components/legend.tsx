import React from "react";
import { columnColor } from "./column-color";
import { IActiveColumn } from "./use-live-stream";
import css from "./legend.scss";

interface ILegendProps {
  columns: IActiveColumn[];
  visibility: Record<string, boolean>;
  onToggle: (column: string) => void;
}

const propsAreEqual = (prev: ILegendProps, next: ILegendProps): boolean => {
  if (prev.columns !== next.columns) return false;
  if (prev.onToggle !== next.onToggle) return false;
  const prevV = prev.visibility;
  const nextV = next.visibility;
  if (prevV === nextV) return true;
  const keys = Object.keys(nextV);
  if (keys.length !== Object.keys(prevV).length) return false;
  for (const k of keys) {
    if (prevV[k] !== nextV[k]) return false;
  }
  return true;
};

export const Legend = React.memo<ILegendProps>(({ columns, visibility, onToggle }) => {
  return (
    <ul className={css.legend}>
      {columns.map((col, i) => {
        const visible = visibility[col.column] !== false;
        return (
          <li key={col.column} className={css.entry}>
            <button
              type="button"
              aria-pressed={visible}
              className={css.button}
              onClick={() => onToggle(col.column)}
              onKeyDown={(e) => {
                if (e.key === " ") {
                  e.preventDefault();
                  onToggle(col.column);
                }
              }}
            >
              <span
                className={css.swatch}
                style={{ backgroundColor: columnColor(i) }}
              />
              <span className={css.label}>{col.label}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}, propsAreEqual);

Legend.displayName = "Legend";
