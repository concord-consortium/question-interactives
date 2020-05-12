import { RefObject, useEffect } from "react";

interface IConfig {
  container: RefObject<HTMLDivElement>;
  setHeight: (height: number) => void;
}

export const useAutoHeight = (config: IConfig) => {
  const { container, setHeight } = config;

  const calcHeight = () => {
    const height = container.current?.offsetHeight;
    if (height && height > 0) {
      setHeight(height);
    }
  };

  // Update height on every re-render.
  useEffect(calcHeight);

  useEffect(() => {
    // It's necessary to wrap calcHeight in a closure function. Note that calcHeight will be recreated on every render.
    // This will break the cleanup function which would try to remove wrong reference. resizeHandler is created
    // only once, as useEffect has empty dependencies list.
    const resizeHandler = () => calcHeight();
    window.addEventListener("resize", resizeHandler);
    return () => window.removeEventListener("resize", resizeHandler);
  }, []);
}
