import React, { useCallback, useEffect } from "react";
import _screenfull from "screenfull";
import { IAuthoredState } from "./types";
import { FullScreenButton } from "./full-screen-button";
import css from "./runtime.scss";
import { useForceUpdate } from "../../shared/hooks/use-force-update";

interface IProps {
  authoredState: IAuthoredState;
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

  return (
    <div className={css.runtime}>
      {screenfull && <FullScreenButton isFullScreen={screenfull.isFullscreen} handleToggleFullScreen={toggleFullScreen} />}
    </div>
  );
};
