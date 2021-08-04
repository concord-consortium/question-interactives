import React, { useState } from "react";
import { UploadButton } from "./upload-button";

import { getInteractiveSnapshot } from "@concord-consortium/lara-interactive-api";
import { getAnswerType, IGenericAuthoredState, IGenericInteractiveState } from "../../drawing-tool/components/types";

import SnapShotIcon from "../assets/snapshot-image-icon.svg";

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
          <UploadButton onClick={handleSnapshot}
            disabled={snapshotInProgress}
            data-test="snapshot-btn">
                <SnapShotIcon />
                { snapshotInProgress
                  ? "Please Wait"
                  : "Take Snapshot"
                }
          </UploadButton>
      }
      {
        authoredState.snapshotTarget === undefined &&
        <p>Snapshot won&apos;t work, as no target interactive is selected</p>
      }
    </>
  );
};
