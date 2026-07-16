import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

import { Header } from "./header";

afterEach(cleanup);

const defaultProps = {
  name: "Model 1",
  savedStates: [],
};

// The File button toggles the menu on click.
const openMenu = () => fireEvent.click(screen.getByRole("button", { name: "File menu" }));

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

  it("opens the menu on button click and moves focus to the first item", () => {
    render(<Header {...defaultProps} onShowFileModal={jest.fn()} />);
    openMenu();
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(document.activeElement).toBe(screen.getByRole("menuitem", { name: /New/ }));
  });

  it("toggles the menu closed on a second button click", () => {
    render(<Header {...defaultProps} onShowFileModal={jest.fn()} />);
    openMenu();
    openMenu();
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("closes the menu on an outside mousedown", () => {
    render(<Header {...defaultProps} onShowFileModal={jest.fn()} />);
    openMenu();
    expect(screen.getByRole("menu")).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("gives only the active item tabIndex 0 (roving tabindex)", () => {
    render(<Header {...defaultProps} onShowFileModal={jest.fn()} />);
    openMenu();
    const items = screen.getAllByRole("menuitem");
    expect(items[0]).toHaveAttribute("tabindex", "0");
    items.slice(1).forEach(item => expect(item).toHaveAttribute("tabindex", "-1"));
  });

  it("opens the menu and focuses the first item on ArrowDown from the button", () => {
    render(<Header {...defaultProps} onShowFileModal={jest.fn()} />);
    const button = screen.getByRole("button", { name: "File menu" });
    button.focus();
    fireEvent.keyDown(button, { key: "ArrowDown" });
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(document.activeElement).toBe(screen.getByRole("menuitem", { name: /New/ }));
  });

  it("opens the menu and focuses the last item on ArrowUp from the button", () => {
    render(<Header {...defaultProps} onShowFileModal={jest.fn()} />);
    const button = screen.getByRole("button", { name: "File menu" });
    button.focus();
    fireEvent.keyDown(button, { key: "ArrowUp" });
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(document.activeElement).toBe(screen.getByRole("menuitem", { name: /Delete/ }));
  });

  it("moves focus to the next/previous item with Arrow keys, wrapping at the ends", () => {
    render(<Header {...defaultProps} onShowFileModal={jest.fn()} />);
    openMenu();
    const menuItems = screen.getAllByRole("menuitem"); // [New, Open, Make a copy, Rename, Delete]
    const menu = screen.getByRole("menu");
    expect(document.activeElement).toBe(menuItems[0]);
    fireEvent.keyDown(menu, { key: "ArrowDown" });
    expect(document.activeElement).toBe(menuItems[1]);
    fireEvent.keyDown(menu, { key: "ArrowUp" });
    expect(document.activeElement).toBe(menuItems[0]);
    fireEvent.keyDown(menu, { key: "ArrowUp" }); // wrap to last
    expect(document.activeElement).toBe(menuItems[4]);
    fireEvent.keyDown(menu, { key: "ArrowDown" }); // wrap to first
    expect(document.activeElement).toBe(menuItems[0]);
  });

  it("jumps to the first/last item with Home/End", () => {
    render(<Header {...defaultProps} onShowFileModal={jest.fn()} />);
    openMenu();
    const menuItems = screen.getAllByRole("menuitem");
    const menu = screen.getByRole("menu");
    fireEvent.keyDown(menu, { key: "End" });
    expect(document.activeElement).toBe(menuItems[4]);
    fireEvent.keyDown(menu, { key: "Home" });
    expect(document.activeElement).toBe(menuItems[0]);
  });

  it.each(["Enter", " "])(
    "activates the focused enabled item on '%s', closes the menu, and refocuses the button",
    (key) => {
      const onShowFileModal = jest.fn();
      render(<Header {...defaultProps} onShowFileModal={onShowFileModal} />);
      const button = screen.getByRole("button", { name: "File menu" });
      fireEvent.click(button); // opens, focus on New (index 0)
      fireEvent.keyDown(screen.getByRole("menu"), { key });
      expect(onShowFileModal).toHaveBeenCalledWith("new");
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
      expect(document.activeElement).toBe(button);
    }
  );

  it("marks the disabled Open item aria-disabled and does not activate it", () => {
    const onShowFileModal = jest.fn();
    render(<Header {...defaultProps} onShowFileModal={onShowFileModal} />);
    fireEvent.click(screen.getByRole("button", { name: "File menu" }));
    const menu = screen.getByRole("menu");
    const open = screen.getByRole("menuitem", { name: /Open/ });
    expect(open).toHaveAttribute("aria-disabled", "true");
    fireEvent.keyDown(menu, { key: "ArrowDown" }); // move to Open (index 1)
    expect(document.activeElement).toBe(open);      // reachable by keyboard
    fireEvent.keyDown(menu, { key: "Enter" });
    expect(onShowFileModal).not.toHaveBeenCalled();  // no-op
    expect(screen.getByRole("menu")).toBeInTheDocument(); // stays open
  });

  it.each(["Escape", "Tab"])(
    "closes the menu and returns focus to the button on %s",
    (key) => {
      render(<Header {...defaultProps} onShowFileModal={jest.fn()} />);
      const button = screen.getByRole("button", { name: "File menu" });
      fireEvent.click(button);
      fireEvent.keyDown(screen.getByRole("menu"), { key });
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
      expect(document.activeElement).toBe(button);
    }
  );

  it("closes and returns focus to the button on Shift+Tab", () => {
    render(<Header {...defaultProps} onShowFileModal={jest.fn()} />);
    const button = screen.getByRole("button", { name: "File menu" });
    fireEvent.click(button);
    fireEvent.keyDown(screen.getByRole("menu"), { key: "Tab", shiftKey: true });
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
    expect(document.activeElement).toBe(button);
  });
});
