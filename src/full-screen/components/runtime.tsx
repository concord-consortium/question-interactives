import React, { useCallback, useEffect } from "react";
import _screenfull from "screenfull";
import { IAuthoredState } from "./types";
import { FullScreenButton } from "./full-screen-button";
import css from "./runtime.scss";
import { useForceUpdate } from "../../shared/hooks/use-force-update";

interface IProps {
  authoredState: IAuthoredState;
  interactiveState?: IInteractiveState | null;
  setInteractiveState?: (updateFunc: (prevState: IInteractiveState | null) => IInteractiveState) => void;
}

}

const screenfull = _screenfull.isEnabled ? _screenfull : undefined;

export const Runtime: React.FC<IProps> = ({ authoredState }) => {
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

  const fullscreenSupport = (iframe: any) => {
    const target = iframe;

    function setScaling () {
      if (!isFullScreen) {
        const trans = getIframeTransforms(window, screen);
        target.css('width', trans.unscaledWidth);
        target.css('height', trans.unscaledHeight);
        target.css('transform-origin', 'top left');
        target.css('transform', 'scale3d(' + trans.scale + ',' + trans.scale + ',1)');
      } else {
        // Disable scaling in fullscreen mode.
        target.css('width', '100%');
        target.css('height', '100%');
        target.css('transform', 'scale3d(1,1,1)');
      }
    }
    setScaling();

    window.onresize = setScaling;
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
