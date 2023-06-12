import React from "react";
import css from "./upload-image-modal.scss";
import { IGenericAuthoredState, IGenericInteractiveState } from "drawing-tool-interactive/src/components/types";
import { UploadImage } from "./upload-image";
export interface IProps {
  authoredState: IGenericAuthoredState;
  setInteractiveState?: (updateFunc: (prevState: IGenericInteractiveState | null) => IGenericInteractiveState, itemIdx?: number) => void;
  onUploadStart?: () => void;
  onUploadComplete?: (result: { success: boolean }) => void;
  uploadButtonClass?: 'string';
  uploadIcon?: React.ReactNode;
  disabled?: boolean;
  handleCloseModal: () => void;
  replaceItemIndex: number;
  newItemIndex: number;
}

export const UploadModal: React.FC<IProps> = ({authoredState, setInteractiveState, onUploadStart, onUploadComplete,
  handleCloseModal, disabled, replaceItemIndex, newItemIndex}) => {
  return (
    <div className={css.modal}>
      <div className={css.modalContent}>
        <div className={css.uploadButtons}>
          <UploadImage
            authoredState={authoredState}
            setInteractiveState={setInteractiveState}
            disabled={disabled}
            onUploadStart={onUploadStart}
            onUploadComplete={onUploadComplete}
            text={"Replace Current Image"}
            itemIndex={replaceItemIndex}
          />
          <UploadImage
            authoredState={authoredState}
            setInteractiveState={setInteractiveState}
            disabled={disabled}
            onUploadStart={onUploadStart}
            onUploadComplete={onUploadComplete}
            text={"Create New Image"}
            itemIndex={newItemIndex}
          />
        </div>
        <div><button onClick={handleCloseModal}>Cancel</button></div>
      </div>
    </div>
  );
};
