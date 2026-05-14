import React from "react";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Modal } from "./modal";

// Simple icon component for tests.
const DummyIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} />;

const defaultProps = {
  variant: "orange" as const,
  title: "Test Title",
  Icon: DummyIcon,
  message: "Test message",
  confirmLabel: "OK",
};

afterEach(cleanup);

describe("Modal", () => {
  describe("confirm mode (default)", () => {
    it("renders both Cancel and X close buttons", () => {
      render(
        <Modal
          {...defaultProps}
          onConfirm={jest.fn()}
          onCancel={jest.fn()}
        />
      );
      expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "OK" })).toBeInTheDocument();
    });

    it("calls onConfirm when OK is clicked", () => {
      const onConfirm = jest.fn();
      render(
        <Modal
          {...defaultProps}
          onConfirm={onConfirm}
          onCancel={jest.fn()}
        />
      );
      fireEvent.click(screen.getByRole("button", { name: "OK" }));
      expect(onConfirm).toHaveBeenCalled();
    });

    it("calls onCancel when Cancel is clicked", () => {
      const onCancel = jest.fn();
      render(
        <Modal
          {...defaultProps}
          onConfirm={jest.fn()}
          onCancel={onCancel}
        />
      );
      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
      expect(onCancel).toHaveBeenCalled();
    });

    it("calls onCancel when X close is clicked", () => {
      const onCancel = jest.fn();
      render(
        <Modal
          {...defaultProps}
          onConfirm={jest.fn()}
          onCancel={onCancel}
        />
      );
      fireEvent.click(screen.getByRole("button", { name: "Close" }));
      expect(onCancel).toHaveBeenCalled();
    });

    it("does not move initial focus to the OK button", () => {
      render(
        <Modal
          {...defaultProps}
          onConfirm={jest.fn()}
          onCancel={jest.fn()}
        />
      );
      // In confirm mode there is no initial focus management.
      expect(document.activeElement).not.toBe(screen.getByRole("button", { name: "OK" }));
    });
  });

  describe("alert mode", () => {
    it("does not render Cancel button or X close button", () => {
      render(
        <Modal
          {...defaultProps}
          mode="alert"
          onConfirm={jest.fn()}
          onCancel={jest.fn()}
        />
      );
      expect(screen.queryByRole("button", { name: "Cancel" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Close" })).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "OK" })).toBeInTheDocument();
    });

    it("moves initial focus to the OK button", () => {
      render(
        <Modal
          {...defaultProps}
          mode="alert"
          onConfirm={jest.fn()}
          onCancel={jest.fn()}
        />
      );
      expect(document.activeElement).toBe(screen.getByRole("button", { name: "OK" }));
    });

    it("calls onConfirm when Escape is pressed (and not onCancel)", () => {
      const onConfirm = jest.fn();
      const onCancel = jest.fn();
      render(
        <Modal
          {...defaultProps}
          mode="alert"
          onConfirm={onConfirm}
          onCancel={onCancel}
        />
      );
      const dialog = screen.getByRole("dialog");
      fireEvent.keyDown(dialog, { key: "Escape" });
      expect(onConfirm).toHaveBeenCalled();
      expect(onCancel).not.toHaveBeenCalled();
    });

    it("calls onConfirm when OK is clicked", () => {
      const onConfirm = jest.fn();
      render(
        <Modal
          {...defaultProps}
          mode="alert"
          onConfirm={onConfirm}
          onCancel={jest.fn()}
        />
      );
      fireEvent.click(screen.getByRole("button", { name: "OK" }));
      expect(onConfirm).toHaveBeenCalled();
    });

    it("restores focus to the previously focused element on dismiss via OK click", () => {
      const Wrapper = () => {
        const [open, setOpen] = React.useState(false);
        return (
          <div>
            <button
              onClick={() => setOpen(true)}
              data-testid="opener"
            >
              open
            </button>
            {open && (
              <Modal
                {...defaultProps}
                mode="alert"
                onConfirm={() => setOpen(false)}
                onCancel={() => setOpen(false)}
              />
            )}
          </div>
        );
      };
      render(<Wrapper />);
      const opener = screen.getByTestId("opener");
      opener.focus();
      expect(document.activeElement).toBe(opener);
      fireEvent.click(opener);
      // Modal should be open and focus on OK.
      const ok = screen.getByRole("button", { name: "OK" });
      expect(document.activeElement).toBe(ok);
      fireEvent.click(ok);
      // Modal closed; focus restored to opener.
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(document.activeElement).toBe(opener);
    });

    it("restores focus to the previously focused element on dismiss via Escape", () => {
      const Wrapper = () => {
        const [open, setOpen] = React.useState(false);
        return (
          <div>
            <button onClick={() => setOpen(true)} data-testid="opener">open</button>
            {open && (
              <Modal
                {...defaultProps}
                mode="alert"
                onConfirm={() => setOpen(false)}
                onCancel={() => setOpen(false)}
              />
            )}
          </div>
        );
      };
      render(<Wrapper />);
      const opener = screen.getByTestId("opener");
      opener.focus();
      fireEvent.click(opener);
      const dialog = screen.getByRole("dialog");
      fireEvent.keyDown(dialog, { key: "Escape" });
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(document.activeElement).toBe(opener);
    });

    it("traps focus on the single focusable OK button (Tab is prevented)", async () => {
      const user = userEvent.setup();
      render(
        <Modal
          {...defaultProps}
          mode="alert"
          onConfirm={jest.fn()}
          onCancel={jest.fn()}
        />
      );
      const ok = screen.getByRole("button", { name: "OK" });
      expect(document.activeElement).toBe(ok);
      // Tab and Shift+Tab should both keep focus on OK (single-focusable trap).
      await user.tab();
      expect(document.activeElement).toBe(ok);
      await user.tab({ shift: true });
      expect(document.activeElement).toBe(ok);
    });
  });

  describe("both modes", () => {
    it.each([
      ["confirm", "confirm" as const],
      ["alert", "alert" as const],
    ])("renders dialog role with aria-modal, aria-labelledby pointing at title, aria-describedby pointing at message (%s mode)", (_label, mode) => {
      render(
        <Modal
          {...defaultProps}
          mode={mode}
          onConfirm={jest.fn()}
          onCancel={jest.fn()}
        />
      );
      const dialog = screen.getByRole("dialog");
      expect(dialog).toHaveAttribute("aria-modal", "true");
      const labelledBy = dialog.getAttribute("aria-labelledby");
      const describedBy = dialog.getAttribute("aria-describedby");
      expect(labelledBy).toBeTruthy();
      expect(describedBy).toBeTruthy();
      expect(document.getElementById(labelledBy || "")).toHaveTextContent("Test Title");
      expect(document.getElementById(describedBy || "")).toHaveTextContent("Test message");
    });

    it("generates unique ids when two modals coexist", () => {
      render(
        <>
          <Modal
            {...defaultProps}
            title="Modal A"
            onConfirm={jest.fn()}
            onCancel={jest.fn()}
          />
          <Modal
            {...defaultProps}
            title="Modal B"
            onConfirm={jest.fn()}
            onCancel={jest.fn()}
          />
        </>
      );
      const dialogs = screen.getAllByRole("dialog");
      expect(dialogs).toHaveLength(2);
      const ids = dialogs.map(d => d.getAttribute("aria-labelledby"));
      expect(ids[0]).not.toEqual(ids[1]);
    });
  });
});
