import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { UploadButton } from "./upload-button";

describe("UploadButton", () => {
  it("renders a native button whose accessible name is its text", () => {
    render(<UploadButton onClick={jest.fn()}>Take Snapshot</UploadButton>);
    const btn = screen.getByRole("button", { name: "Take Snapshot" });
    expect(btn.tagName).toBe("BUTTON");
  });

  it("calls onClick with 'upload' when activated", () => {
    const onClick = jest.fn();
    render(<UploadButton onClick={onClick}>Take Snapshot</UploadButton>);
    fireEvent.click(screen.getByRole("button", { name: "Take Snapshot" }));
    expect(onClick).toHaveBeenCalledWith("upload");
  });

  it("is disabled and does not fire onClick when disabled", () => {
    const onClick = jest.fn();
    render(<UploadButton onClick={onClick} disabled={true}>Take Snapshot</UploadButton>);
    const btn = screen.getByRole("button", { name: "Take Snapshot" });
    expect(btn).toBeDisabled();
    fireEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("forwards data-testid to the button", () => {
    render(<UploadButton onClick={jest.fn()} data-testid="snapshot-btn">Take Snapshot</UploadButton>);
    expect(screen.getByTestId("snapshot-btn").tagName).toBe("BUTTON");
  });
});
