import React, { useEffect } from "react";
import { IAuthoredState } from "./app";
import { IInteractiveState } from "./app";
import css from "./runtime.scss";

interface IProps {
  authoredState: IAuthoredState;
  interactiveState?: IInteractiveState;
  setInteractiveState?: (updateFunc: (prevState: IInteractiveState | null) => IInteractiveState) => void;
  report?: boolean;
}

export const Runtime: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState, report }) => {
  useEffect(() => {
    updateState();
  }, []);
  const updateState = () => {
    setInteractiveState?.(prevState => ({...prevState, viewed: true }));
  };

  return (
    <div className={css.runtime}>
      <div className={css.imageContainer}>
        <img
          src={authoredState.url}
          alt={authoredState.altText}
          title={authoredState.altText}
        />
      </div>
      {authoredState.caption && <div className={css.caption}>{authoredState.caption}</div>}
      {authoredState.credit && <div className={css.credit}>{authoredState.credit}</div>}
      {
        authoredState.creditLink &&
        <div className={css.creditLink}>
          <a href={authoredState.creditLink} target="_blank">
            {authoredState.creditLinkDisplayText ? authoredState.creditLinkDisplayText : authoredState.creditLink}
          </a>
        </div>
      }
    </div>
  );
};
