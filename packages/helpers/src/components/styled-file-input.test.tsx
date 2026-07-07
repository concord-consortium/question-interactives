import React from "react";
import { render, screen } from "@testing-library/react";
import { StyledFileInput } from "./styled-file-input";

describe("StyledFileInput", () => {
  it("nests the file input inside the label so :focus-within shows focus on the label", () => {
    render(
      <StyledFileInput buttonClass="btn" onChange={jest.fn()} id="x">
        Upload
      </StyledFileInput>
    );
    const label = screen.getByTestId("upload-btn");
    const input = screen.getByTestId("file-input");
    expect(label.tagName).toBe("LABEL");
    expect(label).toContainElement(input);
  });
});
