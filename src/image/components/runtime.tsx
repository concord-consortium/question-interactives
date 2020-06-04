import React from "react";
import { IAuthoredState } from "./app";
import { IInteractiveState } from "./app";
import css from "./runtime.scss";

interface IProps {
  authoredState: IAuthoredState;
  interactiveState?: IInteractiveState;
  setInteractiveState?: (state: IInteractiveState) => void;
  report?: boolean;
}

export const Runtime: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState, report }) => {

  return (
    <div className={css.runtime}>
      <div>
        <img
          src={authoredState.url}
          alt={authoredState.caption}
        />
        {authoredState.creditLink && <div className={css.creditLink}><a href={authoredState.creditLink} target="_blank">
        {authoredState.creditLink ? authoredState.creditLink : ""}
      </a></div>}
      </div>
    </div>
  );
};
