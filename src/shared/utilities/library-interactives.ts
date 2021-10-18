// This is only temporary list. It will be replaced by LARA Interactive API call that returns all the available library interactives.
type ParentInteractiveID =  "scaffolded-question" | "carousel" | "side-by-side";
export const libraryInteractives = [
  {
    libraryInteractiveId: "",
    name: "Select an interactive"
  },
  {
    libraryInteractiveId: "open-response",
    name: "Open response"
  },
  {
    libraryInteractiveId: "fill-in-the-blank",
    name: "Fill in the blank"
  },
  {
    libraryInteractiveId: "multiple-choice",
    name: "Multiple choice"
  },
  {
    libraryInteractiveId: "video-player",
    name: "Video"
  },
  {
    libraryInteractiveId: "image",
    name: "Image"
  },
  {
    libraryInteractiveId: "drag-and-drop",
    name: "Drag and Drop"
  },
  {
    libraryInteractiveId: "graph",
    name: "Graph"
  }
];

// This function will be in the future replaced by LARA Interactive API call.
export const libraryInteractiveIdToUrl = (libraryInteractiveId: string, parentInteractiveId: ParentInteractiveID) => {
  // Note that currently libraryInteractiveId is just a last segment of the full interactive URL, for example
  // "open-response", "fill-in-the-blank", and so on. The final URL is constructed here dynamically using
  // scaffolded question URL that includes version number to keep subinteractives updated too.
  const parentInteractiveSegment = new RegExp(`${parentInteractiveId}/?$`);
  return window.location.href.replace(parentInteractiveSegment, `${libraryInteractiveId}/`);
};
