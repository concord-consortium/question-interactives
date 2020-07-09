import { RefObject, useEffect, useRef } from "react";
import ResizeObserver from "resize-observer-polyfill";
import { setHeight } from "@concord-consortium/lara-interactive-api";

interface IConfig {
  container: RefObject<HTMLDivElement>;
  disabled?: boolean;
}

export const useAutoHeight = ({ container, disabled }: IConfig) => {
  const setHeightCalled = useRef(false);

  useEffect(() => {
    if (disabled) {
      if (setHeightCalled.current) {
        // Sending empty string to LARA will disable height and start using aspect ratio again.
        // If setHeight has been never called, it doesn't make sense to send this message to LARA.
        setHeight("");
      }
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
        setHeightCalled.current = true;
      }
    });
    if (container.current) {
      observer.observe(container.current);
    }
    // Cleanup function.
    return () => {
      observer.disconnect();
    };
  }, [container, disabled]);
};
