import React, { useState } from "react";
import css from "./upload-image-modal.scss";
import { IGenericAuthoredState, IGenericInteractiveState } from "drawing-tool-interactive/src/components/types";
import { UploadImage } from "./upload-image";
import { IThumbnailChooserProps, ThumbnailChooser } from "./thumbnail-chooser/thumbnail-chooser";
import classnames from "classnames";
import { ILabbookEntry } from "./types";

export interface IProps {
  authoredState: IGenericAuthoredState;
  setInteractiveState?: (updateFunc: (prevState: IGenericInteractiveState | null) => IGenericInteractiveState, itemIdx?: number) => void;
  setNextInteractiveState?: (updateFunc: (prevState: IGenericInteractiveState | null) => IGenericInteractiveState, item: ILabbookEntry) => void;
  onUploadStart?: () => void;
  onUploadComplete?: (result: { success: boolean }) => void;
  uploadButtonClass?: 'string';
  uploadIcon?: React.ReactNode;
  disabled?: boolean;
  handleCloseModal: () => void;
  thumbnailChooserProps: IThumbnailChooserProps;
  setSelectedItemId: (id: string) => void;
  selectedId: string;
}

export const UploadModal: React.FC<IProps> = ({authoredState, setInteractiveState, setNextInteractiveState, onUploadStart, onUploadComplete,
  handleCloseModal, disabled, thumbnailChooserProps, setSelectedItemId, selectedId}) => {
  const [hideUI, setHideUI] = useState<boolean>(false);
  const nextItem = thumbnailChooserProps.items.find(i => i.empty);
  const thumbnailItems = thumbnailChooserProps.items.filter((i) => {
    return i.id === selectedId || i.id === nextItem?.id;
  });
  const thumbnailPreviewProps = {...thumbnailChooserProps, items: thumbnailItems, readOnly: true, uploadPreviewMode: true};

  return (
    <div className={css.modal}>
      <div className={css.modalContent}>
        <div className={classnames(css.header, {[css.hidden]: hideUI})}>
          What would you like to do?
        </div>
        <div className={classnames(css.thumbnails, {[css.hidden]: hideUI})}>
          <ThumbnailChooser {...thumbnailPreviewProps} />
        </div>
        <div className={classnames(css.uploadButtons, {[css.hidden]: hideUI})}>
          <UploadImage
            authoredState={authoredState}
            setInteractiveState={setInteractiveState}
            disabled={disabled}
            onUploadStart={onUploadStart}
            onUploadComplete={onUploadComplete}
            text={"Replace Current Image"}
            setHideUploadButtons={setHideUI}
          />
          <UploadImage
            authoredState={authoredState}
            setNextInteractiveState={setNextInteractiveState}
            disabled={disabled}
            onUploadStart={onUploadStart}
            onUploadComplete={onUploadComplete}
            text={"Create New Image"}
            item={nextItem}
            setSelectedItemId={setSelectedItemId}
            setHideUploadButtons={setHideUI}
          />
        </div>
        {hideUI && <div className={css.loadingMessage}>Please Wait</div>}
        {!hideUI && <div className={classnames(css.cancel, {[css.hidden]: hideUI})}>
          <button onClick={handleCloseModal}>Cancel</button>
        </div>}
      </div>
    </div>
  );
};
