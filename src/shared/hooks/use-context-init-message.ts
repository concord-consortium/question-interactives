import { createContext, useContext } from "react";
import { IInitInteractive } from "@concord-consortium/lara-interactive-api";

export const InitMessageContext = createContext<IInitInteractive | null | undefined>(undefined);

export const useContextInitMessage = () => {
  const initMessage = useContext(InitMessageContext);
  if (initMessage === undefined) {
    throw new Error("useContextInitMessage must be used within a <InitMessageContext.Provider>");
  }
  return initMessage;
};
