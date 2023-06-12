import React, { useState } from "react";
import 'drawing-tool/dist/drawing-tool.css';
import css from "./runtime.scss";
import cssHelpers from "@concord-consortium/question-interactives-helpers/src/styles/helpers.scss";
import SnapshotIcon from "@concord-consortium/question-interactives-helpers/src/icons/snapshot-icon.svg";
import { getInteractiveSnapshot } from "@concord-consortium/lara-interactive-api";
import { getAnswerType, IGenericAuthoredState, IGenericInteractiveState } from "./types";
import { useLinkedInteractiveId } from "@concord-consortium/question-interactives-helpers/src/hooks/use-linked-interactive-id";
import classnames from "classnames";

export interface IProps {
  authoredState: IGenericAuthoredState; // so it works with DrawingTool and ImageQuestion
  interactiveState?: IGenericInteractiveState | null;
  setInteractiveState?: (updateFunc: (prevState: IGenericInteractiveState | null) => IGenericInteractiveState) => void;
  onUploadStart?: () => void;
  onUploadComplete?: (result: { success: boolean }) => void;
}

export const TakeSnapshot: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState, onUploadStart, onUploadComplete }) => {
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
          answerImageUrl: response.snapshotUrl,
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
        snapshotTarget &&
        <button className={classnames(cssHelpers.interactiveButton, cssHelpers.withIcon)} onClick={handleSnapshot} disabled={snapshotInProgress} data-testid="snapshot-btn">
          <SnapshotIcon />
          <div className={cssHelpers.buttonText}>{ interactiveState?.userBackgroundImageUrl ? "Replace Snapshot" : "Take a Snapshot" }</div>
        </button>
      }
      { snapshotInProgress && <p>Please wait while the snapshot is being taken...</p> }
      {
        snapshotTarget === undefined &&
        <p className={css.warn}>Snapshot won&apos;t work, as no target interactive is selected</p>
      }
    </>
  );
};
