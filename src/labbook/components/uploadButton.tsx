import React from "react";
import "./uploadButton.scss";

export interface IUploadButtonProps {label?:string}

export const UploadButton: React.FC<IUploadButtonProps> = (props) => {
  const {children} = props;
  return (
    <div className='button-back'>
      {children}
    </div>
  );
};
