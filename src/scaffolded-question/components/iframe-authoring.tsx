import React, { ChangeEvent, useEffect, useRef, useState } from "react";
import { FieldProps } from "react-jsonschema-form";
import { IframePhone } from "../../shared/types";
import iframePhone from "iframe-phone";

import css from "./iframe-authoring.scss";

// Later, this will be replaced by LARA Interactive API call that returns all the available managed interactives.
const availableInteractives = [
  {
    url: "",
    name: "Select an interactive"
  },
  {
    url: window.location.origin + "/open-response",
    name: "Open response"
  },
  {
    url: window.location.origin + "/fill-in-the-blank",
    name: "Fill in the blank"
  },
  {
    url: window.location.origin + "/multiple-choice",
    name: "Multiple choice"
  }
]

export const IframeAuthoring: React.FC<FieldProps> = props => {
  const { onChange, formData } = props;
  const { url, authoredState } = formData;
  const [ iframeHeight, setIframeHeight ] = useState(300);
  const [ authoringOpened, setAuthoringOpened ] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const phoneRef = useRef<IframePhone>();

  const handleUrlChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const newUrl = event.target.value;
    onChange({ url: newUrl, authoredState: undefined });
  };

  const handleHeaderClick = () => {
    setAuthoringOpened(!authoringOpened);
  };

  const initInteractive = () => {
    const phone = phoneRef.current;
    if (!phone) {
      return;
    }
    phone.addListener("authoredState", (newAuthoredState: any) => {
      onChange({ url, authoredState: newAuthoredState });
    });
    phone.addListener("height", (newHeight: number) => {
      setIframeHeight(newHeight);
    });
    phone.post("initInteractive", {
      mode: "authoring",
      authoredState
    });
    phone.post("initInteractive", {
      mode: "authoring",
      authoredState
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

  return (
    <div className={css.iframeAuthoring}>
      Interactive: <select onChange={handleUrlChange} value={url}>
        { availableInteractives.map(o => <option key={o.url} value={o.url}>{o.name}</option>) }
      </select>
      {
        url &&
        <div className={css.iframeAuthoring}>
          <h4 onClick={handleHeaderClick} className={css.link}>{authoringOpened ? "▲" : "▼"} Subquestion authoring</h4>
          <div className={css.iframeContainer} style={{maxHeight: authoringOpened ? iframeHeight : 0 }}>
            <iframe ref={iframeRef} src={url} width="100%" height={iframeHeight} frameBorder={0} />
          </div>
        </div>
      }
    </div>
  )
};
