import React from "react";
import classNames from "classNames";

import css from "./uploadButton.scss";

export interface IUploadButtonProps {
  label?:string;
  disabled?: boolean;
  onClick?: () => void;
}

export const UploadButton: React.FC<IUploadButtonProps> = (props) => {
  const {children, onClick, disabled} = props;
  const classes = classNames(css["button-back"], {[css.disabled]: disabled});
  return (
    <div className={classes} onClick={onClick}>
      {children}
    </div>
  );
};
