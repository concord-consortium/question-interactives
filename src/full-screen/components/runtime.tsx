import React, { useCallback, useEffect} from "react";
import _screenfull from "screenfull";
import queryString from "query-string";
import { IAuthoredState, IInteractiveState } from "./types";
import { FullScreenButton } from "./full-screen-button";
import { useForceUpdate } from "../../shared/hooks/use-force-update";
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

  const params = queryString.parse(window.location.search);
  const subinteractiveUrl = params.wrappedInteractive as string || undefined;
  if (!subinteractiveUrl) {
    return <div>No sub items available. Please add them using the authoring interface.</div>;
  } else {
    return (
      <div className={css.runtime}>
        <div className={css.runtime} >
          { (authoredState.prompt && authoredState.subinteractive) &&
            <div>{renderHTML(authoredState.prompt)}</div> }
            {subinteractiveUrl && <iframe className={css.subInteractiveIframe} src={subinteractiveUrl} />}
        </div>
        {screenfull && <FullScreenButton isFullScreen={screenfull.isFullscreen} handleToggleFullScreen={toggleFullScreen} />}
      </div>
    );
  }
};
