import React from "react";
import classNames from "classnames";

import css from "./upload-button.scss";

export interface IUploadButtonProps {
  disabled?: boolean;
  onClick?: (type: string) => void;
  inDialog?: boolean;
  "data-testid"?: string;
}

export const UploadButton: React.FC<IUploadButtonProps> = (props) => {
  const {children, onClick, disabled, inDialog} = props;
  const classes = classNames(css["upload-button"], {[css.disabled]: disabled, [css.inDialog]: inDialog});
  return (
    <button
      type="button"
      className={classes}
      disabled={disabled}
      onClick={() => onClick && onClick("upload")}
      data-testid={props["data-testid"]}
    >
      {children}
    </button>
  );
};
