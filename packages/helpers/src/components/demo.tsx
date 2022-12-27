import React, { useEffect, useRef, useState } from "react";

import { IframeRuntime } from "../components/iframe-runtime";
import { DemoAuthoringComponent } from "./demo-authoring";

import css from "./demo.scss";

interface IProps<IAuthoredState, IInteractiveState> {
  title: string;
  App: JSX.Element;
  authoredState: IAuthoredState;
  interactiveState: IInteractiveState;
  getReportItemHtml?: (options: {interactiveState: IInteractiveState, authoredState: IAuthoredState}) => string;
}

const iframe = new URLSearchParams(window.location.search).get("iframe");
const rootDemo = !iframe;

export const DemoComponent = <IAuthoredState, IInteractiveState>(props: IProps<IAuthoredState, IInteractiveState>) => {
  const { App, title, getReportItemHtml } = props;
  const [authoredState, setAuthoredState] = useState<IAuthoredState>(props.authoredState);
  const [interactiveState, setInteractiveState] = useState<IInteractiveState>(props.interactiveState);
  const [childIFrames, setChildIFrames] = useState<MessageEventSource[]>([]);
  const [reportItemHtml, setReportItemHtml] = useState<string>();
  const [reportItemHeight, setReportItemHeight] = useState(0);
  const timeoutRef = useRef<number|undefined>();

  // send the new authored state to the root demo and have it re-render the runtime container
  const handleSetAuthoredState = (newAuthoredState: IAuthoredState) => {
    window.parent.postMessage({ type: "setDemoAuthoredState", value: newAuthoredState });
  };

  // this is a bit of a hack to fake iframe-phone at the root and proxy messages from the
  // inner authoring-container iframe to the runtime-container
  useEffect(() => {
    const handleMessage = (event: MessageEvent<any>) => {
      const { source, data } = event;
      switch (data.type) {
        case "hello":
          if (rootDemo && source) {
            // fake an iframe-phone parent endpoint inorder to save references to the child authoring-container and runtime-containers
            const match = window.location.href.match(/(.*?\/\/.*?)\//);
            setChildIFrames(prev => ([...prev, source]));
            source.postMessage({
              type: "hello",
              origin: match ? match[1] : ""
            });
          }
          break;
        case "interactiveState":
          setInteractiveState(data.content);
          break;
        case "setDemoAuthoredState":
          if (rootDemo) {
            // proxy the message from the authoring-container to the runtime-container
            childIFrames.forEach(s => s.postMessage(data));
          } else {
            // in the runtime-container set the outer authored state to force a re-render after a debounce
            window.clearTimeout(timeoutRef.current);
            timeoutRef.current = window.setTimeout(() => {
              setAuthoredState(prev => {
                if (JSON.stringify(prev) !== JSON.stringify(data.value)) {
                  return data.value;
                }
                return prev;
              });
            }, 500);
          }
          break;
      }
    };
    if (rootDemo || iframe === "runtime-container") {
      window.addEventListener("message", handleMessage);
    }
    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [setAuthoredState, childIFrames]);

  useEffect(() => {
    if (iframe === "runtime-container" && getReportItemHtml) {
      setReportItemHtml(getReportItemHtml({interactiveState, authoredState}));
    }
  }, [authoredState, interactiveState, getReportItemHtml]);

  const handleReportItemIFrameLoaded = (e: any) => {
    const contentDocument = e.target.contentDocument;
    const body = contentDocument.body;
    const html = contentDocument.documentElement;
    const height = Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight, html.scrollHeight, html.offsetHeight);

    setReportItemHeight(height);
  };

  const renderReportItemHtml = () => {
    if (!reportItemHtml) {
      return null;
    }

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: lato, arial, helvetica, sans-serif;
        }
        .tall {
          display: none;
        }
        .wide {
          display: flex;
          flex-direction: row;
        }
      </style>
    </head>
    <body>
      ${reportItemHtml}
    </body>
    </html>`;

    return (
      <div className={css.reportItem}>
        <strong>Report Item HTML:</strong>
        <iframe srcDoc={html} style={{height: reportItemHeight}} onLoad={handleReportItemIFrameLoaded} />
      </div>
    );
  };

  switch (iframe) {
    case "authoring-container":
      return (
        <>
          <strong>Authoring:</strong>
          <DemoAuthoringComponent
            url="demo.html?iframe=authoring"
            authoredState={authoredState}
            setAuthoredState={handleSetAuthoredState}
          />
        </>
      );

    case "runtime-container":
      return (
        <>
          <strong>Interactive:</strong>
          <IframeRuntime
            url="demo.html?iframe=runtime"
            authoredState={authoredState}
            interactiveState={interactiveState}
            setInteractiveState={setInteractiveState}
            flushOnSave={true}
          />
          {renderReportItemHtml()}
        </>
      );

    case "authoring":
      // bootstrap is added for the icon font used in the authoring controls
      return (
        <>
          <link href="//netdna.bootstrapcdn.com/bootstrap/3.0.0/css/bootstrap.min.css" rel="stylesheet"></link>
          {App}
        </>
      );

    case "runtime":
      return App;

    default:
      return (
        <div className={css.demo}>
          <div className={css.header}><h1>{title}</h1></div>
          <div className={css.split}>
            <div className={css.authoring}><iframe src="demo.html?iframe=authoring-container" /></div>
            <div className={css.runtime}><iframe src="demo.html?iframe=runtime-container" /></div>
          </div>
        </div>
      );
  }
};
