import "intersection-observer"; // polyfill, mostly to support Safari < v12.1
import { useEffect, useRef } from "react";
import { log, useInteractiveState } from "@concord-consortium/lara-interactive-api";

interface IConfig {
  disabled?: boolean;
}

// Threshold used by IntersectionObserver to log when element scrolls into view. 0.8 means that event will be logged
// when 80% of the question container is scrolled into viewport.
export const intersectionThreshold = 0.8;
// Delay observing intersection. Otherwise lots of events will be triggered at the beginning when the page is still
// loading and interactives are resizing. When IntersectionObserver starts observing, it triggers callback with
// the initial state. So, researchers will have access to the initial visibility anyway and no info should be lost.
export let intersectionDelay = 6000; // ms

// Useful in test environment.
export const _setIntersectionDelay = (value: number) => {
  intersectionDelay = value;
};

export const useBasicLogging = (options?: IConfig) => {
  const disabled = options?.disabled;
  const { interactiveState } = useInteractiveState<{answerText?: string}>();
  // Extract answerText and save it in ref, so focusOut can access the most recent value.
  const answerText = useRef<string>();
  answerText.current = interactiveState?.answerText || "";

  useEffect(() => {
    if (disabled) {
      return;
    }
    // focus in / out logging:
    const focusIn = (e: FocusEvent) => {
      const target = (e.target as HTMLInputElement);
      log("focus in", {
        target_element: target.tagName.toLowerCase(),
        target_type: target.type,
        target_id: target.id,
        target_name: target.name,
        target_value: target.value
      });
    };
    const focusOut = (e: FocusEvent) => {
      const target = (e.target as HTMLInputElement);
      log("focus out", {
        target_element: target.tagName.toLowerCase(),
        target_type: target.type,
        target_id: target.id,
        target_name: target.name,
        target_value: target.value,
        answer_text: answerText.current
      });
    };
    // Note that difference between focusin/focusout and focus/blur is that focusin/focusout bubbles
    // while focus/blur does not.
    window.addEventListener("focusin", focusIn);
    window.addEventListener("focusout", focusOut);

    // scrolled into view / out of view events:
    const observer = new IntersectionObserver((entries: IntersectionObserverEntry[]) => {
      if (entries[0]) {
        log(entries[0].isIntersecting ? "scrolled into view" : "scrolled out of view");
      }
    }, {
      threshold: intersectionThreshold
    });
    // Delay observing intersection. Otherwise lots of events will be triggered at the beginning when the page is still
    // loading and interactives are resizing. When IntersectionObserver starts observing, it triggers callback with
    // the initial state. So, researchers will have access to the initial visibility anyway and no info should be lost.
    const timeoutId = window.setTimeout(() => {
      observer.observe(window.document.body);
    }, intersectionDelay);

    return () => {
      window.removeEventListener("focusin", focusIn);
      window.removeEventListener("focusout", focusOut);
      window.clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [disabled]);
};
