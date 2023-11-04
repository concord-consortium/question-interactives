import React from "react";
import classNames from "classnames";

import css from "./upload-button.scss";

export interface IUploadButtonProps {
  label?:string;
  disabled?: boolean;
  onClick?: (type: string) => void;
}

export const UploadButton: React.FC<IUploadButtonProps> = (props) => {
  const {children, onClick, disabled} = props;
  const classes = classNames(css["upload-button"], {[css.disabled]: disabled});
  return (
    <div className={classes} onClick={()=>onClick && onClick("upload")}>
      {children}
    </div>
  );
};
