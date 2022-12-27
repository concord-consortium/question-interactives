import { createContext, useContext } from "react";
import { IInitInteractive } from "@concord-consortium/lara-interactive-api";

export const InitMessageContext = createContext<IInitInteractive | null | undefined>(undefined);

export const useContextInitMessage = () => {
  const initMessage = useContext(InitMessageContext);
  // initMessage will be undefined unless a value is supplied by a context provider.
  // useInitMessage in the interactive client returns null until the init message is ready,
  // after which it returns an object of type IInitInteractive
  if (initMessage === undefined) {
    throw new Error("useContextInitMessage must be used within a <InitMessageContext.Provider>");
  }
  return initMessage;
};
