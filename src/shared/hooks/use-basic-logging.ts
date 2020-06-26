import { useEffect, useRef } from "react";
import { log } from "@concord-consortium/lara-interactive-api";

interface IConfig {
  disabled?: boolean;
}

export const useBasicLogging = (options?: IConfig) => {
  const disabled = options?.disabled;
  const answerToLog = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (disabled) {
      return;
    }

    const focusIn = (e: FocusEvent) => {
      const target = (e.target as HTMLInputElement);
      log("focus in", {
        target_element: target.tagName.toLowerCase(),
        target_id: target.id,
        target_name: target.name,
        target_value: target.value
      });
    };
    const focusOut = (e: FocusEvent) => {
      const target = (e.target as HTMLInputElement);
      log("focus out", {
        target_element: target.tagName.toLowerCase(),
        target_id: target.id,
        target_name: target.name,
        target_value: target.value
      });
      if (answerToLog.current !== undefined) {
        // LARA uses "answer saved" message for its basic questions too.
        log("answer saved", { answer_text: answerToLog.current });
        answerToLog.current = undefined;
      }
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

  return {
    onAnswerUpdate: (newAnswer: string | undefined) => {
      answerToLog.current = newAnswer;
    }
  }
};
