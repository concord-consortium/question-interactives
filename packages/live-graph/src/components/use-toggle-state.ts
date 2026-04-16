import { useRef, useState, useCallback } from "react";

export interface IToggleStateResult {
  visibility: Record<string, boolean>;
  setVisibility: (column: string, visible: boolean) => void;
  registerColumns: (cols: string[]) => void;
  isVisible: (column: string) => boolean;
}

export const useToggleState = (): IToggleStateResult => {
  const mapRef = useRef<Map<string, boolean>>(new Map());
  const [visibility, setVisibilityState] = useState<Record<string, boolean>>({});

  const rebuildObject = useCallback(() => {
    const obj: Record<string, boolean> = {};
    mapRef.current.forEach((v, k) => {
      obj[k] = v;
    });
    setVisibilityState(obj);
  }, []);

  const setVisibility = useCallback((column: string, visible: boolean) => {
    mapRef.current.set(column, visible);
    rebuildObject();
  }, [rebuildObject]);

  const registerColumns = useCallback((cols: string[]) => {
    let changed = false;
    const activeSet = new Set(cols);
    // Prune entries for columns that are no longer active so the visibility
    // object doesn't grow unbounded across recordings with different column sets.
    mapRef.current.forEach((_v, k) => {
      if (!activeSet.has(k)) {
        mapRef.current.delete(k);
        changed = true;
      }
    });
    for (const c of cols) {
      if (!mapRef.current.has(c)) {
        mapRef.current.set(c, true);
        changed = true;
      }
    }
    if (changed) {
      rebuildObject();
    }
  }, [rebuildObject]);

  const isVisible = useCallback((column: string): boolean => {
    return mapRef.current.get(column) !== false;
  }, []);

  return { visibility, setVisibility, registerColumns, isVisible };
};
