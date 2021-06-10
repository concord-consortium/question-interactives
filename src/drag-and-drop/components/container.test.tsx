import React from "react";
import { mount } from "enzyme";
import { margin, marginLeft, marginTop } from "./container";
import { DraggableItemWrapper } from "./draggable-item-wrapper";
import { ContainerWithDndProvider } from "./container-with-dnd-provider";
import { DraggableItemPreview } from "./draggable-item-preview";
import { IDropZone } from "./types";

const authoredState = {
  version: 1,
  questionType: "iframe_interactive" as const,
  canvasWidth: 300,
  canvasHeight: 200,
  backgroundImageUrl: "http://background.img.url",
  draggingAreaPrompt: "Test prompt",
  draggableItems: [
    {id: "1", imageUrl: "http://image/1", imageWidth: 25, imageHeight: 25, label: "Image 1", value: 1, targetMatch: 1},
    {id: "2", imageUrl: "http://image/2", imageWidth: 25, imageHeight: 25, label: "Image 2", value: 2, targetMatch: 2},
  ],
  dropZones: [
    {id: "123", imageUrl: "https://image.com/1", targetWidth: 20, targetHeight: 20, targetLabel: "target 1", index:1} as IDropZone
  ],
  targetPositions: {}
};

describe("Container", () => {
  it("renders dragging area with provided dimensions", () => {
    const wrapper = mount(<ContainerWithDndProvider authoredState={authoredState} />);
    expect(wrapper.find("[data-cy='dnd-container']").prop("style")).toEqual({
      backgroundImage: `url("${authoredState.backgroundImageUrl}")`,
      height: "200px",
      width: "300px"
    });
  });

  it("renders dragging area prompt", () => {
    const wrapper = mount(<ContainerWithDndProvider authoredState={authoredState} />);
    expect(wrapper.text()).toEqual(expect.stringContaining(authoredState.draggingAreaPrompt));
  });

  it("renders draggable items", () => {
    const wrapper = mount(<ContainerWithDndProvider authoredState={authoredState} />);
    expect(wrapper.find(DraggableItemWrapper).length).toEqual(2);
  });

  it.skip("renders draggable item preview", () => { //preview is only show as an alternative to the actual item
    const wrapper = mount(<ContainerWithDndProvider authoredState={authoredState} />);
    expect(wrapper.find(DraggableItemPreview).length).toEqual(1);
  });

  describe("draggable item position", () => {
    it("is calculated automatically when there's no interactive or initial state", () => {
      const wrapper = mount(<ContainerWithDndProvider authoredState={authoredState} />);
      const draggableItems = wrapper.find(DraggableItemWrapper);
      expect(draggableItems.at(0).prop("position")).toEqual({ left: marginLeft, top: marginTop });
      expect(draggableItems.at(1).prop("position")).toEqual({ left: marginLeft, top: marginTop + margin });
    });

    it("is taken from initial state when there's no interactive state yet", () => {
      const authoredStateWithInitialState = {
        ...authoredState,
        initialState: {
          itemPositions: {
            1: {left: 123, top: 321},
            2: {left: 111, top: 222}
          },
          targetPositions: {
            1: {left: 222, top: 222}
          }
        }
      };
      const wrapper = mount(<ContainerWithDndProvider authoredState={authoredStateWithInitialState} />);
      const draggableItems = wrapper.find(DraggableItemWrapper);
      expect(draggableItems.at(0).prop("position")).toEqual({ left: 123, top: 321 });
      expect(draggableItems.at(1).prop("position")).toEqual({ left: 111, top: 222 });
    });

    it("is taken from interactive state when available", () => {
      const authoredStateWithInitialState = {
        ...authoredState,
        initialState: {
          itemPositions: {
            1: {left: 123, top: 321},
            2: {left: 111, top: 222}
          }
        }
      };
      const interactiveState = {
        answerType: "interactive_state" as const,
        itemPositions: {
          2: {left: 999, top: 999}
        },
        targetPositions: {
          1: {left: 222, top: 222}
        }
      };
      const wrapper = mount(<ContainerWithDndProvider authoredState={authoredStateWithInitialState} interactiveState={interactiveState} />);
      const draggableItems = wrapper.find(DraggableItemWrapper);
      expect(draggableItems.at(0).prop("position")).toEqual({ left: 123, top: 321 });
      expect(draggableItems.at(1).prop("position")).toEqual({ left: 999, top: 999 });
    });
  });
});
