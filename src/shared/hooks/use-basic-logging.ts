import { useEffect, useRef } from "react";
import { log, useInteractiveState } from "@concord-consortium/lara-interactive-api";

interface IConfig {
  disabled?: boolean;
}

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
    return () => {
      window.removeEventListener("focusin", focusIn);
      window.removeEventListener("focusout", focusOut);
    }
  }, [disabled]);
};
