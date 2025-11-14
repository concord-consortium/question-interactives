import { useEffect } from "react";
import { AgentSimulation } from "../models/agent-simulation";
import { GlobalValue } from "../types/globals";

interface IUseInitializeGlobalParams {
  defaultValue?: GlobalValue;
  globalKey: string;
  requiredType?: string;
  sim: AgentSimulation;
}
export function useInitializeGlobal({ defaultValue, globalKey, requiredType, sim }: IUseInitializeGlobalParams) {
  useEffect(() => {
    if (defaultValue === undefined) return;

    if (requiredType && typeof defaultValue !== requiredType) return;

    sim.globals.create(globalKey, defaultValue);
  }, [defaultValue, globalKey, requiredType, sim.globals]);
}
