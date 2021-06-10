import { shallow } from "enzyme";
import React from "react";
import { DraggableItem } from "./draggable-item";

describe("DraggableItem", () => {
  it("renders image", () => {
    const wrapper = shallow(<DraggableItem item={{ id: "1", imageUrl: "https://image/1", imageWidth: 25, imageHeight: 25, label: "Image 1", value: 1, targetMatch: 1 }} />);
    const img = wrapper.find("img");
    expect(img.prop("src")).toEqual("https://image/1");
  });
});
