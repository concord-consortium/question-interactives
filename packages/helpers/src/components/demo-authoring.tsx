import { IInitInteractive } from "@concord-consortium/lara-interactive-api";
import React, { useEffect, useRef, useState } from "react";
import { IframePhone } from "../types";
import iframePhone from "iframe-phone";

import css from "./demo-authoring.scss";

interface IProps<IAuthoredState> {
  url: string;
  authoredState: IAuthoredState;
  setAuthoredState: React.Dispatch<React.SetStateAction<IAuthoredState>>
}

export function DemoAuthoringComponent<IAuthoredState>(props: IProps<IAuthoredState>) {
  const {authoredState, url, setAuthoredState} = props;
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const phoneRef = useRef<IframePhone>();
  const [height, setHeight] = useState<number|string|null>(null);

  useEffect(() => {
    const initInteractive = () => {
      const phone = phoneRef.current;
      if (!phone) {
        return;
      }

      phone.addListener("authoredState", (newAuthoredState: any) => {
        setAuthoredState(newAuthoredState);
      });

      phone.addListener("height", (newHeight: number | string) => {
        setHeight(typeof newHeight === "string" ? parseInt(newHeight, 10) : newHeight);
      });

      const initInteractiveMessage: IInitInteractive = {
        version: 1,
        error: null,
        mode: "authoring",
        hostFeatures: {},
        authoredState: authoredState || {},
        themeInfo: {
          colors: {
            colorA: "red",
            colorB: "blue"
          }
        },
        interactiveItemId: "demo",
        linkedInteractives: []
      };

      phone.post("initInteractive", initInteractiveMessage);
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
  },[authoredState, setAuthoredState, url]);

  const style: React.CSSProperties = {
    width: "100%",
    height: height || 300,
    border: "none"
  };

  return (
    <div className={css.demoAuthoring}>
      <iframe ref={iframeRef} src={url} style={style} />
    </div>
  );
}
