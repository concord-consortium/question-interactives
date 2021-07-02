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
  }, []);

  useEffect(() => {
    const onChange = () => forceUpdate();
    screenfull?.on("change", onChange);
    return () => screenfull?.off("change", onChange);
  }, [forceUpdate]);

  const getIframeTransforms = (_window: any, _screen: any) => {
    const MAX_WIDTH = 2000;
    // Scale iframe, but make sure that:
    // 1. Iframe is smaller than MAX_WIDTH which should be enough for all the documents. It prevents creating
    //    some huge CODAP canvases on really big screens (e.g. 4k monitors).
    // 2. Iframe is not smaller than size of the current window.
    const width  = Math.max(_window.innerWidth, Math.min(MAX_WIDTH, _screen.width));
    const scale  = _window.innerWidth  / width;
    const height = _window.innerHeight / scale;
    return {
      scale: scale,
      unscaledWidth: width,
      unscaledHeight: height
    };
  };

  const subinteractives = authoredState.subinteractives || [];
  if (subinteractives.length === 0) {
    return <div>No sub items available. Please add them using the authoring interface.</div>;
  }

  const subStates = interactiveState?.subinteractiveStates;

  const handleNewInteractiveState = (interactiveId: string, newInteractiveState: any) => {
    setInteractiveState?.((prevState: IInteractiveState) => {
      const updatedStates = {...prevState?.subinteractiveStates, [interactiveId]: newInteractiveState };
      return {
        ...prevState,
        answerType: "interactive_state",
        subinteractiveStates: updatedStates,
      };
    });
  };

  return (
    <div className={css.runtime}>
      {subinteractives.map((interactive, index) => {
        const subState = subStates && subStates[interactive.id];
        return (
          <div key={interactive.id} className={`${css.runtime}`} >
            { authoredState.prompt &&
                <div>{renderHTML(authoredState.prompt)}</div> }
                  <IframeRuntime
                    key={interactive.id}
                    id={interactive.id}
                    url={libraryInteractiveIdToUrl(interactive.libraryInteractiveId, "full-screen")}
                    authoredState={interactive.authoredState}
                    interactiveState={subState}
                    setInteractiveState={handleNewInteractiveState.bind(null, interactive.id)}
                  />
                </div>
        );
      })}

      {screenfull && <FullScreenButton isFullScreen={screenfull.isFullscreen} handleToggleFullScreen={toggleFullScreen} />}
    </div>
  );
};
