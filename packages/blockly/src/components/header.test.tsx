import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

import { Header } from "./header";

afterEach(cleanup);

const defaultProps = {
  name: "Model 1",
  savedStates: [],
};

// The File menu button toggles the menu on mousedown (see header.tsx).
const openMenu = () => fireEvent.mouseDown(screen.getByRole("button", { name: "File menu" }));

describe("Header", () => {
  it("returns focus to the File menu button when a menu item is activated", () => {
    render(<Header {...defaultProps} onShowFileModal={jest.fn()} />);
    const fileButton = screen.getByRole("button", { name: "File menu" });
    openMenu();
    fireEvent.click(screen.getByRole("menuitem", { name: /New/ }));
    // The activating menu item unmounts with the menu, so focus must be moved to
    // the persistent File menu button. That lets the dialog the parent renders in
    // response capture it and restore focus there when the dialog closes.
    expect(document.activeElement).toBe(fileButton);
  });

  it("still notifies the parent to open the requested dialog", () => {
    const onShowFileModal = jest.fn();
    render(<Header {...defaultProps} onShowFileModal={onShowFileModal} />);
    openMenu();
    fireEvent.click(screen.getByRole("menuitem", { name: /New/ }));
    expect(onShowFileModal).toHaveBeenCalledWith("new");
  });
});
