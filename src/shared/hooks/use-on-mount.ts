import { useEffect } from "react";

// eslint-disable-next-line react-hooks/exhaustive-deps
export const useOnMount = (fn: () => void) => useEffect(fn, []);