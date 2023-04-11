import { useEffect } from "react";
import { useInitMessage } from "@concord-consortium/lara-interactive-api";

export const useFontSize = () => {
  const initMessage = useInitMessage();

  useEffect(() => {
    if (initMessage) {
      const fontSize = (initMessage as any).fontSize;
      if (fontSize) {
        const html = document.getElementsByTagName("html").item(0);
        if (html) {
          console.log("QI: SETTING FONT SIZE TO", fontSize);
          html.style.fontSize = fontSize;
        }
      }
    }
  }, [initMessage]);
}