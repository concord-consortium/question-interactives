import React, { useCallback, useEffect } from "react";
import _screenfull from "screenfull";
import queryString from "query-string";
import { FullScreenButton } from "./full-screen-button";
import { useForceUpdate } from "../../shared/hooks/use-force-update";

import css from "./runtime.scss";

const screenfull = _screenfull.isEnabled ? _screenfull : undefined;

export const Runtime: React.FC = () => {
  const forceUpdate = useForceUpdate();
  const toggleFullScreen = useCallback(() => {
    screenfull?.toggle();
  },[]);

  useEffect(() => {
    const onChange = () => forceUpdate();
    screenfull?.on("change", onChange);
    window.addEventListener('resize', onChange);
    return () => {
      screenfull?.off("change", onChange);
      window.removeEventListener('resize', onChange);
    };
  }, [forceUpdate]);

  const isFullScreen = screenfull?.isFullscreen;
  // This code is patterned after the jQuery-based implementation in 'fullscreen.ts' in the
  // [Cloud File Manager](https://github.com/concord-consortium/cloud-file-manager/blob/master/src/code/autolaunch/fullscreen.ts).
  const getIframeTransforms = (_window: Window, _screen: Screen) => {
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
      transform: scaledIframeTransform
    };
  };

  const iframeStyle = setScaling();

  const params = queryString.parse(location.search);
  const hash = queryString.parse(location.hash);
  const sharedDoc = hash.shared ? "#shared="+hash.shared : "";
  const preUrl = params?.wrappedInteractive + sharedDoc;
  const subinteractiveUrl = preUrl && encodeURI(preUrl);

  if (!subinteractiveUrl) {
    return <div>No sub items available. Please add them using the authoring interface.</div>;
  } else {
    return (
      <>
        <iframe className={css.subInteractiveIframe} style={iframeStyle} src={subinteractiveUrl} />
        {screenfull &&
          <FullScreenButton isFullScreen={screenfull.isFullscreen} handleToggleFullScreen={toggleFullScreen} />}
      </>
    );
  }
};
