import React from "react";
import { IAuthoredState } from "./authoring";
import css from "./runtime.scss";
import { useRequiredQuestion } from "../../shared/hooks/use-required-question";

export interface IInteractiveState {
  response: string;
  submitted?: boolean;
}

interface IProps {
  authoredState: IAuthoredState;
  interactiveState?: IInteractiveState;
  setInteractiveState?: (state: IInteractiveState) => void;
  report?: boolean;
  setNavigation?: (enableForwardNav: boolean, message: string) => void;
}

export const Runtime: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState, setNavigation, report }) => {
  const isAnswered = !!interactiveState?.response;
  const { submitButton, lockedInfo } = useRequiredQuestion({ authoredState, interactiveState, setInteractiveState, setNavigation, isAnswered });

  const readOnly = report || (authoredState.required && interactiveState?.submitted);

  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (setInteractiveState) {
      setInteractiveState(Object.assign({}, interactiveState, { response: event.target.value }));
    }
  };

  return (
    <div className={css.runtime}>
      { authoredState.prompt && <div>{ authoredState.prompt }</div> }
      <div>
        <textarea
          value={interactiveState?.response}
          onChange={readOnly ? undefined : handleChange}
          readOnly={readOnly}
          disabled={readOnly}
          rows={8}
          placeholder={authoredState.defaultAnswer || "Type answer here"}
        />
      </div>
      {
        authoredState.extraInstructions &&
        <div className={css.extraInstructions}>{ authoredState.extraInstructions }</div>
      }
      {
        !report &&
        <div>
          { submitButton }
          { lockedInfo }
        </div>
      }
    </div>
  );
};
