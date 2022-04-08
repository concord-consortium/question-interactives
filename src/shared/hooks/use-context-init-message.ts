import { createContext, useContext } from "react";
import { IInitInteractive } from "@concord-consortium/lara-interactive-api";

export const InitMessageContext = createContext<IInitInteractive | null>(null);

export const useContextInitMessage = () => {
  const initMessage = useContext(InitMessageContext);
  return initMessage;
};
