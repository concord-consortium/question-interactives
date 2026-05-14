import React, { ReactNode, useCallback, useEffect, useMemo, useRef } from "react";
import classnames from "classnames";
import { v4 as uuid } from "uuid";

import CloseIcon from "../assets/close-icon.svg";

import css from "./modal.scss";

interface Props {
  variant: "teal" | "orange";
  title: string;
  Icon: React.FC<React.SVGProps<SVGSVGElement>>;
  message: string | ReactNode;
  confirmLabel: string;
  onConfirm: (
    e: React.FormEvent<HTMLFormElement>
       | React.MouseEvent<HTMLButtonElement>
       | React.KeyboardEvent<HTMLDivElement>
  ) => void;
  onCancel: () => void;
  // Optional mode. Defaults to "confirm" (existing behavior). In "alert" mode the Cancel
  // button and X close button are hidden, and full focus management is applied: initial
  // focus on the confirm button, focus trap, Escape dismisses, focus is restored on close.
  mode?: "confirm" | "alert";
}

export const Modal = ({
  variant, title, Icon, message, confirmLabel, onConfirm, onCancel, mode = "confirm"
}: Props) => {
  const isAlert = mode === "alert";
  // Unique per-instance ids so aria-labelledby / aria-describedby never collide when
  // two modals coexist. aria-describedby points at the message body so screen readers
  // announce both the title and the explanatory text when the dialog opens (ARIA APG).
  // React 17 lacks useId; useMemo with a uuid achieves the same per-instance uniqueness.
  const titleId = useMemo(() => `modal-title-${uuid()}`, []);
  const messageId = useMemo(() => `modal-message-${uuid()}`, []);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<Element | null>(null);

  // Initial focus + focus restore (alert mode only).
  useEffect(() => {
    if (!isAlert) return;
    previouslyFocusedRef.current = document.activeElement;
    confirmButtonRef.current?.focus();
    return () => {
      const prev = previouslyFocusedRef.current as HTMLElement | null;
      if (prev && document.contains(prev) && typeof prev.focus === "function") {
        prev.focus();
      } else {
        // Previous focus target is gone; blur any active element so focus isn't
        // stranded inside the unmounting modal subtree. Without tabindex, calling
        // body.focus() is a no-op, so the load-bearing line here is the blur.
        (document.activeElement as HTMLElement | null)?.blur?.();
      }
    };
  }, [isAlert]);

  // Escape dismisses + focus trap (alert mode only).
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isAlert) return;
    if (e.key === "Escape") {
      e.preventDefault();
      // Route Escape to onConfirm (not onCancel) in alert mode so it dismisses
      // identically to clicking OK by construction. Otherwise a caller passing
      // different handlers for onConfirm vs onCancel could silently violate the
      // requirement that Escape and OK behave identically. The onConfirm prop
      // signature includes React.KeyboardEvent<HTMLDivElement> in its union to
      // accept this path without a cast.
      onConfirm(e);
      return;
    }
    if (e.key === "Tab" && overlayRef.current) {
      const focusables = overlayRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), ' +
        'textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusables.length === 0) return;
      if (focusables.length === 1) {
        // Single focusable (alert mode's OK button): prevent Tab from moving
        // focus out of the modal. Removes order-dependence of the first/last
        // branches below.
        e.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && active === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, [isAlert, onConfirm]);

  return (
    <div
      ref={overlayRef}
      className={css.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={messageId}
      onKeyDown={handleKeyDown}
    >
      <div className={css.modalContent}>
        <div className={classnames(css.titleBar, css[variant])}>
          <Icon className={css.titleIcon} />
          <div id={titleId} className={css.modalTitle}>{title}</div>
          {!isAlert && (
            <button onClick={onCancel} className={classnames(css.closeButton, css[variant])} aria-label="Close">
              <CloseIcon />
            </button>
          )}
        </div>
        <div className={css.modalBody}>
          {/* OK button is intentionally rendered outside <form> so pressing Enter
              on it doesn't double-fire onConfirm (button click + form submit).
              Keep it outside if you ever refactor this layout. The <form> wrapper
              has no submittable content today (just a message div), so it cannot
              fire onSubmit on its own. If you ever add an <input>/<textarea> inside
              this body, be aware that Enter inside that field would route to
              onConfirm — switch to a regular <div> or route submit explicitly. */}
          <form onSubmit={onConfirm}>
            <div id={messageId} className={css.modalMessage}>{message}</div>
          </form>
          <div className={css.modalActions}>
            {!isAlert && (
              <button onClick={onCancel} className={classnames(css[variant])}>
                Cancel
              </button>
            )}
            <button
              ref={confirmButtonRef}
              onClick={onConfirm}
              className={classnames(css.modalConfirmButton, css[variant])}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
