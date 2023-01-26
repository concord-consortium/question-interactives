import React, { useState } from "react";
import { UploadButton } from "./upload-button";
import { getInteractiveSnapshot } from "@concord-consortium/lara-interactive-api";
import { getAnswerType, IGenericAuthoredState, IGenericInteractiveState } from "drawing-tool-interactive/src/components/types";
import { useLinkedInteractiveId } from "@concord-consortium/question-interactives-helpers/src/hooks/use-linked-interactive-id";
import SnapShotIcon from "../assets/snapshot-image-icon.svg";
import { Log } from "../labbook-logging";

export interface IProps {
  authoredState: IGenericAuthoredState; // so it works with DrawingTool and ImageQuestion
  interactiveState?: IGenericInteractiveState | null;
  setInteractiveState?: (updateFunc: (prevState: IGenericInteractiveState | null) => IGenericInteractiveState) => void;
  onUploadStart?: () => void;
  disabled?: boolean;
  onUploadComplete?: (result: { success: boolean }) => void;
}

export const TakeSnapshot: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState, onUploadStart, onUploadComplete, disabled}) => {
  const [ snapshotInProgress, setSnapshotInProgress ] = useState(false);
  const snapshotTarget = useLinkedInteractiveId("snapshotTarget");

  const handleSnapshot = async () => {
    if (snapshotTarget) {
      onUploadStart?.();
      setSnapshotInProgress(true);
      const response = await getInteractiveSnapshot({ interactiveItemId: snapshotTarget });
      setSnapshotInProgress(false);
      if (response.success && response.snapshotUrl) {
        setInteractiveState?.(prevState => ({
          ...prevState,
          userBackgroundImageUrl: response.snapshotUrl,
          answerType: getAnswerType(authoredState.questionType)
        }));
        Log({action: "snapshot uploaded", data:{url: response.snapshotUrl}});
        onUploadComplete?.({ success: true });
      } else {
        window.alert("Snapshot has failed. Please try again.");
        Log({action: "upload fail"});
        onUploadComplete?.({ success: false });
      }
    }
  };

  return (
    <>
      {
        snapshotTarget &&
          <UploadButton onClick={handleSnapshot}
            disabled={snapshotInProgress || disabled}
            data-testid="snapshot-btn">
                <SnapShotIcon />
                { snapshotInProgress || disabled
                  ? "Please Wait"
                  : "Take Snapshot"
                }
          </UploadButton>
      }
    </>
  );
};
