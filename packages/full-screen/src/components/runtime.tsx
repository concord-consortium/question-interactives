import React, { useCallback, useEffect } from "react";
import _screenfull from "screenfull";
import queryString from "query-string";
import { FullScreenButton } from "./full-screen-button";
import { useForceUpdate } from "@concord-consortium/question-interactives-helpers/src/hooks/use-force-update";
import { IframeRuntime } from "@concord-consortium/question-interactives-helpers/src/components/iframe-runtime";
import { IRuntimeQuestionComponentProps } from "@concord-consortium/question-interactives-helpers/src/components/base-question-app";
import {
  setHint,
  setSupportedFeatures,
  useAccessibility,
  useInitMessage
} from "@concord-consortium/lara-interactive-api";
import { IAuthoredState, IInteractiveState } from "./types";

const screenfull = _screenfull.isEnabled ? _screenfull : undefined;

// NOTE: Runtime does NOT recalculate the URL - it uses the pre-calculated
// wrappedInteractiveUrl from authoredState (set during authoring)

export const Runtime: React.FC<IRuntimeQuestionComponentProps<IAuthoredState, IInteractiveState>> = ({
  authoredState,
  interactiveState,
  setInteractiveState
}) => {
  const forceUpdate = useForceUpdate();
  const initMessage = useInitMessage();

  // Check if fullscreen mode is disabled.
  // NOTE: disableFullscreen is a negative boolean - undefined/false means fullscreen IS enabled.
  // This ensures backward compatibility: interactives without authored state default to fullscreen.
  const fullscreenDisabled = authoredState?.disableFullscreen === true;

  const toggleFullScreen = useCallback(() => {
    screenfull?.toggle();
  }, []);

  const accessibility = useAccessibility();

  useEffect(() => {
    const onChange = () => forceUpdate();
    screenfull?.on("change", onChange);
    window.addEventListener('resize', onChange);
    return () => {
      screenfull?.off("change", onChange);
      window.removeEventListener('resize', onChange);
    };
  }, [forceUpdate]);

  // Filter out malformed postMessage events that crash iframe-phone.
  // CODAP and other apps may send messages in non-JSON formats (e.g., "!_{"h":""}").
  // iframe-phone tries to JSON.parse all messages, which throws on non-JSON strings.
  // This capturing listener intercepts and suppresses these messages before iframe-phone sees them.
  useEffect(() => {
    const filterMalformedMessages = (event: MessageEvent) => {
      if (typeof event.data === "string") {
        // Check for messages that would fail JSON.parse in iframe-phone
        // These include CODAP's internal messages that start with "!_" or other non-JSON formats
        if (event.data.startsWith("!_") || event.data.startsWith("setImmediate")) {
          event.stopImmediatePropagation();
        }
      }
    };
    // Use capturing phase to intercept before iframe-phone's listener
    window.addEventListener("message", filterMalformedMessages, true);
    return () => {
      window.removeEventListener("message", filterMalformedMessages, true);
    };
  }, []);

  useEffect(() => {
    const aspectRatio = screen.width / screen.height;
    setSupportedFeatures({
      interactiveState: true,
      aspectRatio
    });
  }, [initMessage]);

  const isFullScreen = screenfull?.isFullscreen;

  // getIframeTransforms function calculates scale and dimensions for the iframe
  // based on window/screen size. Patterned after the jQuery-based implementation in
  // Cloud File Manager: https://github.com/concord-consortium/cloud-file-manager/blob/master/src/code/autolaunch/fullscreen.ts
  const getIframeTransforms = (_window: Window, _screen: Screen) => {
    const MAX_WIDTH = 2000;
    // Scale iframe, but make sure that:
    // 1. Iframe is smaller than MAX_WIDTH which should be enough for all the documents. It prevents creating
    //    some huge CODAP canvases on really big screens (e.g. 4k monitors).
    // 2. Iframe is not smaller than size of the current window.
    const width  = Math.max(_window.innerWidth, Math.min(MAX_WIDTH, _screen.width));
    const scale  = _window.innerWidth  / width;
    const height = _window.innerHeight / scale;
    return { scale, unscaledWidth: width, unscaledHeight: height };
  };

  const setScaling = () => {
    let scaledIframeWidth: number | string, scaledIframeHeight: number | string, scaledIframeTransformOrigin: string, scaledIframeTransform: string;
    if (!isFullScreen) {
      const trans = getIframeTransforms(window, screen);
      scaledIframeWidth = trans.unscaledWidth;
      scaledIframeHeight = trans.unscaledHeight;
      scaledIframeTransformOrigin = "top left";
      scaledIframeTransform = "scale3d(" + trans.scale + "," + trans.scale + ",1)";
    } else {
      // Disable scaling in fullscreen mode.
      scaledIframeWidth = "100%";
      scaledIframeHeight = "100%";
      scaledIframeTransformOrigin = "";
      scaledIframeTransform = "scale3d(1,1,1)";
    }

    return {
      width: scaledIframeWidth,
      height: scaledIframeHeight,
      transformOrigin: scaledIframeTransformOrigin,
      transform: scaledIframeTransform,
      display: "inline",
      position: "fixed",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    };
  };

  // Simple wrapper mode (no scaling, no fullscreen button)
  const setNotScaling = () => {
    return {
      width: "100%",
      height: "100%",
      display: "inline",
      position: "fixed",
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    };
  };

  // Use pre-calculated URL from authored state, or fall back to query param
  // The URL is calculated during authoring and stored - no recalculation here
  const wrappedInteractive = queryString.parse(location.search)?.wrappedInteractive;
  const queryUrl = Array.isArray(wrappedInteractive) ? wrappedInteractive[0] : wrappedInteractive;
  const url = authoredState?.wrappedInteractiveUrl || queryUrl;

  if (!url) {
    return <div>Wrapped interactive is not configured.</div>;
  }

  // Use setNotScaling() when fullscreen is disabled, otherwise use setScaling()
  const iframeStyle = fullscreenDisabled ? setNotScaling() : setScaling();

  return (
    <>
      <IframeRuntime url={url}
                     iframeStyling={iframeStyle}
                     interactiveState={interactiveState}
                     setInteractiveState={setInteractiveState || (() => null)}
                     setHint={setHint}
                     initMessage={initMessage}
                     report={initMessage?.mode === "report"}
                     flushOnSave={true}
                     accessibility={accessibility}
      />
      {screenfull && !fullscreenDisabled &&
        <FullScreenButton isFullScreen={screenfull.isFullscreen} handleToggleFullScreen={toggleFullScreen} />}
    </>
  );
};
