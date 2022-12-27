import React from "react";
import { mount } from "enzyme";
import { DraggableItem } from "./draggable-item";
import { TouchBackend } from "react-dnd-touch-backend";
import { DndProvider } from "react-dnd";
import { DraggableItemPreview } from "./draggable-item-preview";

jest.mock("react-dnd-preview", () => ({
  usePreview: () => ({
    display: true,
    style: {},
    item: { item: previewItem }
  })
}));

const previewItem = {
  id: "1",
  imageUrl: "http://image.url/1"
};

describe("DraggableItemPreview", () => {
  it("renders DraggableItem", () => {
    const wrapper = mount(
      <DndProvider backend={TouchBackend} options={{enableMouseEvents: true}}>
        <DraggableItemPreview />
      </DndProvider>
    );
    expect(wrapper.find(DraggableItem).length).toEqual(1);
    expect(wrapper.find(DraggableItem).prop("item")).toEqual(previewItem);
  });
});
