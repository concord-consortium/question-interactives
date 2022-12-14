import React, { useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import iframePhone from "iframe-phone";
import { IframePhone } from "./types";
import { getURLParam } from "./utilities/get-url-param";

// Note that this app/component is mostly used by Cypress tests. It can also be used to tests / develop things manually,
// for example using browser console.
const Wrapper = () => {
  const phone = useRef<IframePhone>();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    phone.current = iframePhone.ParentEndpoint(iframeRef.current, () => {
      // Phone connected, ready to be used. Export it to global namespace so it can be used by developer in web console
      // or in Cypress tests.
      (window as any).phone = phone.current;
      const mode = getURLParam("mode");
      if (mode) {
        phone.current?.post("initInteractive", { mode });
      }
    });
  }, []);

  const iframeSrc = getURLParam("iframe") as string || "/multiple-choice";
  return <iframe ref={iframeRef} src={iframeSrc} width="100%" height={800} />;
};

ReactDOM.render(
  <Wrapper />,
  document.getElementById("app")
);
