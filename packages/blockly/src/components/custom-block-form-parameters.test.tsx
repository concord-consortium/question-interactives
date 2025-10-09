import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CustomBlockFormParameters } from "./custom-block-form-parameters";

const defaultProps = {
  parameters: [
    {
      defaultValue: "all",
      kind: "select" as const,
      labelPosition: "prefix" as const,
      labelText: "Near",
      name: "near",
      options: [
        { label: "all", value: "ALL" },
        { label: "any", value: "ANY" },
        { label: "none", value: "NONE" }
      ]
    }
  ],
  onParametersChange: jest.fn()
};

describe("CustomBlockFormParameters", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Parameters Display", () => {
    it("renders existing parameters with correct values", () => {
      render(<CustomBlockFormParameters {...defaultProps} />);
      
      expect(screen.getByTestId("param-name-0")).toBeInTheDocument();
      expect(screen.getByTestId("param-name-0")).toHaveValue("near");
      expect(screen.getByTestId("param-labelText-0")).toBeInTheDocument();
      expect(screen.getByTestId("param-labelText-0")).toHaveValue("Near");
      expect(screen.getByTestId("param-labelPosition-0")).toBeInTheDocument();
      expect(screen.getByTestId("param-labelPosition-0")).toHaveValue("prefix");
      expect(screen.getByTestId("param-labelPosition-0")).toHaveDisplayValue("Before");
      expect(screen.getByTestId("param-labelPosition-0").children).toHaveLength(2); // prefix and suffix options
      expect(screen.getByTestId("param-select-options-0")).toBeInTheDocument();
      expect(screen.getByTestId("param-option-0-label-0")).toHaveValue("all");
      expect(screen.getByTestId("param-option-0-value-0")).toHaveValue("ALL");
      expect(screen.getByTestId("param-option-0-label-1")).toHaveValue("any");
      expect(screen.getByTestId("param-option-0-value-1")).toHaveValue("ANY");
      expect(screen.getByTestId("param-option-0-label-2")).toHaveValue("none");
      expect(screen.getByTestId("param-option-0-value-2")).toHaveValue("NONE");
    });
    
    it("renders one 'Add Select Parameter' button, one 'Add Number Parameter' button, and one 'Remove' button per parameter", () => {
      render(<CustomBlockFormParameters {...defaultProps} />);
      expect(screen.getAllByTestId("add-param-select")).toHaveLength(1);
      expect(screen.getAllByTestId("add-param-number")).toHaveLength(1);
      expect(screen.getAllByTestId("remove-param-0")).toHaveLength(1);
    });

    it("renders Remove buttons for each parameter option", () => {
      render(<CustomBlockFormParameters {...defaultProps} />);

      expect(screen.getByTestId("remove-param-option-0-0")).toBeInTheDocument(); // all option
      expect(screen.getByTestId("remove-param-option-0-1")).toBeInTheDocument(); // any option
      expect(screen.getByTestId("remove-param-option-0-2")).toBeInTheDocument(); // none option
    });
  });
  
  describe("Adding Parameters", () => {
    it("adds a new parameter when add buttons are clicked", async () => {
      const user = userEvent.setup();
      const mockOnParametersChange = jest.fn();
      
      render(
        <CustomBlockFormParameters 
          {...defaultProps} 
          onParametersChange={mockOnParametersChange}
        />
      );
      
      await user.click(screen.getByTestId("add-param-select"));
      
      expect(mockOnParametersChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ kind: "select" })
        ])
      );

      await user.click(screen.getByTestId("add-param-number"));

      expect(mockOnParametersChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ kind: "number" })
        ])
      );
    });
  });

  describe("Removing Parameters", () => {
    it("removes parameter when remove button is clicked", async () => {
      const user = userEvent.setup();
      const mockOnParametersChange = jest.fn();
      
      render(
        <CustomBlockFormParameters 
          {...defaultProps} 
          onParametersChange={mockOnParametersChange}
        />
      );
      
      await user.click(screen.getByTestId("remove-param-0"));
      
      expect(mockOnParametersChange).toHaveBeenCalledWith([]);
    });
  });

  describe("Adding and removing parameter options", () => {
    it("adds a new option when 'Add Option' button is clicked", async () => {
      const user = userEvent.setup();
      const mockOnParametersChange = jest.fn();
      
      render(
        <CustomBlockFormParameters 
          {...defaultProps} 
          onParametersChange={mockOnParametersChange}
        />
      );
      
      await user.click(screen.getByTestId("add-param-option-0"));
      
      expect(mockOnParametersChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            options: expect.arrayContaining([
              { label: "all", value: "ALL" },
              { label: "any", value: "ANY" },
              { label: "none", value: "NONE" },
              { label: "", value: "" } // New empty option
            ])
          })
        ])
      );
    });

    it("removes option when its remove button is clicked", async () => {
      const user = userEvent.setup();
      const mockOnParametersChange = jest.fn();
      
      render(
        <CustomBlockFormParameters 
          {...defaultProps} 
          onParametersChange={mockOnParametersChange}
        />
      );
      
      await user.click(screen.getByTestId("remove-param-option-0-1")); // Remove "any" option
      
      expect(mockOnParametersChange).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            options: [
              { label: "all", value: "ALL" },
              { label: "none", value: "NONE" }
            ]
          })
        ])
      );
    });
  });
});
