import React, { useCallback, useEffect } from "react";
import _screenfull from "screenfull";
import { IAuthoredState, IInteractiveState } from "./types";
import { FullScreenButton } from "./full-screen-button";
import { useForceUpdate } from "../../shared/hooks/use-force-update";
import { IframeRuntime } from "./iframe-runtime";
import { libraryInteractiveIdToUrl } from "../../shared/utilities/library-interactives";
import { renderHTML } from "../../shared/utilities/render-html";

import css from "./runtime.scss";

interface IProps {
  authoredState: IAuthoredState;
  interactiveState?: IInteractiveState | null;
  setInteractiveState?: (updateFunc: (prevState: IInteractiveState | null) => IInteractiveState) => void;
}

const screenfull = _screenfull.isEnabled ? _screenfull : undefined;

export const Runtime: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState }) => {
  const forceUpdate = useForceUpdate();
  const toggleFullScreen = useCallback(() => {
    screenfull?.toggle();
  },[]);

  useEffect(() => {
    const onChange = () => forceUpdate();
    screenfull?.on("change", onChange);
    return () => screenfull?.off("change", onChange);
  }, [forceUpdate]);

  const subinteractive = authoredState.subinteractive || null;
  if (!subinteractive) {
    return <div>No sub items available. Please add them using the authoring interface.</div>;
  }

  const subState = interactiveState?.subinteractiveState;

  const handleNewInteractiveState = (newInteractiveState: any) => {
    setInteractiveState?.((prevState: IInteractiveState) => {
      const updatedState = {...prevState?.subinteractiveState, newInteractiveState };
      return {
        ...prevState,
        answerType: "interactive_state",
        subinteractiveState: updatedState,
      };
    });
  };
  // console.log("in runtime authoredState: ", authoredState);
  return (
    <div className={css.runtime}>
      <div className={css.runtime} >
        { (authoredState.prompt && authoredState.subinteractive) &&
          <div>{renderHTML(authoredState.prompt)}</div> }
            <IframeRuntime
              id={subinteractive.id}
              url={authoredState.subinteractive.subInteractiveUrl}
              authoredState={subinteractive.authoredState}
              interactiveState={subState}
              setInteractiveState={handleNewInteractiveState.bind(null, subinteractive.id)}
            />
      </div>
      {screenfull && <FullScreenButton isFullScreen={screenfull.isFullscreen} handleToggleFullScreen={toggleFullScreen} />}
    </div>
  );
};
