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
 * This is NOT a trap: it never prevents default on Tab and never sends
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
        // The remembered element may have been removed from the DOM since we
        // recorded it (e.g. a drawing-tool control that unmounted). focus() on
        // a detached node is a silent no-op, so fall back to the first
        // focusable unless the remembered element is still connected.
        const last = lastFocusedRef.current;
        (last?.isConnected ? last : focusables[0])?.focus();
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
      // Only forward Escape as focusExit if it bubbled up to the document
      // unconsumed. A menu that closes on Escape (e.g. a drawing-tool palette)
      // either stops propagation — so we never see the event — or calls
      // preventDefault, which we honor here so its internal Escape doesn't also
      // exit the interactive's focus context.
      if (e.key === "Escape" && !e.defaultPrevented) {
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
