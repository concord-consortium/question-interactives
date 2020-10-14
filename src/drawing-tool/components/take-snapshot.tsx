import React, { useState } from "react";
import 'drawing-tool/dist/drawing-tool.css';
import css from "./runtime.scss";
import cssHelpers from "../../shared/styles/helpers.scss";
import CameraIcon from "../../shared/icons/camera.svg";
import { getInteractiveSnapshot } from "@concord-consortium/lara-interactive-api";
import { getAnswerType, IGenericAuthoredState, IGenericInteractiveState } from "./types";

export interface IProps {
  authoredState: IGenericAuthoredState; // so it works with DrawingTool and ImageQuestion
  interactiveState?: IGenericInteractiveState | null;
  setInteractiveState?: (updateFunc: (prevState: IGenericInteractiveState | null) => IGenericInteractiveState) => void;
  onUploadStart?: () => void;
  onUploadComplete?: (result: { success: boolean }) => void;
}

export const TakeSnapshot: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState, onUploadStart, onUploadComplete }) => {
  const [ snapshotInProgress, setSnapshotInProgress ] = useState(false);

  const handleSnapshot = async () => {
    if (authoredState.snapshotTarget) {
      onUploadStart?.();
      setSnapshotInProgress(true);
      const response = await getInteractiveSnapshot({ interactiveItemId: authoredState.snapshotTarget });
      setSnapshotInProgress(false);
      if (response.success && response.snapshotUrl) {
        setInteractiveState?.(prevState => ({
          ...prevState,
          userBackgroundImageUrl: response.snapshotUrl,
          answerType: getAnswerType(authoredState.questionType)
        }));
        onUploadComplete?.({ success: true });
      } else {
        window.alert("Snapshot has failed. Please try again.");
        onUploadComplete?.({ success: false });
      }
    }
  };

  return (
    <>
      {
        authoredState.snapshotTarget &&
        <button className={cssHelpers.laraButton} onClick={handleSnapshot} disabled={snapshotInProgress} data-test="snapshot-btn">
          <CameraIcon className={cssHelpers.smallIcon} /> { interactiveState?.userBackgroundImageUrl ? "Replace snapshot" : "Take a snapshot" }
        </button>
      }
      { snapshotInProgress && <p>Please wait while the snapshot is being taken...</p> }
      {
        authoredState.snapshotTarget === undefined &&
        <p className={css.warn}>Snapshot won&apos;t work, as no target interactive is selected</p>
      }
    </>
  );
};
