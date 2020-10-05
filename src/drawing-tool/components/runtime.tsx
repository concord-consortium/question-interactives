import React, { useCallback, useEffect, useRef } from "react";
import DrawingTool from "drawing-tool";
import 'drawing-tool/dist/drawing-tool.css';
import { IAuthoredState, IInteractiveState } from "./app";
import css from "./runtime.scss";
import predefinedStampCollections from "./stamp-collections";
import { renderHTML } from "../../shared/utilities/render-html";

const kToolbarWidth = 40;
const kToolbarHeight = 600;

export interface IProps {
  authoredState: IAuthoredState;
  interactiveState?: IInteractiveState | null;
  setInteractiveState?: (updateFunc: (prevState: IInteractiveState | null) => IInteractiveState) => void;
  report?: boolean;
  onDrawingChange?: (userState: string) => void;
  snapshotBackgroundUrl?: string; // useful when DrawingToolRuntime is used within ImageQuestionRuntime
}

interface StampCollections {
  [collectionName: string]: string[];
}

interface DrawingToolOpts {
  width: number;
  height: number;
  stamps?: StampCollections;
}

export const Runtime: React.FC<IProps> = ({ authoredState, interactiveState, snapshotBackgroundUrl, setInteractiveState, report, onDrawingChange }) => {
  const readOnly = !!(report || (authoredState.required && interactiveState?.submitted));

  // need a wrapper as `useRef` expects (state) => void
  const handleSetInteractiveState = (userState: string) => {
    if (onDrawingChange) {
      // handle the change in a parent component
      onDrawingChange(userState);
    } else {
      setInteractiveState?.(prevState => ({
        ...prevState,
        drawingState: userState,
        answerType: "interactive_state"
      }));
    }
  };
  // useRef to avoid passing interactiveState into useEffect, or it will reload on every drawing edit
  const initialInteractiveStateRef = useRef<any>(interactiveState);
  const setInteractiveStateRef = useRef<((state: any) => void)>(handleSetInteractiveState);
  const initialSnapshotBgUrlRef = useRef(snapshotBackgroundUrl);
  initialInteractiveStateRef.current = interactiveState;
  initialSnapshotBgUrlRef.current = snapshotBackgroundUrl;
  setInteractiveStateRef.current = handleSetInteractiveState;

  const drawingToolRef = useRef<any>();

  const setBackgroundImage = useCallback((bgProps: { backgroundImageUrl?: string; imagePosition?: string; imageFit?: string}) => {
    if (!drawingToolRef.current || !bgProps.backgroundImageUrl) {
      return;
    }
    const imageOpts = {
      src: bgProps.backgroundImageUrl,
      position: bgProps.imagePosition
    };
    if (bgProps.imageFit === "resizeCanvasToBackground") {
      imageOpts.position = "center"; // anything else is an invalid combo
    }
    drawingToolRef.current.pauseHistory();
    drawingToolRef.current.setBackgroundImage(imageOpts, bgProps.imageFit, () => {
      drawingToolRef.current.unpauseHistory();
    });
  }, []);

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

    drawingToolRef.current = new DrawingTool("#drawing-tool-container", drawingToolOpts);

    // Snapshot background has higher priority than authored background.
    if (initialSnapshotBgUrlRef.current) {
      setBackgroundImage({
        backgroundImageUrl: initialSnapshotBgUrlRef.current,
        imageFit: "shrinkBackgroundToCanvas"
      });
    } else if (authoredState.backgroundImageUrl) {
      setBackgroundImage(authoredState);
    }

    if (initialInteractiveStateRef.current) {
      drawingToolRef.current.load(initialInteractiveStateRef.current.drawingState, null, true);
    }

    drawingToolRef.current.on('drawing:changed', () => {
      if (readOnly) return;
      const userState = drawingToolRef.current.save();
      setInteractiveStateRef.current(userState);
    });
  }, [authoredState, report, readOnly, setBackgroundImage]);

  useEffect(() => {
    setBackgroundImage({
      backgroundImageUrl: snapshotBackgroundUrl,
      imageFit: "shrinkBackgroundToCanvas"
    });
  }, [setBackgroundImage, snapshotBackgroundUrl]);

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
