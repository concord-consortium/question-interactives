import React, { RefObject, useEffect, useRef } from "react";

export const AutoHeightContext = React.createContext({
  notifyHeightUpdated: () => { /* noop */ }
});

interface IConfig {
  container: RefObject<HTMLDivElement>;
  setHeight: (height: number) => void;
}

export const useAutoHeight = (config: IConfig) => {
  const { container, setHeight } = config;
  const currentHeight = useRef(0);

  const recalcHeight = (last = false) => {
    const height = container.current?.offsetHeight;
    if (height && height > 0 && height !== currentHeight.current) {
      setHeight(height);
      currentHeight.current = height;
      // There might be CSS transition in progress. Continue checking height.
      setTimeout(() => recalcHeight(false), 33);
    } else if (!last) {
      // Height might not have been changed yet, as it's a very beginning of CSS transition. Schedule one more check.
      setTimeout(() => recalcHeight(true), 33);
    }
  };

  // Update height on every re-render by default. It can cover enough number of cases. recalcHeight is cheap.
  useEffect(recalcHeight);

  useEffect(() => {
    // It's necessary to wrap calcHeight in a closure function. Note that calcHeight will be recreated on every render.
    // This will break the cleanup function which would try to remove wrong reference. resizeHandler is created
    // only once, as useEffect has empty dependencies list.
    const resizeHandler = () => recalcHeight();
    window.addEventListener("resize", resizeHandler);
    return () => window.removeEventListener("resize", resizeHandler);
  }, []);

  // This function can be used in AutoHeightContext. But also it can be used directly if context isn't necessary.
  return {
    notifyHeightUpdated: recalcHeight
  };
}
