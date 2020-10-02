import React, { useMemo, useState } from "react";
import { IRuntimeQuestionComponentProps } from "../../shared/components/base-question-app";
import { renderHTML } from "../../shared/utilities/render-html";
import { IAuthoredState, IInteractiveState } from "./app";
import { Runtime as DrawingToolRuntime } from "../../drawing-tool/components/runtime";
import { IAuthoredState as IDrawingAuthoredState } from "../../drawing-tool/components/app";
import { IInteractiveState as IDrawingInteractiveState } from "../../drawing-tool/components/app";
import { showModal, getInteractiveSnapshot } from "@concord-consortium/lara-interactive-api";
import { v4 as uuidv4 } from "uuid";
import ZoomIcon from "../../shared/icons/zoom.svg";
import CameraIcon from "../../shared/icons/camera.svg";
import css from "./runtime.scss";
import cssHelpers from "../../shared/styles/helpers.scss";

// https://stackoverflow.com/a/52703444
type OptionalExceptFor<T, TRequired extends keyof T> = Partial<T> & Pick<T, TRequired>;
type IPartialDrawingInteractiveState = OptionalExceptFor<IDrawingInteractiveState, "drawingState">;

interface IProps extends IRuntimeQuestionComponentProps<IAuthoredState, IInteractiveState> {
}

const kGlobalDefaultAnswer = "Please type your answer here.";

export const Runtime: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState, report }) => {
  const { version, imageFit, imagePosition, required, stampCollections, modalSupported } = authoredState;
  const readOnly = report || (required && interactiveState?.submitted);
  const [ snapshotInProgress, setSnapshotInProgress ] = useState(false);

  const drawingAuthoredState = useMemo<IDrawingAuthoredState>(() => ({
    version,
    imageFit,
    imagePosition,
    stampCollections,
    questionType: "iframe_interactive"
  }), [imageFit, imagePosition, stampCollections, version]);

  const handleSetInteractiveState = (newState: Partial<IInteractiveState>) => {
    setInteractiveState?.((prevState: IInteractiveState) => ({
      ...prevState,
      ...newState,
      answerType: "interactive_state"
    }));
  };

  const handleDrawingChange = (userState: string) => {
    handleSetInteractiveState({ drawingState: userState });
  };

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    handleSetInteractiveState({ answerText: event.target.value });
  };

  const handleModal = () => {
    const uuid = uuidv4();
    showModal({ uuid, type: "lightbox", url: window.location.href });
  };

  const handleSnapshot = async () => {
    if (authoredState.snapshotTarget) {
      setSnapshotInProgress(true);
      const response = await getInteractiveSnapshot({ interactiveItemId: authoredState.snapshotTarget });
      setSnapshotInProgress(false);
      if (response.success && response.snapshotUrl) {
        handleSetInteractiveState({ snapshotUrl: response.snapshotUrl });
      } else {
        window.alert("Snapshot has failed. Please try again.");
      }
    }
  };

  return (
    <fieldset>
      { authoredState.prompt &&
        <legend className={css.prompt}>
          {renderHTML(authoredState.prompt)}
        </legend> }
      <DrawingToolRuntime
        authoredState={drawingAuthoredState}
        interactiveState={{ drawingState: interactiveState?.drawingState || "", answerType: "interactive_state"}}
        snapshotBackgroundUrl={interactiveState?.snapshotUrl}
        onDrawingChange={handleDrawingChange}
        report={report} />
      <div>
        {authoredState.answerPrompt && <div className={css.answerPrompt}>{authoredState.answerPrompt}</div>}
        <textarea
          value={interactiveState?.answerText || ""}
          onChange={readOnly ? undefined : handleTextChange}
          readOnly={readOnly}
          disabled={readOnly}
          rows={8}
          placeholder={authoredState.defaultAnswer || kGlobalDefaultAnswer}
        />
      </div>
      {modalSupported && <div className={`${css.viewHighRes} .glyphicon-zoom-in`} onClick={handleModal}><ZoomIcon /></div>}
      {
        authoredState.useSnapshot && authoredState.snapshotTarget &&
        <button className={cssHelpers.laraButton} onClick={handleSnapshot} disabled={snapshotInProgress} data-test="snapshot-btn">
          <CameraIcon className={cssHelpers.smallIcon} /> { interactiveState?.snapshotUrl ? "Replace snapshot" : "Take a snapshot" }
        </button>
      }
      { snapshotInProgress && <p>Please wait while the snapshot is being taken...</p> }
      {
        authoredState.useSnapshot && authoredState.snapshotTarget === undefined &&
        <p className={css.warn}>Snapshot won&apos;t work, as the target interactive is not selected</p>
      }
    </fieldset>
  );
};
