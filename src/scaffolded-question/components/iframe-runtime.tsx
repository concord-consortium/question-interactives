import React, { useEffect, useRef, useState } from "react";
import { renderHTML } from "../../shared/utilities/render-html";
import { IframePhone } from "../../shared/types";
import iframePhone from "iframe-phone";
import css from "./iframe-runtime.scss";
import { IHintRequest, log } from "@concord-consortium/lara-interactive-api";

// This should be part of lara-interactive-api
interface ILogRequest {
  action: string;
  data: object;
}

interface IProps {
  url: string;
  id: string;
  authoredState: any;
  interactiveState: any;
  setInteractiveState: (state: any) => void;
  scaffoldedQuestionLevel: number;
  report?: boolean;
}

export const IframeRuntime: React.FC<IProps> =
  ({ url, id, authoredState, interactiveState, setInteractiveState, report, scaffoldedQuestionLevel }) => {
  const [ iframeHeight, setIframeHeight ] = useState(300);
  const [ hint, setHint ] = useState("");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const phoneRef = useRef<IframePhone>();

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
    });
    phone.addListener("hint", (newHint: IHintRequest) => {
      setHint(newHint.text || "");
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
    <div>
      <iframe ref={iframeRef} src={url} width="100%" height={iframeHeight} frameBorder={0} />
      { hint &&
        <div className={css.hint}>{renderHTML(hint)}</div> }
    </div>
  )
};
