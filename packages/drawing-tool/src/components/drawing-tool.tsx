import React, { useCallback, useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import classNames from "classnames";
import DrawingToolLib from "drawing-tool";
import { getAnswerType, IGenericAuthoredState, IGenericInteractiveState, StampCollection } from "./types";
import predefinedStampCollections from "./stamp-collections";
import 'drawing-tool/dist/drawing-tool.css';
import { shouldUseLARAImgProxy } from "@concord-consortium/question-interactives-helpers/src/hooks/use-cors-image-error-check";
import css from "./runtime.scss";

const kToolbarWidth = 40; // Drawing Tool buttons are 40x40
const kDrawingToolPreferredWidth = 600; // in practice it can be smaller if there's not enough space
const kDrawingToolHeight = 600;

const kDrawingToolButtons = ["select","free","linesPalette","shapesPalette","text","stamp","strokeColorPalette","fillColorPalette","strokeWidthPalette","clone","sendToBack","sendToFront","undo","redo","trash"];

// Use LARA image proxy to avoid tainting canvas when external image URL is used.
export const LARA_IMAGE_PROXY = "https://authoring.concord.org/image-proxy?url=";

export interface IProps {
  authoredState: IGenericAuthoredState; // so it works with DrawingTool and ImageQuestion
  interactiveState?: IGenericInteractiveState | null;
  setInteractiveState?: (updateFunc: (prevState: IGenericInteractiveState | null) => IGenericInteractiveState) => void;
  readOnly?: boolean;
  buttons?: string[];
  width?: number;
  height?: number;
  canvasScale?: number;
  hideReadOnlyOverlay?: boolean;
  onDrawingChanged?: () => void;
  wideLayout?: boolean;
}

interface StampCollections {
  [collectionName: string]: string[];
}

interface DrawingToolOpts {
  width: number;
  height: number;
  stamps?: StampCollections;
  buttons?: string[];
  onDrawingChanged?: () => void;
  canvasScale?: number;
  wideLayout?: boolean;
}

// This relies on DrawingTool internals obviously. Let's keep it at least in a single place. If it ever changes,
// it'll be easier to update selectors and find usages.
export const drawingToolCanvasSelector = `canvas.lower-canvas`;

const getCollectionName = (collection: StampCollection) => {
  let name: string;
  if (collection.name) {
    name = collection.name;
  } else if (collection.collection === "ngsaObjects") {
    // remove "ngsa" from name of predefined collection
    name = "Objects";
  } else {
    name = collection.collection.charAt(0).toUpperCase() + collection.collection.slice(1);
  }
  return name;
};

export const DrawingTool: React.FC<IProps> = ({ authoredState, interactiveState, setInteractiveState,
  readOnly, buttons, width, height, canvasScale, hideReadOnlyOverlay, onDrawingChanged, wideLayout }) => {
  const drawingToolRef = useRef<any>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [ containerId ] = useState<string>(uuidv4());

  // need a wrapper as `useRef` expects (state) => void
  const handleSetInteractiveState = (newState: Partial<IGenericInteractiveState>) => {
    setInteractiveState?.(prevState => ({
      ...prevState,
      ...newState,
      answerType: getAnswerType(authoredState.questionType)
    }));
  };

  // useRef to avoid passing interactiveState into useEffect, or it will reload on every drawing edit
  const initialInteractiveStateRef = useRef<IGenericInteractiveState | null | undefined>(interactiveState);
  const setInteractiveStateRef = useRef<((state: any) => void)>(handleSetInteractiveState);
  initialInteractiveStateRef.current = interactiveState;
  setInteractiveStateRef.current = handleSetInteractiveState;

  const setBackground = useCallback((userBackgroundImageUrl: string | undefined) => {
    if (!drawingToolRef.current) {
      return;
    }
    let backgroundImgSrc: string | undefined;

    if (userBackgroundImageUrl || authoredState.backgroundSource === "upload" || authoredState.backgroundSource === "snapshot") {
      // userBackgroundImageUrl is used even when authoredState.backgroundSource === "url". The authored background
      // will be replaced by the user provided one. There is no UI that allows for that in the Drawing Tool or Image Question,
      // but it's possible in the Labbook that uses this component. See: https://www.pivotaltracker.com/story/show/183592738/comments/233945746
      backgroundImgSrc = userBackgroundImageUrl;
    } else  if (authoredState.backgroundSource === "url") {
      backgroundImgSrc = shouldUseLARAImgProxy(authoredState.backgroundImageUrl) ?
        LARA_IMAGE_PROXY + authoredState.backgroundImageUrl : authoredState.backgroundImageUrl;
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
    drawingToolRef.current.setBackgroundImage(imageOpts, bgFit, () => {
      drawingToolRef.current.resetHistory();
    });
  }, [authoredState.backgroundImageUrl, authoredState.backgroundSource, authoredState.imageFit, authoredState.imagePosition]);

  useEffect(() => {
    if (!drawingToolRef.current) {
      const stampCollections: StampCollections = {};
      authoredState.stampCollections?.forEach(collection => {
        const baseName = getCollectionName(collection);
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

      // optionally hide buttons
      const finalButtons = (buttons ?? kDrawingToolButtons).slice();
      const hideButtons = authoredState.hideDrawingTools ?? [];
      hideButtons.forEach(button => {
        finalButtons.splice(finalButtons.indexOf(button), 1);
      });

      // window.innerWidth should never be used in practice. It's here just to make TypeScript happy
      // and/or handle some unexpected edge case where containerRef is really undefined.
      const availableWidth = containerRef.current?.clientWidth || window.innerWidth;
      const drawingToolOpts: DrawingToolOpts = {
        // Drawing Tool width and height describe canvas dimensions. They do NOT include toolbar dimensions.
        width: width || Math.min(kDrawingToolPreferredWidth, availableWidth - kToolbarWidth),
        height: height || kDrawingToolHeight,
        canvasScale,
        buttons: finalButtons,
        onDrawingChanged,
        wideLayout
      };

      if (Object.keys(stampCollections).length > 0) {
        drawingToolOpts.stamps = stampCollections;
      }

      drawingToolRef.current = new DrawingToolLib(`#${containerId}`, drawingToolOpts);
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
    }
  }, [authoredState, readOnly, setBackground, buttons, width, height, onDrawingChanged, containerId, canvasScale, wideLayout]);

  useEffect(() => {
    setBackground(interactiveState?.userBackgroundImageUrl);
  }, [interactiveState?.userBackgroundImageUrl, setBackground]);

  // When Drawing Tool is in read-only mode, support dynamic updated of interactive state.
  // It's used by Labbook Thumbnails that watch the main canvas and update themselves when there's any change there.
  useEffect(() => {
    const currentDtState = drawingToolRef.current.save();
    if (readOnly && interactiveState?.drawingState && interactiveState.drawingState !== currentDtState) {
      drawingToolRef.current.load(interactiveState?.drawingState);
    }
  }, [interactiveState, readOnly]);

  return (
    <div ref={containerRef} className={css.drawingtoolWrapper}>
      { readOnly && !hideReadOnlyOverlay && <div className={css.clickShield} /> }
      <div id={containerId} className={classNames(css.runtime, {[css.readOnly]: readOnly })} />
    </div>
  );
};
