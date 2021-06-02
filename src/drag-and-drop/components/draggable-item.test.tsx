import { shallow } from "enzyme";
import React from "react";
import { DraggableItem } from "./draggable-item";

describe("DraggableItem", () => {
  it("renders image", () => {
    const wrapper = shallow(<DraggableItem item={{ id: "1", imageUrl: "https://image/1", imageWidth: 25, imageHeight: 25, itemLabel: "image label", index: 1, itemValue: 5, targetMatch: 3 }} />);
    const img = wrapper.find("img");
    expect(img.prop("src")).toEqual("https://image/1");
  });
});
