import React, { useEffect, useRef, useState } from "react";
import { renderHTML } from "../../shared/utilities/render-html";
import { IframePhone } from "../../shared/types";
import iframePhone from "iframe-phone";
import css from "./iframe-runtime.scss";
import { IHintRequest, log } from "@concord-consortium/lara-interactive-api";

// This should be part of lara-interactive-api
interface ILogRequest {
  action: string;
  data: Record<string, unknown>;
}

interface IProps {
  url: string;
  id: string;
  authoredState: any;
  interactiveState: any;
  setInteractiveState: (state: any) => void;
  report?: boolean;
  isFullScreen: boolean;
}

export const IframeRuntime: React.FC<IProps> =
  ({ url, id, authoredState, interactiveState, setInteractiveState, report, isFullScreen }) => {
  const [ iframeHeight, setIframeHeight ] = useState(300);
  const [ hint, setHint ] = useState("");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const phoneRef = useRef<IframePhone>();
  // Why is interativeState and setInteractiveState kept in refs? So it's not necessary to declare these variables as
  // useEffect's dependencies. Theoretically this useEffect callback is perfectly fine either way, but since
  // it reloads the iframe each time it's called, it's not a great experience for user when that happens while he is
  // interacting with the iframe (e.g. typing in textarea). And interactiveState is being updated very often,
  // as well as setInteractiveState that is generated during each render of the parent component.
  const interactiveStateRef = useRef<any>(interactiveState);
  const setInteractiveStateRef = useRef<((state: any) => void)>(setInteractiveState);
  interactiveStateRef.current = interactiveState;
  setInteractiveStateRef.current = setInteractiveState;

  useEffect(() => {
    const initInteractive = () => {
      const phone = phoneRef.current;
      if (!phone) {
        return;
      }
      phone.addListener("interactiveState", (newInteractiveState: any) => {
        setInteractiveStateRef.current?.(newInteractiveState);
      });
      phone.addListener("height", (newHeight: number) => {
        setIframeHeight(newHeight);
      });
      phone.addListener("hint", (newHint: IHintRequest) => {
        setHint(newHint.text || "");
      });
      phone.addListener("log", (logData: ILogRequest) => {
        log(logData.action, {
          ...logData.data,
          subinteractive_url: url,
          subinteractive_type: authoredState.questionType,
          subinteractive_sub_type: authoredState.questionSubType,
          subinteractive_id: id
        });
      });
      phone.post("initInteractive", {
        mode: report ? "report" : "runtime",
        authoredState,
        // This is a trick not to depend on interactiveState.
        interactiveState: interactiveStateRef.current
      });
    };

    if (iframeRef.current) {
      // Reload the iframe.
      iframeRef.current.src = url;
      // Re-init interactive, this time using a new mode (report or runtime).
      phoneRef.current = new iframePhone.ParentEndpoint(iframeRef.current, initInteractive);
    }
    // Cleanup.
    return () => {
      if (phoneRef.current) {
        phoneRef.current.disconnect();
      }
    };
  }, [url, authoredState, report, id]);

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

  const setScaling = () => {
    let scaledIframeWidth: number | string, scaledIframeHeight: number | string, scaledIframeTransformOrigin: string, scaledIframeTransform: string;
    if (isFullScreen) {
      const trans = getIframeTransforms(window, screen);
      scaledIframeWidth = trans.unscaledWidth;
      scaledIframeHeight = trans.unscaledHeight;
      scaledIframeTransformOrigin = "top left";
      scaledIframeTransform = "scale3d(" + trans.scale + "," + trans.scale + ",1)";
    } else {
      // Disable scaling in fullscreen mode.
      scaledIframeWidth = "100%";
      scaledIframeHeight = iframeHeight;
      scaledIframeTransformOrigin = "";
      scaledIframeTransform = "scale3d(1,1,1)";
    }

    return {
      width: scaledIframeWidth,
      height: scaledIframeHeight,
      transformOrigin: scaledIframeTransformOrigin,
      transform: scaledIframeTransform
    };
  };

  return (
    <div>
      <iframe ref={iframeRef} src={url} style={setScaling()} frameBorder={0} />
      { hint &&
        <div className={css.hint}>{renderHTML(hint)}</div> }
    </div>
  );
};
