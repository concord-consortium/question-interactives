import { MutableRefObject, useCallback, useEffect, useRef, useState } from "react";
import { IframePhone } from "../types";
import iframePhone from "iframe-phone";
import {
  closeModal, ICloseModal, IHintRequest, IShowModal, log, showModal
} from "@concord-consortium/lara-interactive-api";

// This should be part of lara-interactive-api
interface ILogRequest {
  action: string;
  data: Record<string, unknown>;
}

interface IProps {
  authoredState: any;
  hasModal?: boolean;
  iframeRef: any;
  interactiveStateRef: any;
  logRequestData?: Record<string, unknown>;
  setInteractiveStateRef: MutableRefObject<(state: any) => void>;
  report?: boolean;
  url: string;
}

export const useIframeRuntimeSetup =
  ({ iframeRef, interactiveStateRef, url, authoredState, setInteractiveStateRef, report, logRequestData, hasModal }: IProps) => {
  const [ , setIframeHeight ] = useState(300);
  const [ , setHint ] = useState(authoredState.hint);
  const phoneRef = useRef<IframePhone>();

  const initInteractive = useCallback(() => {
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
      log(logData.action, logRequestData);
    });
    phone.post("initInteractive", {
      mode: report ? "report" : "runtime",
      authoredState,
      // This is a trick not to depend on interactiveState.
      interactiveState: interactiveStateRef.current
    });
    if (hasModal) {
      phone.addListener("showModal", (modalOptions: IShowModal) => {
        if (modalOptions.type === "dialog") {
          // Note that dialog is very different from lightbox and alert - it depends on the interactive state.
          // It'd require quite complex code to handle it. Lightbox only displays provided URL (for example hi-res image)
          // and there's no associated state. Alert shows provided message. However, dialog renders complete
          // interactive, so it needs to receive correct interactive state. Carousel would need to capture provided URL,
          // modify it so it still points to carousel interactive instead of the subinteractive, send it to parent,
          // open itself in dialog, hide carousel UI and provide correct state to the subinteractive. It's doable, but
          // not necessary at this point, as none of the carousel interactives uses "dialog" modal type.
          window.alert("Dialog is not supported within carousel.");
          return;
        }
        showModal(modalOptions);
      });
      phone.addListener("closeModal", (modalOptions: ICloseModal) => {
        closeModal(modalOptions);
      });
    }
  },[]);
  console.log("iframeRef: ", iframeRef);
  console.log("authoredState: ", authoredState, "hint:", authoredState.hint);
  console.log("interactiveStateRef: ", interactiveStateRef);

  useEffect (() => {
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
  },[]);
};
