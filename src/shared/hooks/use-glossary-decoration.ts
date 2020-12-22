import { useDecorateContent, ITextDecorationHandlerInfo } from "@concord-consortium/lara-interactive-api";
import { addEventListeners, removeEventListeners, IDecorateReactOptions } from "@concord-consortium/text-decorator";
import { useEffect, useState } from "react";
import { renderHTML } from "../utilities/render-html";

const kClassName = "text-decorate";

export const useGlossaryDecoration = (): [IDecorateReactOptions, string] => {
  const [options, setOptions] = useState<IDecorateReactOptions>({ words: [], replace: "" });
  const [listeners, setListeners] = useState<any>(); // TODO: type should be IEventListeners

  useDecorateContent((msg: ITextDecorationHandlerInfo) => {
    const msgOptions = {
      words: msg.words,
      replace: renderHTML(msg.replace) as string | React.ReactElement,
    };
    setOptions(msgOptions);
    setListeners(msg.eventListeners);
  });

  useEffect(() => {
    listeners && addEventListeners(kClassName, listeners);
    return () => listeners && removeEventListeners(kClassName, listeners);
  });

  return [options, kClassName];
};
