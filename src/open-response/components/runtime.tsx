import React from "react";
import { IAuthoredState } from "./app";
import { IInteractiveState } from "./app";

interface IProps {
  authoredState: IAuthoredState;
  interactiveState?: IInteractiveState;
  setInteractiveState?: (state: IInteractiveState) => void;
  report?: boolean;
}

export const Runtime: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState, report }) => {
  const readOnly = report || (authoredState.required && interactiveState?.submitted);
  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (setInteractiveState) {
      setInteractiveState(Object.assign({}, interactiveState, { response: event.target.value }));
    }
  };

  return (
    <div>
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
    </div>
  );
};
