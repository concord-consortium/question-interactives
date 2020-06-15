import { useEffect } from "react";
import Shutterbug from "shutterbug";

// This hook can be used by any interactive that requires snapshots.
export const useShutterbug = () => {
  useEffect(() => {
    Shutterbug.enable("#app");
    return () => {
      Shutterbug.disable();
    };
  }, []);
};
