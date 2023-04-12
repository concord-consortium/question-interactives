import { useEffect, useState } from "react";
import { useInitMessage } from "@concord-consortium/lara-interactive-api";

export const useFontSize = (props?: {updateHtml?: boolean}) => {
  const {updateHtml} = props || {};
  const initMessage = useInitMessage();
  const [fontSize, setFontSize] = useState<string|undefined>();

  useEffect(() => {
    if (initMessage) {
      const initFontSize = (initMessage as any).fontSize;
      setFontSize(initFontSize);

      if (initFontSize && updateHtml) {
        const html = document.getElementsByTagName("html").item(0);
        if (html) {
          console.log("QI: SETTING FONT SIZE TO", initFontSize);
          html.style.fontSize = initFontSize;
        }
      }
    }
  }, [initMessage]);

  return fontSize;
}