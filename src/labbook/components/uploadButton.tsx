import React from "react";
import css from "./uploadButton.scss";

export interface IUploadButtonProps {label?:string}

export const UploadButton: React.FC<IUploadButtonProps> = (props) => {
  const {children} = props;
  return (
    <div className={css["button-back"]}>
      {children}
    </div>
  );
};
