import React from "react";
import { IAuthoredState } from "./authoring";
import css from "./runtime.scss";

export interface IInteractiveState {
  response: string;
}

interface IProps {
  authoredState: IAuthoredState | null;
  interactiveState?: IInteractiveState | null;
  setInteractiveState?: (state: IInteractiveState) => void;
  report?: boolean;
}

export const Runtime: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState, report }) => {
  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (setInteractiveState) {
      setInteractiveState(Object.assign({}, interactiveState, { response: event.target.value }));
    }
  };

  return (
    <div className={css.runtime}>
      { authoredState?.prompt && <div>{ authoredState.prompt }</div> }
      <div>
        <textarea
          value={interactiveState?.response}
          onChange={report ? undefined : handleChange}
          readOnly={report}
          disabled={report}
          rows={8}
          placeholder={authoredState?.defaultAnswer || "Type answer here"}
        />
      </div>
      {
        authoredState?.extraInstructions &&
        <div className={css.extraInstructions}>{ authoredState.extraInstructions }</div>
      }
    </div>
  );
};
