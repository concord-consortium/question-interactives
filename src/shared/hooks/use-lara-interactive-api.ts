import { useState, useEffect, useRef } from "react";
import iframePhone from "iframe-phone";
import { IframePhone, Mode } from "../types";

interface IConfig {
  authoredState: boolean;
  interactiveState: boolean;
  aspectRatio?: number;
}

export const useLARAInteractiveAPI = (config: IConfig) => {
  const phone = useRef<IframePhone>();
  const [ mode, setMode ] = useState<Mode>();
  const [ authoredState, setAuthoredState ] = useState<any>();
  const [ interactiveState, setInteractiveState ] = useState<any>();

  const initInteractive = (data: any) => {
    setAuthoredState(data.authoredState);
    setInteractiveState(data.interactiveState);
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
  }

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
    phone.current?.post("supportedFeatures", {
      apiVersion: 1,
      features: {
        authoredState: config.authoredState,
        interactiveState: config.interactiveState,
        aspectRatio: config.aspectRatio
      }
    });
  }, [config.authoredState, config.interactiveState, config.aspectRatio])

  return {
    mode,
    authoredState,
    interactiveState,
    setAuthoredState: handleAuthoredStateChange,
    setInteractiveState: handleInteractiveStateChange
  };
}
