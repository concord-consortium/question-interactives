import React, { ReactNode } from "react";
import classnames from "classnames";

import CloseIcon from "../assets/close-icon.svg";

import css from "./modal.scss";

interface Props {
  variant: "teal" | "orange";
  title: string;
  Icon: React.FC<React.SVGProps<SVGSVGElement>>;
  message: string | ReactNode;
  confirmLabel: string;
  onConfirm: (e: React.FormEvent<HTMLFormElement>|React.MouseEvent<HTMLButtonElement>) => void;
  onCancel: () => void;
}

export const Modal = ({ variant, title, Icon, message, confirmLabel, onConfirm, onCancel }: Props) => {
  return (
    <div className={css.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className={css.modalContent}>
        <div className={classnames(css.titleBar, css[variant])}>
          <Icon className={css.titleIcon} />
          <div id="modal-title" className={css.modalTitle}>{title}</div>
          <button onClick={onCancel} className={classnames(css.closeButton, css[variant])} aria-label="Close">
            <CloseIcon />
          </button>
        </div>
        <div className={css.modalBody}>
          <form onSubmit={onConfirm}>
            <div className={css.modalMessage}>{message}</div>
          </form>
          <div className={css.modalActions}>
            <button onClick={onCancel} className={classnames(css[variant])}>
              Cancel
            </button>
            <button onClick={onConfirm} className={classnames(css.modalConfirmButton, css[variant])}>
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
