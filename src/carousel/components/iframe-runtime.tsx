import React, { useEffect, useRef, useState } from "react";
import { renderHTML } from "../../shared/utilities/render-html";
import { IframePhone } from "../../shared/types";
import iframePhone from "iframe-phone";
import css from "./iframe-runtime.scss";
import {
  closeModal, ICloseModal, IHintRequest, IShowModal, log, showModal
} from "@concord-consortium/lara-interactive-api";

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
  scaffoldedQuestionLevel: number;
  report?: boolean;
  navImageUrl?: string;
}

export const IframeRuntime: React.FC<IProps> =
  ({ url, id, authoredState, interactiveState, setInteractiveState, report, scaffoldedQuestionLevel, navImageUrl }) => {
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
      phone.addListener("showModal", (modalOptions: IShowModal) => {
        if (modalOptions.type === "dialog") {
          // Note that dialog is very different from lightbox and alert - it depends on the interactive state.
          // It'd require quite complex code to handle it. Lightbox ony displays provided URL (for example hi-res image)
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
      phone.addListener("log", (logData: ILogRequest) => {
        log(logData.action, {
          ...logData.data,
          scaffolded_question_level: scaffoldedQuestionLevel,
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
  }, [url, authoredState, report, id, scaffoldedQuestionLevel, navImageUrl]);

  return (
    <div>
      <iframe ref={iframeRef} src={url} width="100%" height={iframeHeight} frameBorder={0} />
      { hint &&
        <div className={css.hint}>{renderHTML(hint)}</div> }
    </div>
  );
};
