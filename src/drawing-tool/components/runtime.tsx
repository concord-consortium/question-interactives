import React, { useRef, useEffect } from "react";
import DrawingTool from "drawing-tool";
import 'drawing-tool/dist/drawing-tool.css';
import { IAuthoredState, IInteractiveState } from "./app";
import css from "./runtime.scss";
import predefinedStampCollections from "./stamp-collections";
import { renderHTML } from "../../shared/utilities/render-html";

const kToolbarWidth = 40;
const kToolbarHeight = 600;

interface IProps {
  authoredState: IAuthoredState;
  interactiveState?: IInteractiveState | null;
  setInteractiveState?: (updateFunc: (prevState: IInteractiveState | null) => IInteractiveState) => void;
  report?: boolean;
}

interface StampCollections {
  [collectionName: string]: string[];
}

interface DrawingToolOpts {
  width: number;
  height: number;
  stamps?: StampCollections;
}

export const Runtime: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState, report }) => {

  const readOnly = !!(report || (authoredState.required && interactiveState?.submitted));

  // equivalent to componentDidLoad
  useEffect(() => {
    const windowWidth = window.innerWidth;

    const stampCollections: StampCollections = {};
    authoredState.stampCollections?.forEach(collection => {
      const baseName = collection.name || collection.collection.charAt(0).toUpperCase() + collection.collection.slice(1);
      let name = baseName;
      let i = 0;
      while (stampCollections[name]) {
        name = `${baseName} ${++i}`;
      }
      let stamps: string[];
      if (collection.collection === "custom") {
        stamps = collection.stamps || [];
        const urlRegex = /^(https:|http:)\/\/\S+/;
        stamps = stamps.map(url => url.replace(/ /g,'')).filter(url => url.match(urlRegex));
      } else {
        stamps = predefinedStampCollections[collection.collection];
      }
      if (stamps && stamps.length) {
        stampCollections[name] = stamps;
      }
    });

    const drawingToolOpts: DrawingToolOpts = {
      width: windowWidth - kToolbarWidth - 10,
      height: kToolbarHeight
    };

    if (Object.keys(stampCollections).length > 0) {
      drawingToolOpts.stamps = stampCollections;
    }

    const drawingTool = new DrawingTool("#drawing-tool-container", drawingToolOpts);

    if (authoredState.backgroundImageUrl) {
      const imageOpts = {
        src: authoredState.backgroundImageUrl,
        position: authoredState.imagePosition
      };

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
      if (readOnly) return;
      const userState = drawingTool.save();
      setInteractiveState?.(prevState => ({
        ...prevState,
        answerText: userState,
        answerType: "interactive_state"
      }));
    });
  }, []);

  return (
    <div>
      { authoredState.prompt && <div>{renderHTML(authoredState.prompt)}</div>}
      <div className={css.drawingtoolWrapper}>
        { readOnly && <div className={css.clickShield} /> }
        <div id="drawing-tool-container" className={css.runtime} />
      </div>
    </div>
  );
};
