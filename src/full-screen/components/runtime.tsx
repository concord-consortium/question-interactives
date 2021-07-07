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

  const params = queryString.parse(location.search);
  const hash = queryString.parse(location.hash);
  const sharedDoc = hash.shared ? "#shared="+hash.shared : "";
  const preUrl = params?.wrappedInteractive + sharedDoc;
  const subinteractiveUrl = preUrl && encodeURI(preUrl);

  if (!subinteractiveUrl) {
    return <div>No sub items available. Please add them using the authoring interface.</div>;
  } else {
    return (
      <div className={css.runtime}>
        <div className={css.runtime} >
          <iframe className={css.subInteractiveIframe} src={subinteractiveUrl} />
        </div>
        {screenfull && <FullScreenButton isFullScreen={screenfull.isFullscreen} handleToggleFullScreen={toggleFullScreen} />}
      </div>
    );
  }
};
