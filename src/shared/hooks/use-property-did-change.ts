import usePrevious from "react-hooks-use-previous";
import { useState } from "react";

const loading = "loading";

// A simple hook that accepts object and a property name and returns `true` when the property has been updated.
// There's an assumption that the object can be initially unavailable (undefined) and this should not affect
// the result. This hook will detect change of the property, not property and object combination.
// It's useful for observing interactive state properties.
export const usePropertyDidChange = (object: any, propertyName: string) => {
  const [ result, setResult ] = useState(false);
  const previousDrawingToolState = usePrevious<string | undefined>(object ? object[propertyName] : loading, loading);
  const currentDrawingToolState = object ? object.drawingState : loading;
  if (!result && previousDrawingToolState !== loading && previousDrawingToolState !== currentDrawingToolState) {
    setResult(true);
  }
  return result;
};
