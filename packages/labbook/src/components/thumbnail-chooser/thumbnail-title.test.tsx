import React from "react";
import { render, screen } from "@testing-library/react";
import { ThumbnailTitle } from "./thumbnail-title";

describe("ThumbnailTitle component", () => {
  it("renders empty title", () => {
    render(<ThumbnailTitle title="Test Title" empty={true} />);
    expect(screen.getByTestId("thumbnail-title")).toBeInTheDocument();
    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByTestId("thumbnail-title")).toHaveClass("empty");
  });

  it("renders non-empty title", () => {
    render(<ThumbnailTitle title="Test Title" empty={false}/>);
    expect(screen.getByTestId("thumbnail-title")).toBeInTheDocument();
    expect(screen.getByText("Test Title")).toBeInTheDocument();
    expect(screen.getByTestId("thumbnail-title")).not.toHaveClass("empty");
  });
});
