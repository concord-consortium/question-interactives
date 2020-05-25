import { useState, useEffect, useRef } from "react";
import iframePhone from "iframe-phone";
import { IframePhone, Mode } from "../types";

interface IConfig {
  authoredState: boolean;
  interactiveState: boolean;
  aspectRatio?: number;
}

export const useLARAInteractiveAPI = <AS, IS>(config: IConfig) => {
  const phone = useRef<IframePhone>();
  const [ mode, setMode ] = useState<Mode>();
  const [ authoredState, setAuthoredState ] = useState<AS>();
  const [ interactiveState, setInteractiveState ] = useState<IS>();

  const initInteractive = (data: any) => {
    // LARA sometimes sends string (report page), sometimes already parsed JSON (authoring, runtime).
    const laraAuthoredState = typeof data.authoredState === "string" ? JSON.parse(data.authoredState) : data.authoredState;
    const laraInteractiveState = typeof data.interactiveState === "string" ? JSON.parse(data.interactiveState) : data.interactiveState;
    setAuthoredState(laraAuthoredState);
    setInteractiveState(laraInteractiveState);
    setMode(data.mode);
  };

  const getInteractiveState = () => {
    phone.current?.post("interactiveState", interactiveState);
  };

  const handleAuthoredStateChange = (state: any) => {
    setAuthoredState(state);
    phone.current?.post("authoredState", state);
  };

  const handleInteractiveStateChange = (state: any) => {
    setInteractiveState(state);
    phone.current?.post("interactiveState", state);
  };

  const handleSetHeight = (height: number) => {
    phone.current?.post("height", height);
  };

  const handleSetHint = (hint: string) => {
    phone.current?.post("hint", hint);
  };

  const handleSetNavigation = (enableForwardNav: boolean, message: string) => {
    phone.current?.post("navigation", { enableForwardNav, message });
  };

  useEffect(() => {
    const intPhone = iframePhone.getIFrameEndpoint();
    intPhone.addListener("initInteractive", initInteractive);
    intPhone.addListener("getInteractiveState", getInteractiveState);
    // Initialize connection after all message listeners are added!
    intPhone.initialize();
    phone.current = intPhone;
    // Cleanup function.
    return () => {
      phone.current?.disconnect();
    }
  }, []);

  useEffect(() => {
    // Note that this callback might be executed multiple times, e.g. when aspectRatio is updated.
    // LARA seems to accept that perfectly fine. It would be nicer if it was possible to set aspect ratio
    // on its own, without sending the complete configuration each time. But it doesn't seem to break anything.
    const features: any = {};
    if (config.authoredState) {
      features.authoredState = true;
    }
    if (config.interactiveState) {
      features.interactiveState = true;
    }
    if (config.aspectRatio) {
      features.aspectRatio = config.aspectRatio;
    }
    phone.current?.post("supportedFeatures", {
      apiVersion: 1,
      features
    });
  }, [config.authoredState, config.interactiveState, config.aspectRatio])

  return {
    mode,
    authoredState,
    interactiveState,
    setAuthoredState: handleAuthoredStateChange,
    setInteractiveState: handleInteractiveStateChange,
    setHeight: handleSetHeight,
    setHint: handleSetHint,
    setNavigation: handleSetNavigation,
  };
}
