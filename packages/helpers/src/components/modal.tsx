import React, { ReactNode, useCallback, useEffect, useMemo, useRef } from "react";
import classnames from "classnames";
import { v4 as uuid } from "uuid";

import CloseIcon from "../assets/close-icon.svg";

import css from "./modal.scss";

// Elements considered focusable for initial focus and the focus trap.
const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), ' +
  'textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

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
  // Optional mode. Defaults to "confirm". Both modes apply full focus management:
  // initial focus is moved into the dialog, Tab is trapped within it, Escape dismisses,
  // and focus is restored to the previously focused element on close. In "alert" mode the
  // Cancel and X close buttons are hidden and Escape routes to onConfirm (dismiss == OK);
  // in "confirm" mode Escape routes to onCancel (dismiss without acting).
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
  const bodyRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<Element | null>(null);

  // Initial focus + focus restore (both modes). Mode never changes for a given
  // mounted modal, so this runs once on open and cleans up on close.
  useEffect(() => {
    previouslyFocusedRef.current = document.activeElement;
    // Move initial focus to the first focusable inside the modal body, which
    // deliberately skips the title-bar Close (X). In alert mode that is the OK
    // button; in confirm mode it is the first form field, or the Cancel button
    // when the body has no field (the safe default for a destructive confirm).
    bodyRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)?.focus();
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
  }, []);

  // Escape dismisses + focus trap (both modes).
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      // Keep dismissal self-contained: don't let Escape bubble to an ancestor
      // (e.g. the Blockly workspace, which also listens for Escape) and trigger
      // a second, unrelated action from the same keypress.
      e.stopPropagation();
      // Route Escape per mode so it mirrors the modal's own dismiss affordance:
      // in alert mode to onConfirm (dismiss == the single OK button), in confirm
      // mode to onCancel (dismiss without acting == Cancel/X). The onConfirm prop
      // signature includes React.KeyboardEvent<HTMLDivElement> in its union to
      // accept the alert path without a cast.
      if (isAlert) {
        onConfirm(e);
      } else {
        onCancel();
      }
      return;
    }
    if (e.key === "Tab" && overlayRef.current) {
      const focusables = overlayRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
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
  }, [isAlert, onConfirm, onCancel]);

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
        <div ref={bodyRef} className={css.modalBody}>
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
