import React, { useRef, useEffect } from "react";
import DrawingTool from "drawing-tool";
import 'drawing-tool/dist/drawing-tool.css';
import { IAuthoredState, IInteractiveState } from "./app";
import css from "./runtime.scss";

const kToolbarWidth = 40;
const kToolbarHeight = 600;

interface IProps {
  authoredState: IAuthoredState;
  interactiveState?: IInteractiveState | null;
  setInteractiveState?: (updateFunc: (prevState: IInteractiveState | null) => IInteractiveState) => void;
  report?: boolean;
}

interface IImageSize {
  width: number;
  height: number;
}

export const Runtime: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState, report }) => {

  // equivalent to componentDidLoad
  useEffect(() => {
    const windowWidth = window.innerWidth;

    const drawingTool = new DrawingTool("#drawing-tool-container", {
      width: windowWidth - kToolbarWidth - 5,
      height: kToolbarHeight
    });

    if (authoredState.backgroundImageUrl) {
      const imageOpts = {
        src: authoredState.backgroundImageUrl,
        position: authoredState.imagePosition
      }

      if (authoredState.imageFit === "resizeCanvasToBackground") {
        imageOpts.position = "center";      // anything else is an invalid combo
      }

      drawingTool.pauseHistory();
      drawingTool.setBackgroundImage(imageOpts, authoredState.imageFit, () => {
        drawingTool.unpauseHistory();
      });
    }

    if (interactiveState) {
      drawingTool.load(interactiveState.answerText, null, true);
    }

    drawingTool.on('drawing:changed', () => {
      const userState = drawingTool.save();
      setInteractiveState?.(prevState => ({
        ...prevState,
        answerText: userState,
        answerType: "interactive_state"
      }))
    });
  }, []);

  return (
    <div id="drawing-tool-container" className={css.runtime} />
  );
};
