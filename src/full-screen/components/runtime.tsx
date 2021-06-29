import React, { useState } from "react";
import screenfull from "screenfull";
import { IAuthoredState } from "./types";
import { FullScreenButton } from "./full-screen-button";
import css from "./runtime.scss";

interface IProps {
  authoredState: IAuthoredState;
}

export const Runtime: React.FC<IProps> = ({ authoredState }) => {
  const [ isFullScreen, setIsFullScreen ] = useState<boolean>(false);

  const onToggleFullScreen = () => {
    if (screenfull.isEnabled) {
      screenfull.toggle();
      screenfull.on("change", () => {
        setIsFullScreen(!isFullScreen);
      });
    }
  };

  return (
    <div className={css.runtime}>
      <div className={`${css.iframeContainer}`} >
        This is the scaling interactive
      </div>
      <FullScreenButton isFullScreen={isFullScreen} handleToggleFullScreen={onToggleFullScreen} />
    </div>
  );
};
