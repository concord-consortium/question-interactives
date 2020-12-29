import { useDecorateContent, ITextDecorationHandlerInfo } from "@concord-consortium/lara-interactive-api";
import { addEventListeners, removeEventListeners, IDecorateReactOptions } from "@concord-consortium/text-decorator";
import { useEffect, useState } from "react";
import { renderHTML } from "../utilities/render-html";

export const useGlossaryDecoration = (): IDecorateReactOptions => {
  const [options, setOptions] = useState<IDecorateReactOptions>({ words: [], replace: "" });
  const [msg, setMsg] = useState<ITextDecorationHandlerInfo>();

  useDecorateContent((msg: ITextDecorationHandlerInfo) => {
    const msgOptions = {
      words: msg.words,
      replace: renderHTML(msg.replace) as string | React.ReactElement,
    };
    setOptions(msgOptions);
    setMsg(msg);
  });

  useEffect(() => {
    msg && addEventListeners(msg.wordClass, msg.eventListeners);
    return () => msg && removeEventListeners(msg.wordClass, msg.eventListeners);
  }, [msg]);

  return options;
};
