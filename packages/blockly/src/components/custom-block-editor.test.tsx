import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

import { CustomBlockEditor } from "./custom-block-editor";
import { ICustomBlock } from "./types";

jest.mock("./custom-block-editor.scss", () => ({}));

describe("CustomBlockEditor", () => {
  const mockOnChange = jest.fn();
  const mockCustomBlocks: ICustomBlock[] = [
    {
      id: "custom_set_color_1234567890",
      type: "setter",
      name: "color",
      color: "#FF0000",
      category: "Properties",
      config: {
        typeOptions: [["red", "RED"], ["blue", "BLUE"]],
        includeNumberInput: false
      }
    },
    {
      id: "custom_create_molecules_1234567891",
      type: "creator",
      name: "molecules",
      color: "#00FF00",
      category: "General",
      config: {
        childBlocks: ["custom_set_color_1234567890"],
        defaultCount: 100,
        minCount: 0,
        maxCount: 500,
        typeOptions: [["water", "WATER"], ["air", "AIR"]]
      }
    }
  ];

  const defaultProps = {
    value: mockCustomBlocks,
    onChange: mockOnChange,
    toolbox: `{
      "kind": "categoryToolbox",
      "contents": [
        {
          "kind": "category",
          "name": "Properties",
          "contents": []
        },
        {
          "kind": "category", 
          "name": "General",
          "contents": []
        }
      ]
    }`
  };

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  describe("Rendering", () => {
    it("renders the custom blocks editor", () => {
      render(<CustomBlockEditor {...defaultProps} />);
      expect(screen.getByText("Custom Blocks")).toBeInTheDocument();
    });

    it("shows setter and creator block sections", () => {
      render(<CustomBlockEditor {...defaultProps} />);
      expect(screen.getByText("Setter Blocks")).toBeInTheDocument();
      expect(screen.getByText("Creator Blocks")).toBeInTheDocument();
    });

    it("shows existing custom blocks", () => {
      render(<CustomBlockEditor {...defaultProps} />);
      expect(screen.getByText("color")).toBeInTheDocument();
      expect(screen.getByText("molecules")).toBeInTheDocument();
    });

    it("shows empty state messages when no blocks exist", () => {
      render(<CustomBlockEditor {...defaultProps} value={[]} />);
      expect(screen.getByText("No setter blocks created yet")).toBeInTheDocument();
      expect(screen.getByText("No creator blocks created yet")).toBeInTheDocument();
    });
  });

  describe("Block Management", () => {
    it("shows add buttons for both block types", () => {
      render(<CustomBlockEditor {...defaultProps} />);
      expect(screen.getAllByText("Add Block")).toHaveLength(2);
    });

    it("shows edit and delete buttons for each block", () => {
      render(<CustomBlockEditor {...defaultProps} />);
      
      const editButtons = screen.getAllByText("Edit");
      const deleteButtons = screen.getAllByText("Delete");
      
      expect(editButtons).toHaveLength(2);
      expect(deleteButtons).toHaveLength(2);
    });

    it("deletes block when delete button is clicked", async () => {
      const user = userEvent.setup();
      render(<CustomBlockEditor {...defaultProps} />);
      
      const deleteButtons = screen.getAllByText("Delete");
      await user.click(deleteButtons[0]);
      
      expect(mockOnChange).toHaveBeenCalledWith([
        expect.objectContaining({
          id: "custom_create_molecules_1234567891",
          type: "creator"
        })
      ]);
    });
  });

  describe("ID Generation", () => {
    it("generates descriptive IDs for setter blocks", () => {
      const setterBlock: ICustomBlock = {
        id: "",
        type: "setter",
        name: "speed limit",
        color: "#FF0000",
        category: "Properties",
        config: {}
      };

      const generateBlockId = (block: ICustomBlock) => {
        const sanitizedName = block.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const timestamp = Date.now();
        return `custom_${block.type}_${sanitizedName}_${timestamp}`;
      };
      
      const id = generateBlockId(setterBlock);
      expect(id).toMatch(/^custom_setter_speed_limit_\d+$/);
    });

    it("generates descriptive IDs for creator blocks", () => {
      const creatorBlock: ICustomBlock = {
        id: "",
        type: "creator",
        name: "water particles",
        color: "#00FF00",
        category: "General",
        config: {}
      };

      const generateBlockId = (block: ICustomBlock) => {
        const sanitizedName = block.name.toLowerCase().replace(/[^a-z0-9]/g, '_');
        const timestamp = Date.now();
        return `custom_${block.type}_${sanitizedName}_${timestamp}`;
      };
      
      const id = generateBlockId(creatorBlock);
      expect(id).toMatch(/^custom_creator_water_particles_\d+$/);
    });
  });

  describe("Form State Management", () => {
    it("handles empty value array", () => {
      render(<CustomBlockEditor {...defaultProps} value={[]} />);
      expect(screen.getByText("No setter blocks created yet")).toBeInTheDocument();
      expect(screen.getByText("No creator blocks created yet")).toBeInTheDocument();
    });

    it("handles undefined value", () => {
      render(<CustomBlockEditor {...defaultProps} value={undefined as any} />);
      expect(screen.getByText("No setter blocks created yet")).toBeInTheDocument();
      expect(screen.getByText("No creator blocks created yet")).toBeInTheDocument();
    });
  });
});
