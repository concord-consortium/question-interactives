import React from "react";
import { IRuntimeQuestionComponentProps } from "../../shared/components/base-question-app";
import { IAuthoredState, IInteractiveState } from "./app";
import { Runtime as DrawingToolRuntime } from "../../drawing-tool/components/runtime";
import { showModal } from "@concord-consortium/lara-interactive-api";
import { v4 as uuidv4 } from "uuid";
import ZoomIcon from "../../shared/icons/zoom.svg";
import css from "./runtime.scss";

interface IProps extends IRuntimeQuestionComponentProps<IAuthoredState, IInteractiveState> {}

const kGlobalDefaultAnswer = "Please type your answer here.";

export const Runtime: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState, report }) => {
  const { required, modalSupported } = authoredState;
  const readOnly = report || (required && interactiveState?.submitted);

  const handleSetInteractiveState = (newState: Partial<IInteractiveState>) => {
    setInteractiveState?.((prevState: IInteractiveState) => ({
      ...prevState,
      ...newState,
      answerType: "interactive_state"
    }));
  };

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    handleSetInteractiveState({ answerText: event.target.value });
  };

  const handleModal = () => {
    const uuid = uuidv4();
    showModal({ uuid, type: "lightbox", url: window.location.href });
  };

  return (
    <fieldset>
      <DrawingToolRuntime
        authoredState={authoredState}
        interactiveState={interactiveState}
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
    </fieldset>
  );
};
