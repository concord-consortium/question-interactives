import React from "react";
import { IRuntimeQuestionComponentProps } from "../../shared/components/base-question-app";
import { IAuthoredState, IInteractiveState } from "./types";
import css from "./runtime.scss";

interface IProps extends IRuntimeQuestionComponentProps<IAuthoredState, IInteractiveState> {
}

export const Runtime: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState, report }) => {
  const readOnly = report || (authoredState.required && interactiveState?.submitted);
  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInteractiveState?.(prevState => ({...prevState, answerType: "open_response_answer", answerText: event.target.value }));
  };

  return (
    <fieldset>
      { authoredState.prompt &&
        <legend className={css.prompt}
          dangerouslySetInnerHTML={{ __html: authoredState.prompt }} /> }
      <div>
        <textarea
          value={interactiveState?.answerText}
          onChange={readOnly ? undefined : handleChange}
          readOnly={readOnly}
          disabled={readOnly}
          rows={8}
          placeholder={authoredState.defaultAnswer || "Please type your answer here."}
        />
      </div>
    </fieldset>
  );
};
