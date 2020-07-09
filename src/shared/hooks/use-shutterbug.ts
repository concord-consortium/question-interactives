import { useEffect } from "react";
import Shutterbug from "shutterbug";

interface IConfig {
  container?: string;
}

// This hook can be used by any interactive that requires snapshots.
export const useShutterbug = ({ container }: IConfig) => {
  useEffect(() => {
    if (container) {
      Shutterbug.enable(container);
    } else {
      Shutterbug.enable("#app");
    }
    return () => {
      Shutterbug.disable();
    };
  }, [container]);
};
