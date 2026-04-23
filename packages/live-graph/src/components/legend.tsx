import React from "react";
import { columnStyle } from "./column-style";
import { IActiveColumn } from "./use-live-stream";
import { LegendPosition } from "./types";
import css from "./legend.scss";

interface ILegendProps {
  columns: IActiveColumn[];
  visibility: Record<string, boolean>;
  onToggle: (column: string) => void;
  position?: LegendPosition;
}

const propsAreEqual = (prev: ILegendProps, next: ILegendProps): boolean => {
  if (prev.columns !== next.columns) return false;
  if (prev.onToggle !== next.onToggle) return false;
  if (prev.position !== next.position) return false;
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

const LineSwatch: React.FC<{ index: number }> = ({ index }) => {
  const { color, borderDash } = columnStyle(index);
  const dashArray = borderDash.length > 0 ? borderDash.join(" ") : "none";
  return (
    <svg className={css.swatch} viewBox="0 0 24 12" aria-hidden="true">
      <line x1="0" y1="6" x2="24" y2="6" stroke={color} strokeWidth="1" strokeDasharray={dashArray} strokeLinecap="round" />
    </svg>
  );
};

export const Legend = React.memo<ILegendProps>(({ columns, visibility, onToggle, position = "top" }) => {
  const isVertical = position === "left" || position === "right";
  return (
    <ul className={`${css.legend} ${isVertical ? css.vertical : ""}`}>
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
              <LineSwatch index={i} />
              <span className={css.label}>{col.label}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}, propsAreEqual);

Legend.displayName = "Legend";
