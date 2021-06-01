import { baseAuthoringProps  } from "./app";
import { IDraggableItem, IDragTarget } from "./types";

describe("preprocessFormData helper", () => {
  it("generates unique IDs for draggableItems they're missing", () => {
    const newData = baseAuthoringProps.preprocessFormData({
      version: 1,
      questionType: "iframe_interactive" as const,
      draggableItems: [
        {imageUrl: "https://image.com/1"} as IDraggableItem,
        {imageUrl: "https://image.com/2"} as IDraggableItem,
      ],
      dragTargets: [
        {id: "123", imageUrl: "https://image.com/1", targetWidth: 20, targetHeight: 20, targetLabel: "target 1", index:1} as IDragTarget
      ],
      targetPositions: {}
    });
    const draggableItems = newData.draggableItems;

    expect(draggableItems?.[0].id).toBeDefined();
    expect(draggableItems?.[1].id).toBeDefined();
    expect(draggableItems?.[0].id).not.toEqual(draggableItems?.[1].id);
  });

  it("doesn't overwrite existing choice IDs", () => {
    expect(baseAuthoringProps.preprocessFormData({
      version: 1,
      questionType: "iframe_interactive" as const,
      draggableItems: [
        {id: "1", imageUrl: "https://image.com/1"} as IDraggableItem,
        {id: "2", imageUrl: "https://image.com/2"} as IDraggableItem,
      ],
      dragTargets: [
        {id: "123", imageUrl: "https://image.com/1", targetWidth: 20, targetHeight: 20, targetLabel: "target 1", index:1} as IDragTarget
      ],
      targetPositions: {}
    })).toEqual({
      version: 1,
      questionType: "iframe_interactive",
      draggableItems: [
        {id: "1", imageUrl: "https://image.com/1"} as IDraggableItem,
        {id: "2", imageUrl: "https://image.com/2"} as IDraggableItem,
      ],
      dragTargets: [
        {id: "123", imageUrl: "https://image.com/1", targetWidth: 20, targetHeight: 20, targetLabel: "target 1", index:1} as IDragTarget
      ],
      targetPositions: {}
    });
  });
});
