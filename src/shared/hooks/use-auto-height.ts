import { RefObject, useEffect } from "react";
import ResizeObserver from "resize-observer-polyfill";
import { setHeight } from "@concord-consortium/lara-interactive-api";

interface IConfig {
  container: RefObject<HTMLDivElement>;
  disabled?: boolean;
}

export const useAutoHeight = ({ container, disabled }: IConfig) => {
  useEffect(() => {
    if (disabled) {
      return;
    }
    // TypeScript doesn't seem to have types of the native ResizeObserver yet. Use types coming from polyfill.
    const NativeResizeObserver = (window as any).ResizeObserver as new(callback: ResizeObserverCallback) => ResizeObserver;

    const observer = new (NativeResizeObserver || ResizeObserver)(entries => {
      const entry = entries[0];
      // scrollHeight describes min height of the container necessary to avoid scrollbars.
      // It works better than offsetHeight (e.g. when we have some elements with `float:right` css props).
      const height = entry?.target?.scrollHeight;
      if (height && height > 0) {
        setHeight(Math.ceil(height));
      }
    });
    if (container.current) {
      observer.observe(container.current);
    }
    // Cleanup function.
    return () => {
      observer.disconnect();
    }
  }, [container.current, disabled]);
};
