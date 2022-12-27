import React, { useEffect, useState } from "react";

import css from "./full-screen-button.scss";

interface IProps {
  isFullScreen: boolean;
  handleToggleFullScreen: () => void
}

export const FullScreenButton: React.FC<IProps> = (props) => {
  const {isFullScreen, handleToggleFullScreen} = props;
  const [isHintHidden, setIsHintHidden] = useState(false);
  useEffect(() => {
    setTimeout(() => {
      setIsHintHidden(true);
    }, 4000);
  });

  return (
    <div className={css.fullScreenToggle}>
      <div id="fullScreenHelp" className={`${css.fullScreenHelp} ${isHintHidden? css.hidden : ""}`} >
        Click here to enter/exit fullscreen →
      </div>
      <div>
        <button className={`${css.fullScreenIcon} ${isFullScreen? css.fullscreen : ""}`}
           onClick={handleToggleFullScreen} />
      </div>
    </div>
  );
};
