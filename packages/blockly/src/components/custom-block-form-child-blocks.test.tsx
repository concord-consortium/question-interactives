import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CustomBlockFormChildBlocks } from "./custom-block-form-child-blocks";

const defaultProps = {
  availableChildOptions: [
    { id: "setter1", name: "color (setter)" },
    { id: "action1", name: "move (action)" }
  ],
  childBlocks: [],
  onChange: jest.fn()
};

describe("CustomBlockFormChildBlocks", () => {
  describe("Child Blocks Management", () => {
    it("renders child blocks selector with available options", () => {
      render(<CustomBlockFormChildBlocks {...defaultProps} />);
      
      expect(screen.getByText("Child Blocks")).toBeInTheDocument();
      expect(screen.getByText("color (setter)")).toBeInTheDocument();
      expect(screen.getByText("move (action)")).toBeInTheDocument();
    });

    it("shows the select element with correct attributes", () => {
      render(<CustomBlockFormChildBlocks {...defaultProps} />);
      
      const selectElement = screen.getByTestId("section-child-blocks").querySelector("select");
      expect(selectElement).toHaveAttribute("multiple");
      expect(selectElement).toHaveAttribute("size", "6");
      expect(selectElement).toHaveAttribute("id", "child-blocks");
    });

    it("handles onChange events correctly", async () => {
      const user = userEvent.setup();
      const mockOnChange = jest.fn();
      
      render(
        <CustomBlockFormChildBlocks 
          {...defaultProps} 
          onChange={mockOnChange}
        />
      );
      
      const selectElement = screen.getByTestId("section-child-blocks").querySelector("select");
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      await user.selectOptions(selectElement!, "setter1");
      
      expect(mockOnChange).toHaveBeenCalledTimes(1);
      expect(mockOnChange).toHaveBeenCalledWith(
        expect.objectContaining({
          target: expect.objectContaining({
            selectedOptions: expect.any(Object)
          })
        })
      );
    });

    it("displays currently selected child blocks", () => {
      const propsWithSelections = {
        ...defaultProps,
        childBlocks: ["setter1", "action1"]
      };
      
      render(<CustomBlockFormChildBlocks {...propsWithSelections} />);
      
      const selectElement = screen.getByTestId("section-child-blocks").querySelector("select");
      expect(selectElement).toHaveValue(["setter1", "action1"]);
    });
  });
});
