import { useEffect, useRef } from "react";
import { log } from "@concord-consortium/lara-interactive-api";

interface IConfig {
  disabled?: boolean;
}

export const useBasicLogging = ({ disabled }: IConfig) => {
  const answerToLog = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (disabled) {
      return;
    }

    const focusIn = (e: FocusEvent) => {
      // event.relatedTarget === null means that user is most likely coming from outer window, and not changing focus
      // within the interactive iframe (eg clicking various buttons). We want to log only "main" focus event.
      if (!e.relatedTarget) {
        log("focus in", { focus_target: (e.target as HTMLElement).tagName.toLowerCase() });
      }
    };
    const focusOut = (e: FocusEvent) => {
      // event.relatedTarget === null means that user is most likely leaving to outer window, and not changing focus
      // within the interactive iframe (eg clicking various buttons). We want to log only "main" blur event.
      if (!e.relatedTarget) {
        log("focus out");
        if (answerToLog.current !== undefined) {
          // LARA uses "answer saved" message for its basic questions too.
          log("answer saved", { answer_text: answerToLog.current });
          answerToLog.current = undefined;
        }
      }
    };
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
