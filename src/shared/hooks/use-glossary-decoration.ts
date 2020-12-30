import { useDecorateContent, ITextDecorationHandlerInfo } from "@concord-consortium/lara-interactive-api";
import { addEventListeners, removeEventListeners, IDecorateReactOptions } from "@concord-consortium/text-decorator";
import { useEffect, useState } from "react";
import { renderHTML } from "../utilities/render-html";

export const useGlossaryDecoration = (): IDecorateReactOptions => {
  const [options, setOptions] = useState<IDecorateReactOptions>({ words: [], replace: "" });
  const [message, setMessage] = useState<ITextDecorationHandlerInfo>();

  useDecorateContent((msg: ITextDecorationHandlerInfo) => {
    const msgOptions = {
      words: msg.words,
      replace: renderHTML(msg.replace) as string | React.ReactElement,
    };
    setOptions(msgOptions);
    setMessage(msg);
  });

  useEffect(() => {
    message && addEventListeners(message.wordClass, message.eventListeners);
    return () => message && removeEventListeners(message.wordClass, message.eventListeners);
  }, [message]);

  return options;
};
