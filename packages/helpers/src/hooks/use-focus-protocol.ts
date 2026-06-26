import { useEffect, useRef } from "react";
import {
  addFocusEnterListener,
  removeFocusEnterListener,
  sendFocusExit,
} from "@concord-consortium/lara-interactive-api";
import { getFocusableElements } from "../utilities/focusable-elements";

interface IUseFocusProtocolOptions {
  enabled: boolean;
}

/**
 * Client side of the AP iframe focus protocol. When enabled, the interactive
 * advertises `focusProtocol` (done by the caller via setSupportedFeatures) and:
 * - places entry focus where AP's focusEnter says (first / last / restore),
 * - tracks its last-focused control for restore,
 * - forwards Escape as focusExit("escape").
 *
 * This is NOT a trap: it never preventDefaults Tab and never sends
 * focusExit("forward"|"reverse"). Directional exit flows out through AP's
 * sentinels.
 */
export const useFocusProtocol = ({ enabled }: IUseFocusProtocolOptions) => {
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!enabled) return;

    addFocusEnterListener(mode => {
      const focusables = getFocusableElements(document);
      if (mode === "reverse") {
        focusables[focusables.length - 1]?.focus();
      } else if (mode === "restore") {
        (lastFocusedRef.current ?? focusables[0])?.focus();
      } else {
        focusables[0]?.focus();
      }
    });

    const onFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && target !== document.body) {
        lastFocusedRef.current = target;
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        sendFocusExit("escape");
      }
    };

    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      // removeFocusEnterListener() clears ALL focusEnter listeners (lara has no
      // per-listener removal). Fine here: this hook registers exactly one.
      removeFocusEnterListener();
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [enabled]);
};
