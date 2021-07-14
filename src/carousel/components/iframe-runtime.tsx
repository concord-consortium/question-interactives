import React, { useEffect, useRef, useState } from "react";
import { renderHTML } from "../../shared/utilities/render-html";
import css from "./iframe-runtime.scss";
import { useIframeRuntimeSetup } from "../../shared/hooks/use-iframe-runtime-setup";

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
  navImageUrl?: string;
  navImageAltText?: string;
}

export const IframeRuntime: React.FC<IProps> =
  ({ url, id, authoredState, interactiveState, setInteractiveState, report, navImageUrl, navImageAltText }) => {
  const [ iframeHeight, setIframeHeight ] = useState(300);
  const [ hint, setHint ] = useState("");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  // Why is interativeState and setInteractiveState kept in refs? So it's not necessary to declare these variables as
  // useEffect's dependencies. Theoretically this useEffect callback is perfectly fine either way, but since
  // it reloads the iframe each time it's called, it's not a great experience for user when that happens while he is
  // interacting with the iframe (e.g. typing in textarea). And interactiveState is being updated very often,
  // as well as setInteractiveState that is generated during each render of the parent component.
  const interactiveStateRef = useRef<any>(interactiveState);
  const setInteractiveStateRef = useRef<((state: any) => void)>(setInteractiveState);
  interactiveStateRef.current = interactiveState;
  setInteractiveStateRef.current = setInteractiveState;
  const logRequestData: Record<string, unknown> = {
    // ...logRecordData,
    subinteractive_url: url,
    subinteractive_type: authoredState.questionType,
    subinteractive_sub_type: authoredState.questionSubType,
    subinteractive_id: id
  };
  const hasModal = true;
  const iframeRuntimeSetup = useIframeRuntimeSetup({authoredState,
                                                    hasModal,
                                                    iframeRef,
                                                    interactiveStateRef,
                                                    logRequestData,
                                                    setInteractiveStateRef,
                                                    report,
                                                    url
                                                  });
  useEffect(()=>{
    iframeRuntimeSetup;
  },[]);

  return (
    <div>
      <iframe ref={iframeRef} src={url} width="100%" height={iframeHeight} frameBorder={0} />
      { hint &&
        <div className={css.hint}>{renderHTML(hint)}</div> }
    </div>
  );
};
