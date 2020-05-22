import { RefObject, useEffect } from "react";
import ResizeObserver from "resize-observer-polyfill";

interface IConfig {
  container: RefObject<HTMLDivElement>;
  setHeight: (height: number) => void;
}

export const useAutoHeight = (config: IConfig) => {
  const { container, setHeight } = config;

  useEffect(() => {
    // TypeScript doesn't seem to have types of the native ResizeObserver yet. Use types coming from polyfill.
    const NativeResizeObserver = (window as any).ResizeObserver as new(callback: ResizeObserverCallback) => ResizeObserver;

    const observer = new (NativeResizeObserver || ResizeObserver)(entries => {
      for (const entry of entries) {
        const height = entry.target?.scrollHeight;
        if (height && height > 0) {
          setHeight(Math.ceil(height));
        }
      }
    });
    if (container.current) {
      observer.observe(container.current);
    }
    // Cleanup function.
    return () => {
      observer.disconnect();
    }
  }, [container.current]);
};
