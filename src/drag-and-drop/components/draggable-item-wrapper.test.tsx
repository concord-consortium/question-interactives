import React from "react";
import { mount } from "enzyme";
import { DraggableItemWrapper } from "./draggable-item-wrapper";
import { DraggableItem } from "./draggable-item";
import { TouchBackend } from "react-dnd-touch-backend";
import { DndProvider } from "react-dnd";

describe("DraggableItemWrapper", () => {
  it("renders DraggableItem", () => {
    const wrapper = mount(
      <DndProvider backend={TouchBackend} options={{enableMouseEvents: true}} >
        <DraggableItemWrapper item={{ id: "1", imageUrl: "https://image/1", itemLabel: "image label", index: 1, itemValue: 5, itemUnit: "oz" }} position={{ left: 1, top: 1}} draggable={true} />
      </DndProvider>
    );
    expect(wrapper.find(DraggableItem).length).toEqual(1);
  });
});
