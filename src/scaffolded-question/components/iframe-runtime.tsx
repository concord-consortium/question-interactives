import React, { useContext, useEffect, useRef, useState } from "react";
import { IframePhone } from "../../shared/types";
import iframePhone from "iframe-phone";
import { AutoHeightContext } from "../../shared/hooks/use-auto-height";

interface IProps {
  url: string;
  authoredState: any;
  interactiveState: any;
  setInteractiveState: (state: any) => void;
  report?: boolean;
}

export const IframeRuntime: React.FC<IProps> = ({ url, authoredState, interactiveState, setInteractiveState, report }) => {
  const [ iframeHeight, setIframeHeight ] = useState(300);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const phoneRef = useRef<IframePhone>();
  const { notifyHeightUpdated } = useContext(AutoHeightContext);

  const initInteractive = () => {
    const phone = phoneRef.current;
    if (!phone) {
      return;
    }
    phone.addListener("interactiveState", (newInteractiveState: any) => {
      setInteractiveState(newInteractiveState);
    });
    phone.addListener("height", (newHeight: number) => {
      setIframeHeight(newHeight);
      notifyHeightUpdated();
    });
    phone.post("initInteractive", {
      mode: report ? "report" : "runtime",
      authoredState,
      interactiveState
    });
  }

  useEffect(() => {
    if (iframeRef.current) {
      phoneRef.current = new iframePhone.ParentEndpoint(iframeRef.current, initInteractive);
    }
    // Cleanup.
    return () => {
      if (phoneRef.current) {
        phoneRef.current.disconnect();
      }
    }
  }, [url]);

  useEffect(() => {
    if (phoneRef.current) {
      phoneRef.current.disconnect();
    }
    if (iframeRef.current) {
      // Reload the iframe.
      iframeRef.current.src = url;
      // Re-init interactive, this time using a new mode (report or runtime).
      phoneRef.current = new iframePhone.ParentEndpoint(iframeRef.current, initInteractive);
    }
  }, [report])

  return (
    <iframe ref={iframeRef} src={url} width="100%" height={iframeHeight} frameBorder={0} />
  )
};
