import React from "react";
import { mount } from "enzyme";
import { DraggableItemWrapper } from "./draggable-item-wrapper";
import { DraggableItem } from "./draggable-item";
import { TouchBackend } from "react-dnd-touch-backend";
import { DndProvider } from "react-dnd";
import { DynamicTextTester } from "@concord-consortium/question-interactives-helpers/src/utilities/dynamic-text-tester";

describe("DraggableItemWrapper", () => {
  it("renders DraggableItem", () => {
    const wrapper = mount(
      <DndProvider backend={TouchBackend} options={{enableMouseEvents: true}} >
        <DynamicTextTester>
          <DraggableItemWrapper
            item={{id: "1", imageUrl: "https://image/1", label:"", value: 1, targetMatch: 0}}
            position={{left: 1, top: 1}}
            draggable={true}
          />
        </DynamicTextTester>
      </DndProvider>
    );
    expect(wrapper.find(DraggableItem).length).toEqual(1);
  });
});
