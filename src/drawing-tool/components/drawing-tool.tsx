import React, { useCallback, useEffect, useRef } from "react";
import DrawingToolLib from "drawing-tool";
import { IAuthoredState, IInteractiveState } from "./app";
import predefinedStampCollections from "./stamp-collections";
import 'drawing-tool/dist/drawing-tool.css';
import css from "./runtime.scss";

const kToolbarWidth = 40;
const kToolbarHeight = 600;

export interface IProps {
  authoredState: IAuthoredState;
  interactiveState?: IInteractiveState | null;
  setInteractiveState?: (updateFunc: (prevState: IInteractiveState | null) => IInteractiveState) => void;
  readOnly?: boolean;
}

interface StampCollections {
  [collectionName: string]: string[];
}

interface DrawingToolOpts {
  width: number;
  height: number;
  stamps?: StampCollections;
}

export const DrawingTool: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState, readOnly }) => {
  // need a wrapper as `useRef` expects (state) => void
  const handleSetInteractiveState = (newState: Partial<IInteractiveState>) => {
    setInteractiveState?.(prevState => ({
      ...prevState,
      ...newState,
      answerType: "interactive_state"
    }));
  };
  // useRef to avoid passing interactiveState into useEffect, or it will reload on every drawing edit
  const initialInteractiveStateRef = useRef<IInteractiveState | null | undefined>(interactiveState);
  const setInteractiveStateRef = useRef<((state: any) => void)>(handleSetInteractiveState);
  initialInteractiveStateRef.current = interactiveState;
  setInteractiveStateRef.current = handleSetInteractiveState;

  const drawingToolRef = useRef<any>();

  const setBackground = useCallback((userBackgroundImageUrl: string | undefined) => {
    if (!drawingToolRef.current) {
      return;
    }
    let backgroundImgSrc: string | undefined;
    if (authoredState.backgroundSource === "url") {
      backgroundImgSrc = authoredState.backgroundImageUrl;
    } else if (authoredState.backgroundSource === "upload" || authoredState.backgroundSource === "snapshot") {
      backgroundImgSrc = userBackgroundImageUrl;
    }

    const bgPosition = authoredState.imagePosition || "center";
    const bgFit = authoredState.imageFit || "shrinkBackgroundToCanvas";
    const imageOpts = {
      src: backgroundImgSrc, // note that undefined / null is a valid value (used to remove background)
      position: bgPosition
    };
    if (bgFit === "resizeCanvasToBackground") {
      imageOpts.position = "center"; // anything else is an invalid combo
    }
    drawingToolRef.current.pauseHistory();
    drawingToolRef.current.setBackgroundImage(imageOpts, bgFit, () => {
      drawingToolRef.current.unpauseHistory();
    });
  }, [authoredState.backgroundImageUrl, authoredState.backgroundSource, authoredState.imageFit, authoredState.imagePosition]);

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

    drawingToolRef.current = new DrawingToolLib("#drawing-tool-container", drawingToolOpts);

    if (initialInteractiveStateRef.current) {
      drawingToolRef.current.load(initialInteractiveStateRef.current.drawingState, () => {
        // Load finished callback. Set manually background that is stored outside in the interactive or authored state.
        setBackground(initialInteractiveStateRef.current?.userBackgroundImageUrl);
      }, true);
    }

    drawingToolRef.current.on("drawing:changed", () => {
      if (readOnly) return;
      setInteractiveStateRef.current({ drawingState: drawingToolRef.current.save() });
    });
  }, [authoredState, readOnly, setBackground]);

  useEffect(() => {
    setBackground(interactiveState?.userBackgroundImageUrl);
  }, [interactiveState?.userBackgroundImageUrl, setBackground]);

  return (
    <div className={css.drawingtoolWrapper}>
      { readOnly && <div className={css.clickShield} /> }
      <div id="drawing-tool-container" className={css.runtime} />
    </div>
  );
};
