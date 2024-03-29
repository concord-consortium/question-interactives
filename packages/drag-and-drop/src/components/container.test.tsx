import React from "react";
import { mount } from "enzyme";
import { margin, marginLeft, marginTop } from "./container";
import { DraggableItemWrapper } from "./draggable-item-wrapper";
import { ContainerWithDndProvider } from "./container-with-dnd-provider";
import { DraggableItemPreview } from "./draggable-item-preview";
import { IDropZone } from "./types";
import { cssUrlValue } from "@concord-consortium/question-interactives-helpers/src/utilities/css-url-value";
import { DynamicTextTester } from "@concord-consortium/question-interactives-helpers/src/utilities/dynamic-text-tester";

const authoredState = {
  version: 1,
  questionType: "iframe_interactive" as const,
  canvasWidth: 300,
  canvasHeight: 200,
  backgroundImageUrl: "http://background.img.url",
  draggingAreaPrompt: "Test prompt",
  draggableItems: [
    {id: "1", imageUrl: "http://image/1", label:"", value: 1, targetMatch: 0},
    {id: "2", imageUrl: "http://image/2", label:"", value: 1, targetMatch: 0},
  ],
  dropZones: [
    {id: "123", targetWidth: 20, targetHeight: 20, targetLabel: "target 1", index:1} as IDropZone
  ],
  targetPositions: {}
};

describe("Container", () => {
  it("renders dragging area with provided dimensions", () => {
    const wrapper = mount(<DynamicTextTester><ContainerWithDndProvider authoredState={authoredState} /></DynamicTextTester>);
    expect(wrapper.find("[data-cy='dnd-container']").prop("style")).toEqual({
      backgroundImage: cssUrlValue(authoredState.backgroundImageUrl),
      height: "200px",
      width: "300px"
    });
  });

  it("renders dragging area prompt", () => {
    const wrapper = mount(<DynamicTextTester><ContainerWithDndProvider authoredState={authoredState} /></DynamicTextTester>);
    expect(wrapper.text()).toEqual(expect.stringContaining(authoredState.draggingAreaPrompt));
  });

  it("renders draggable items", () => {
    const wrapper = mount(<DynamicTextTester><ContainerWithDndProvider authoredState={authoredState} /></DynamicTextTester>);
    expect(wrapper.find(DraggableItemWrapper).length).toEqual(2);
  });

  it.skip("renders draggable item preview", () => { //preview is only show as an alternative to the actual item
    const wrapper = mount(<DynamicTextTester><ContainerWithDndProvider authoredState={authoredState} /></DynamicTextTester>);
    expect(wrapper.find(DraggableItemPreview).length).toEqual(1);
  });

  describe("draggable item position", () => {
    it("is calculated automatically when there's no interactive or initial state", () => {
      const wrapper = mount(<DynamicTextTester><ContainerWithDndProvider authoredState={authoredState} /></DynamicTextTester>);
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
      const wrapper = mount(<DynamicTextTester><ContainerWithDndProvider authoredState={authoredStateWithInitialState} /></DynamicTextTester>);
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
      const wrapper = mount(<DynamicTextTester><ContainerWithDndProvider authoredState={authoredStateWithInitialState} interactiveState={interactiveState} /></DynamicTextTester>);
      const draggableItems = wrapper.find(DraggableItemWrapper);
      expect(draggableItems.at(0).prop("position")).toEqual({ left: 123, top: 321 });
      expect(draggableItems.at(1).prop("position")).toEqual({ left: 999, top: 999 });
    });
  });
});
