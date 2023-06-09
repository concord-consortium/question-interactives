import React from "react";
import UploadIcon from "../assets/upload-image-icon.svg";
import css from "./open-modal-button.scss";

interface IProps {
  handleClick: () => void;
}

export const OpenModalButton = (props: IProps) => {
  const {handleClick} = props;

  return (
    <button className={css.openModalButton} onClick={handleClick}>
      <UploadIcon />
      Upload Image
    </button>
  );
};
