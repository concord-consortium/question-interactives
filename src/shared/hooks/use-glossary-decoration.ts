import { useDecorateContent, ITextDecorationHandlerInfo } from "@concord-consortium/lara-interactive-api";
import { addEventListeners, removeEventListeners, IDecorateReactOptions } from "@concord-consortium/text-decorator";
import { useEffect, useState } from "react";
import { renderHTML } from "../utilities/render-html";

export const useGlossaryDecoration = (): IDecorateReactOptions => {
  const [options, setOptions] = useState<IDecorateReactOptions>({ words: [], replace: "" });
  const [listeners, setListeners] = useState<any>(); // TODO: type should be IEventListeners
  const [wordClass, setWordClass] = useState<string>("");

  useDecorateContent((msg: ITextDecorationHandlerInfo) => {
    const msgOptions = {
      words: msg.words,
      replace: renderHTML(msg.replace) as string | React.ReactElement,
    };
    setOptions(msgOptions);
    setListeners(msg.eventListeners);
    setWordClass(msg.wordClass);
  });

  useEffect(() => {
    listeners && addEventListeners(wordClass, listeners);
    return () => listeners && removeEventListeners(wordClass, listeners);
  }, [wordClass, listeners]);

  return options;
};
