import React, {useCallback, useEffect, useRef, useState} from "react";
import DrawingTool from "drawing-tool";
import 'drawing-tool/dist/drawing-tool.css';
import { IAuthoredState, IInteractiveState } from "./app";
import css from "./runtime.scss";
import predefinedStampCollections from "./stamp-collections";
import { renderHTML } from "../../shared/utilities/render-html";
import {getInteractiveSnapshot} from "@concord-consortium/lara-interactive-api";
import cssHelpers from "../../shared/styles/helpers.scss";
import CameraIcon from "../../shared/icons/camera.svg";
import { copyImageToS3, copyLocalImageToS3 } from "../../shared/utilities/copy-image-to-s3";

const kToolbarWidth = 40;
const kToolbarHeight = 600;

export interface IProps {
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
  const [ snapshotInProgress, setSnapshotInProgress ] = useState(false);
  const [ uploadControlsVisible, setUploadControlsVisible ] = useState(false);
  const [ uploadInProgress, setUploadInProgress ] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    drawingToolRef.current = new DrawingTool("#drawing-tool-container", drawingToolOpts);

    if (initialInteractiveStateRef.current) {
      drawingToolRef.current.load(initialInteractiveStateRef.current.drawingState, () => {
        // Load finished callback. Set manually background that is stored outside in the interactive or authored state.
        setBackground(initialInteractiveStateRef.current?.userBackgroundImageUrl);
      }, true);
    }

    drawingToolRef.current.on('drawing:changed', () => {
      if (readOnly) return;
      setInteractiveStateRef.current({ drawingState: drawingToolRef.current.save() });
    });
  }, [authoredState, report, readOnly, setBackground]);

  useEffect(() => {
    setBackground(interactiveState?.userBackgroundImageUrl);
  }, [interactiveState?.userBackgroundImageUrl, setBackground]);

  const handleSnapshot = async () => {
    if (authoredState.snapshotTarget) {
      setSnapshotInProgress(true);
      const response = await getInteractiveSnapshot({ interactiveItemId: authoredState.snapshotTarget });
      setSnapshotInProgress(false);
      if (response.success && response.snapshotUrl) {
        handleSetInteractiveState({ userBackgroundImageUrl: response.snapshotUrl });
      } else {
        window.alert("Snapshot has failed. Please try again.");
      }
    }
  };

  const handleUploadBtnClick = () => {
    setUploadControlsVisible(true);
  };
  
  const uploadFile = (fileOrUrl: File | string) => {
    setUploadControlsVisible(false);
    setUploadInProgress(true);
    // Always copy image to S3 using Shutterbug, so it works even when the image disappears from the external location.
    // Local image could be theoretically stored as dataSrc but it might be too big for Firestore storage that
    // is used by ActivityPlayer. So, copying to S3 is a safer option.
    (typeof fileOrUrl === "string" ? copyImageToS3(fileOrUrl) : copyLocalImageToS3(fileOrUrl))
      .then(url => {
        handleSetInteractiveState({ userBackgroundImageUrl: url });
      })
      .catch((error) => {
        window.alert(error);
        console.error(error);
      })
      .finally(() => {
        setUploadInProgress(false);
      });
  };

  const handleFileUpload = () => {
    const file = fileInputRef.current?.files?.[0];
    if (file) {
      uploadFile(file);
    }
  };

  const handleFileDrop = (event: React.DragEvent) => {
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      // Local file dropped.
      uploadFile(file);
    } else {
      // URL dragged.
      const items = event.dataTransfer?.items;
      const item = Array.from(items).find(i => i.kind === "string" && i.type.match(/^text\/uri-list/));
      item?.getAsString(src => {
        uploadFile(src);
      });
    }
    cancelEvent(event);
  };

  // Necessary to make file drop work.
  const cancelEvent = (event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const useSnapshot = authoredState?.backgroundSource === "snapshot";
  const useUpload = authoredState?.backgroundSource === "upload";

  return (
    <div>
      {/* Drawing Tool UI: */}
      { authoredState.prompt && <div>{renderHTML(authoredState.prompt)}</div> }
      <div className={css.drawingtoolWrapper}>
        { readOnly && <div className={css.clickShield} /> }
        <div id="drawing-tool-container" className={css.runtime} />
      </div>
      {/* Snapshot UI: */}
      {
        useSnapshot && authoredState.snapshotTarget &&
        <button className={cssHelpers.laraButton} onClick={handleSnapshot} disabled={snapshotInProgress} data-test="snapshot-btn">
          <CameraIcon className={cssHelpers.smallIcon} /> { interactiveState?.userBackgroundImageUrl ? "Replace snapshot" : "Take a snapshot" }
        </button>
      }
      { snapshotInProgress && <p>Please wait while the snapshot is being taken...</p> }
      {
        useSnapshot && authoredState.snapshotTarget === undefined &&
        <p className={css.warn}>Snapshot won&apos;t work, as no target interactive is selected</p>
      }
      {/* Upload UI: */}
      {
        useUpload && !uploadControlsVisible && !uploadInProgress &&
        <button className={cssHelpers.laraButton} onClick={handleUploadBtnClick} data-test="upload-btn">
          Upload image
        </button>
      }
      {
        uploadControlsVisible &&
        <div>
          <div className={css.dropArea} onDrop={handleFileDrop} onDragEnter={cancelEvent} onDragOver={cancelEvent}>Drop an image here or click the button below to choose an image</div>
          <input ref={fileInputRef} type="file" onChange={handleFileUpload} />
        </div>
      }
      {
        uploadInProgress &&
        <div className={css.uploadInfo}>
          Please wait while image is being uploaded...
        </div>
      }
    </div>
  );
};
