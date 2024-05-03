import React, { useEffect, useRef, useState } from "react";
import iframePhone from "iframe-phone";
import { DynamicText } from "@concord-consortium/dynamic-text";
import { renderHTML } from "@concord-consortium/question-interactives-helpers/src/utilities/render-html";
import { closeModal, flushStateUpdates, getClient, IAccessibilitySettings, IAddLinkedInteractiveStateListenerRequest, IAttachmentUrlRequest, IAttachmentUrlResponse, ICloseModal, ICustomMessage, IGetInteractiveState, IHintRequest, IInitInteractive, IShowModal, log, setOnUnload, showModal } from "@concord-consortium/lara-interactive-api";

import { IframePhone } from "../types";
import { getLibraryInteractive } from "../utilities/library-interactives";

import css from "./iframe-runtime.scss";

// This should be part of lara-interactive-api
interface ILogRequest {
  action: string;
  data: Record<string, unknown>;
}

interface IProps {
  authoredState?: any;
  id?: string;
  iframeStyling?: any;
  interactiveState: any;
  logRequestData?: Record<string, unknown>;
  report?: boolean;
  readOnly?: boolean;
  url: string;
  initMessage?: IInitInteractive | null;
  setInteractiveState: (state: any) => void | null;
  setHint?: (state: any) => void | null;
  addLocalLinkedDataListener?: (request: IAddLinkedInteractiveStateListenerRequest, phone: IframePhone) => void;
  scale?: number;
  onUnloadCallback?: (state: any) => void;
  scrolling?: "auto" | "yes" | "no";
  flushOnSave?: boolean;
  accessibility: IAccessibilitySettings;
}

