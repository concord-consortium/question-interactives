import React from "react";
import classNames from "classnames";

import css from "./upload-button.scss";

export interface IUploadButtonProps {
  label?:string;
  disabled?: boolean;
  onClick?: (type: string) => void;
  inDialog?: boolean;
}

export const UploadButton: React.FC<IUploadButtonProps> = (props) => {
  const {children, onClick, disabled, inDialog} = props;
  const classes = classNames(css["upload-button"], {[css.disabled]: disabled, [css["in-dialog"]]: inDialog});
  return (
    <div className={classes} onClick={()=>onClick && onClick("upload")}>
      {children}
    </div>
  );
};
