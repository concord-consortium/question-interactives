import { useEffect, useState } from "react";
import { IAccessibilitySettings, useInitMessage } from "@concord-consortium/lara-interactive-api";

const defaultSettings: IAccessibilitySettings = {
  fontSize: "normal",
  fontSizeInPx: 16
};

export const useAccessibility = (props?: {updateHtmlFontSize?: boolean}) => {
  const {updateHtmlFontSize} = props || {};
  const initMessage = useInitMessage();
  const [accessibility, setAccessibility] = useState<IAccessibilitySettings>(defaultSettings);

  useEffect(() => {
    if (initMessage && initMessage.mode === "runtime") {
      const _accessibility = initMessage.accessibility || defaultSettings;
      const {fontSizeInPx} = _accessibility;

      setAccessibility(_accessibility);

      if (updateHtmlFontSize && (fontSizeInPx !== defaultSettings.fontSizeInPx)) {
        const html = document.getElementsByTagName("html").item(0);
        if (html) {
          html.style.fontSize = `${fontSizeInPx}px`;
        }
      }
    }
  }, [initMessage, updateHtmlFontSize]);

  return accessibility;
};