export const IframeRuntime: React.FC<IProps> =
  ({ authoredState, id, iframeStyling, interactiveState, logRequestData, report,
      url, setHint, setInteractiveState, addLocalLinkedDataListener, initMessage,
      scale, onUnloadCallback, scrolling, flushOnSave, accessibility, readOnly }) => {
    const [ iframeHeight, setIframeHeight ] = useState(300);
    const [ internalHint, setInternalHint ] = useState("");
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

    const onUnloadCallbackRef = useRef<((state: any) => void) | undefined>(onUnloadCallback);
    onUnloadCallbackRef.current = onUnloadCallback;

    const resolveOnUnload = useRef<(value: any | PromiseLike<any>) => void>();

  useEffect(() => {
    const initInteractive = () => {
      const phone = phoneRef.current;
      if (!phone) {
        return;
      }

      // Handle proxying the unloading request from Lara/AP through to the wrapped interactive.
      // The promise that is saved is resolved in the subsequent interactiveState listener callback
      setOnUnload((options: IGetInteractiveState) => {
        console.log("options", options);
        if (options.unloading) {
          return new Promise<any>(resolve => {
            resolveOnUnload.current = resolve;
            // send the unload request to the wrapped interactive
            phone.post("getInteractiveState", options);
          });
        }
        return Promise.resolve({});
      });

      phone.addListener("interactiveState", (newInteractiveState: any) => {
        setInteractiveStateRef.current?.(newInteractiveState);
        if (flushOnSave) {
          // don't wait the default 2000ms timeout before saving
          flushStateUpdates();
        }

        if (onUnloadCallbackRef?.current && resolveOnUnload.current) {
          console.log("onUnloadCallback resolveOnUnload has value");
          // send the interactive state to any parent interactive that has provided an onUnload
          // callback, and then resolve the promise that was saved in the setOnUnload function
          // with undefined so the parent interactive doesn't have its state overwritten.
          onUnloadCallbackRef?.current(newInteractiveState);
          resolveOnUnload.current(undefined);
        } else {
          console.log("onUnloadCallback resolveOnUnload has no value", resolveOnUnload.current);
          resolveOnUnload.current?.(newInteractiveState);
        }

      });
      phone.addListener("height", (newHeight: number) => {
        setIframeHeight(newHeight);
      });
      phone.addListener("hint", (newHint: IHintRequest) => {
        setHint ? setHint(newHint.text || "") : setInternalHint(newHint.text || "");
      });
      phone.addListener("log", (logData: ILogRequest) => {
        log(logData.action, {
          ...logData.data,
          ...logRequestData
        });
      });
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
      phone.addListener("addLinkedInteractiveStateListener", (request: IAddLinkedInteractiveStateListenerRequest) => {
        if (addLocalLinkedDataListener) {
          addLocalLinkedDataListener(request, phone);
        }
      });
      phone.addListener("getAttachmentUrl", async (request: IAttachmentUrlRequest) => {
        const client = getClient();

        // This proxies the attachment request to the enclosing host (AP or Lara).
        // To ensure that this request isn't mixed up with an existing request the request id
        // is set to a random large id when it is passed to the enclosing host and then restored
        // when passed back to the client

        //--------------------------------------
        // FIXME: (from Scott during code review)
        //
        // A problem with this approach is the file names. This iframe-runtime is used by interactives that host multiple
        // sub interactives like the side-by-side or carousel. Let's say there are two CFM sub interactives. They will each choose
        // a file name of file.json so they will clobber each other since there will just be one folder managed by the parent interactive.
        //
        // This is a general problem broader then just this one case. Leslie is aware of it, so I think we'll take some time in the future
        // to fix this up so we can properly support this multiple sub-interactives.
        //--------------------------------------
        const minRequestId = 100000;
        const savedRequestId = request.requestId;
        request.requestId = minRequestId + Math.round(Math.random() * (Number.MAX_SAFE_INTEGER - minRequestId));
        client.post("getAttachmentUrl", request);
        client.addListener("attachmentUrl", (response: IAttachmentUrlResponse) => {
          response.requestId = savedRequestId;
          phone.post("attachmentUrl", response);
        }, request.requestId);
      });

      // proxy custom messages between host and iframed element to enable dynamic text
      const client = getClient();
      client.addListener("customMessage", (message: ICustomMessage) => phone.post("customMessage", message));
      phone.addListener("customMessage", (message: ICustomMessage) => client.post("customMessage", message));

      // if we have local linked interactives, we need to pass them in the linkedInteractives array
      let linkedInteractives: {id: string; label: string}[] = [];
      const libraryInteractive = getLibraryInteractive(url);
      if (libraryInteractive?.localLinkedInteractiveProp && authoredState?.[libraryInteractive.localLinkedInteractiveProp]) {
        linkedInteractives = [ {id: authoredState[libraryInteractive.localLinkedInteractiveProp], label: libraryInteractive.localLinkedInteractiveProp} ];
      }

      const initInteractiveMessage: any = {
        ...initMessage,   // for now only fullscreen sets this prop so that the needed info for cfm interactiveApi is passed
        mode: report ? "report" : "runtime",
        authoredState,
        // This is a trick not to depend on interactiveState.
        interactiveState: interactiveStateRef.current,
        linkedInteractives
      };

      if (!report) {
        initInteractiveMessage.accessibility = accessibility;
      }

      phone.post("initInteractive", initInteractiveMessage);
    };

    if (iframeRef.current) {
      console.log("IframeRuntime: reloading iframe");
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
  },[addLocalLinkedDataListener, authoredState, logRequestData, report, setHint, url, initMessage, flushOnSave, accessibility]);

  let scaledIframeStyle = undefined;
  if (scale && report) {
    scaledIframeStyle = {
      border: "none",
      height: `${iframeHeight/scale}px`,
      transform: `scale(${scale})`,
      transformOrigin: "left top",
      width: `${100/scale}%`
    };
  }

  const iframeStyle = iframeStyling
                        ? iframeStyling
                        : scaledIframeStyle
                          ? scaledIframeStyle
                          : {width: "100%", height: iframeHeight, border: "none"};

  if (readOnly) {
    iframeStyle.pointerEvents = "none";
  }

  return (
    <>
      <iframe
        ref={iframeRef}
        src={url}
        style={iframeStyle}
        scrolling={scrolling}
        tabIndex={readOnly ? -1 : undefined}
        allow="geolocation; microphone; camera; bluetooth; clipboard-read; clipboard-write"
      />
      { internalHint &&
        <div className={css.hint}><DynamicText>{renderHTML(internalHint)}</DynamicText></div> }
    </>
  );
};
