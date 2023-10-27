import React, { useState } from "react";
import { UploadButton } from "./upload-button";
import { getInteractiveSnapshot } from "@concord-consortium/lara-interactive-api";
import { getAnswerType, IGenericAuthoredState, IGenericInteractiveState } from "drawing-tool-interactive/src/components/types";
import { useLinkedInteractiveId } from "@concord-consortium/question-interactives-helpers/src/hooks/use-linked-interactive-id";
import SnapShotIcon from "../assets/snapshot-image-icon.svg";
import { Log } from "../labbook-logging";

import css from "./upload-button.scss";

export interface IProps {
  authoredState?: IGenericAuthoredState; // so it works with DrawingTool and ImageQuestion
  interactiveState?: IGenericInteractiveState | null;
  selectedItemHasImageUrl?: boolean;
  setInteractiveState?: (updateFunc: (prevState: IGenericInteractiveState | null) => IGenericInteractiveState) => void;
  onUploadStart?: () => void;
  disabled?: boolean;
  text?: string;
  onUploadImage: (url: string, mode?: "replace" | "create") => void;
  onUploadComplete?: (result: { success: boolean }) => void;
  handleUploadModalClick?: (type: string) => void;
  uploadMode?: "replace" | "create";
  showUploadModal?: boolean;
}

export const TakeSnapshot: React.FC<IProps> = ({ authoredState, interactiveState, selectedItemHasImageUrl, disabled, text,
    uploadMode, showUploadModal, setInteractiveState, onUploadImage, onUploadStart, onUploadComplete, handleUploadModalClick }) => {
  const [ snapshotInProgress, setSnapshotInProgress ] = useState(false);
  const snapshotTarget = useLinkedInteractiveId("snapshotTarget");

  const handleSnapshot = async () => {
    if (snapshotTarget) {
      onUploadStart?.();
      setSnapshotInProgress(true);
      const response = await getInteractiveSnapshot({ interactiveItemId: snapshotTarget });
      setSnapshotInProgress(false);
      if (response.success && response.snapshotUrl) {
        onUploadImage(response.snapshotUrl, uploadMode);
        authoredState && setInteractiveState?.(prevState => ({
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

  const handleTakeSnapshot = () => {
    if (selectedItemHasImageUrl && !showUploadModal) {
      handleUploadModalClick && handleUploadModalClick("snapshot");
    } else {
      handleSnapshot();
    }
  };

  return (
    <>
      {
        snapshotTarget &&
          <UploadButton onClick={handleTakeSnapshot}
            disabled={snapshotInProgress || disabled}
            data-testid="snapshot-btn">
                <SnapShotIcon />
                <div className={css["runtime button-text"]}>
                { snapshotInProgress || disabled
                  ? "Please Wait"
                  : text
                }
                </div>
          </UploadButton>
      }
    </>
  );
};
