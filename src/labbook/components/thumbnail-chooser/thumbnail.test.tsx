import React from "react";
import { render, screen } from "@testing-library/react";
import { IThumbnailProps, Thumbnail } from "./thumbnail";
import "@testing-library/jest-dom";

describe("Thumbnail component", () => {

  it("renders empty thumbnail", () => {
    const props:IThumbnailProps = {
      id: "one",
      empty: true,
      thumbContent: "This is some text",
      data: {}
    };
    render(<Thumbnail {...props} />);
    expect(screen.getByTestId("thumbnail")).toHaveTextContent("This is some text");
  });
});
