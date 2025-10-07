import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

import { CustomBlockEditor } from "./custom-block-editor";
import { ICustomBlock } from "./types";

jest.mock("./custom-block-editor.scss", () => ({}));
jest.mock("../utils/block-utils", () => {
  return {
    validateBlocksJson: jest.fn(),
    availableChildBlocks: jest.fn(() => [])
  };
});

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
        canHaveChildren: false,
        typeOptions: [["red", "RED"], ["blue", "BLUE"]]
      }
    },
    {
      id: "custom_create_molecules_1234567891",
      type: "creator",
      name: "molecules",
      color: "#00FF00",
      category: "General",
      config: {
        canHaveChildren: true,
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

    it("renders all block section headings and main elements", () => {
      render(<CustomBlockEditor {...defaultProps} />);
      // Setter
      expect(screen.getByTestId("section-setter")).toBeInTheDocument();
      expect(screen.getByText("Set Properties Blocks")).toBeInTheDocument();
      expect(screen.getByTestId("add-setter")).toBeInTheDocument();
      expect(screen.getByTestId("current-setter")).toBeInTheDocument();
      // Creator
      expect(screen.getByTestId("section-creator")).toBeInTheDocument();
      expect(screen.getByText("Create Things Blocks")).toBeInTheDocument();
      expect(screen.getByTestId("add-creator")).toBeInTheDocument();
      expect(screen.getByTestId("current-creator")).toBeInTheDocument();
      // Action
      expect(screen.getByTestId("section-action")).toBeInTheDocument();
      expect(screen.getByText("Action Blocks")).toBeInTheDocument();
      expect(screen.getByTestId("add-action")).toBeInTheDocument();
      expect(screen.getByTestId("current-action")).toBeInTheDocument();
      // Statement
      expect(screen.getByTestId("section-statement")).toBeInTheDocument();
      expect(screen.getByText("Statement Blocks")).toBeInTheDocument();
      expect(screen.getByTestId("add-statement")).toBeInTheDocument();
      expect(screen.getByTestId("current-statement")).toBeInTheDocument();
      // Condition
      expect(screen.getByTestId("section-condition")).toBeInTheDocument();
      expect(screen.getByText("Condition Blocks")).toBeInTheDocument();
      expect(screen.getByTestId("add-condition")).toBeInTheDocument();
      expect(screen.getByTestId("current-condition")).toBeInTheDocument();
    });

    // --- Set Properties (setter) ---
    it("shows no blocks message for empty setter blocks", () => {
      render(<CustomBlockEditor {...defaultProps} value={[]} />);
      expect(screen.getByText("No setter blocks created yet")).toBeInTheDocument();
    });
    it("displays existing setter blocks", () => {
      render(<CustomBlockEditor {...defaultProps} />);
      expect(screen.getByText((content, element) => {
        return element?.textContent === "color (setter) - Properties";
      })).toBeInTheDocument();
    });
    it("opens setter form when add setter button is clicked", async () => {
      const user = userEvent.setup();
      render(<CustomBlockEditor {...defaultProps} />);
      await user.click(screen.getByTestId("add-setter"));
      expect(screen.getByTestId("custom-block-form")).toBeInTheDocument();
      expect(screen.getByText("Property Name")).toBeInTheDocument();
    });
    it("toggles setter form visibility", async () => {
      const user = userEvent.setup();
      render(<CustomBlockEditor {...defaultProps} />);
      const addButton = screen.getByTestId("add-setter");
      expect(addButton).toHaveTextContent("Add Block");
      await user.click(addButton);
      expect(addButton).toHaveTextContent("Cancel");
      expect(screen.getByTestId("custom-block-form")).toBeInTheDocument();
      await user.click(addButton);
      expect(addButton).toHaveTextContent("Add Block");
      expect(screen.queryByTestId("custom-block-form")).not.toBeInTheDocument();
    });

    // --- Create Things (creator) ---
    it("shows no blocks message for empty creator blocks", () => {
      render(<CustomBlockEditor {...defaultProps} value={[]} />);
      expect(screen.getByText("No creator blocks created yet")).toBeInTheDocument();
    });
    it("displays existing creator blocks", () => {
      render(<CustomBlockEditor {...defaultProps} />);
      expect(screen.getByText((content, element) => {
        return element?.textContent === "molecules (creator) - General";
      })).toBeInTheDocument();
    });
    it("opens creator form when add creator button is clicked", async () => {
      const user = userEvent.setup();
      render(<CustomBlockEditor {...defaultProps} />);
      await user.click(screen.getByTestId("add-creator"));
      expect(screen.getByTestId("custom-block-form")).toBeInTheDocument();
      expect(screen.getByText("Object Name")).toBeInTheDocument();
    });
    it("toggles creator form visibility", async () => {
      const user = userEvent.setup();
      render(<CustomBlockEditor {...defaultProps} />);
      const addButton = screen.getByTestId("add-creator");
      expect(addButton).toHaveTextContent("Add Block");
      await user.click(addButton);
      expect(addButton).toHaveTextContent("Cancel");
      expect(screen.getByTestId("custom-block-form")).toBeInTheDocument();
      await user.click(addButton);
      expect(addButton).toHaveTextContent("Add Block");
      expect(screen.queryByTestId("custom-block-form")).not.toBeInTheDocument();
    });

    // --- Action (action) ---
    it("shows no blocks message for empty action blocks", () => {
      render(<CustomBlockEditor {...defaultProps} value={[]} />);
      expect(screen.getByText("No action blocks created yet")).toBeInTheDocument();
    });
    it("opens action form when add action button is clicked", async () => {
      const user = userEvent.setup();
      render(<CustomBlockEditor {...defaultProps} />);
      await user.click(screen.getByTestId("add-action"));
      expect(screen.getByTestId("custom-block-form")).toBeInTheDocument();
      expect(screen.getByText("Action Name")).toBeInTheDocument();
    });
    it("toggles action form visibility", async () => {
      const user = userEvent.setup();
      render(<CustomBlockEditor {...defaultProps} />);
      const addButton = screen.getByTestId("add-action");
      expect(addButton).toHaveTextContent("Add Block");
      await user.click(addButton);
      expect(addButton).toHaveTextContent("Cancel");
      expect(screen.getByTestId("custom-block-form")).toBeInTheDocument();
      await user.click(addButton);
      expect(addButton).toHaveTextContent("Add Block");
      expect(screen.queryByTestId("custom-block-form")).not.toBeInTheDocument();
    });

    // --- Statement (statement) ---
    it("shows no blocks message for empty statement blocks", () => {
      render(<CustomBlockEditor {...defaultProps} />);
      expect(screen.getByText("No statement blocks created yet")).toBeInTheDocument();
    });
    it("displays existing statement blocks", () => {
      const blocksWithStatement: ICustomBlock[] = [
        ...mockCustomBlocks,
        {
          id: "custom_statement_ask_123",
          type: "statement",
          name: "ask",
          color: "#0089b8",
          category: "Control",
          config: {
            canHaveChildren: false,
            statementKind: "ask",
            targetEntity: "molecules",
            options: [["water", "water"]]
          }
        }
      ];
      render(<CustomBlockEditor {...defaultProps} value={blocksWithStatement} />);
      expect(screen.getByText((content, element) => {
        return element?.textContent === "ask (statement) - Control";
      })).toBeInTheDocument();
    });
    it("opens statement form when add statement button is clicked", async () => {
      const user = userEvent.setup();
      render(<CustomBlockEditor {...defaultProps} />);
      await user.click(screen.getByTestId("add-statement"));
      expect(screen.getByTestId("section-statement-kind")).toBeInTheDocument();
      expect(screen.getByText("Statement Type")).toBeInTheDocument();
    });
    it("toggles statement form visibility", async () => {
      const user = userEvent.setup();
      render(<CustomBlockEditor {...defaultProps} />);
      const addButton = screen.getByTestId("add-statement");
      expect(addButton).toHaveTextContent("Add Block");
      await user.click(addButton);
      expect(addButton).toHaveTextContent("Cancel");
      expect(screen.getByTestId("section-statement-kind")).toBeInTheDocument();
      await user.click(addButton);
      expect(addButton).toHaveTextContent("Add Block");
      expect(screen.queryByTestId("section-statement-kind")).not.toBeInTheDocument();
    });

    // --- Condition (condition) ---
    it("shows no blocks message for empty condition blocks", () => {
      render(<CustomBlockEditor {...defaultProps} />);
      expect(screen.getByText("No condition blocks created yet")).toBeInTheDocument();
    });
    it("displays existing condition blocks", () => {
      const blocksWithCondition: ICustomBlock[] = [
        ...mockCustomBlocks,
        {
          id: "custom_condition_touching_456",
          type: "condition",
          name: "touching",
          color: "#0089b8",
          category: "Logic",
          config: {
            canHaveChildren: false,
            options: [["touching", "touching?"],],
            labelPosition: "prefix"
          }
        }
      ];
      render(<CustomBlockEditor {...defaultProps} value={blocksWithCondition} />);
      expect(screen.getByText((content, element) => {
        return element?.textContent === "touching (condition) - Logic";
      })).toBeInTheDocument();
    });
    it("opens condition form when add condition button is clicked", async () => {
      const user = userEvent.setup();
      render(<CustomBlockEditor {...defaultProps} />);
      await user.click(screen.getByTestId("add-condition"));
      expect(screen.getByTestId("section-options")).toBeInTheDocument();
      expect(screen.getByText("Options")).toBeInTheDocument();
    });
    it("toggles condition form visibility", async () => {
      const user = userEvent.setup();
      render(<CustomBlockEditor {...defaultProps} />);
      const addButton = screen.getByTestId("add-condition");
      expect(addButton).toHaveTextContent("Add Block");
      await user.click(addButton);
      expect(addButton).toHaveTextContent("Cancel");
      expect(screen.getByTestId("section-options")).toBeInTheDocument();
      await user.click(addButton);
      expect(addButton).toHaveTextContent("Add Block");
      expect(screen.queryByTestId("section-options")).not.toBeInTheDocument();
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
      expect(screen.getByText("No action blocks created yet")).toBeInTheDocument();
    });
  });

  describe("Block Management", () => {
    it("shows add buttons for all block types", () => {
      render(<CustomBlockEditor {...defaultProps} />);
      expect(screen.getAllByText("Add Block")).toHaveLength(5);
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
        config: {
          canHaveChildren: false,
        }
      };

      const generateBlockId = (block: ICustomBlock) => {
        const sanitizedName = block.name.toLowerCase().replace(/[^a-z0-9]/g, "_");
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
        config: {
          canHaveChildren: true,
        }
      };

      const generateBlockId = (block: ICustomBlock) => {
        const sanitizedName = block.name.toLowerCase().replace(/[^a-z0-9]/g, "_");
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

  describe("Code Preview Functionality", () => {
    it("shows code preview section", () => {
      render(<CustomBlockEditor {...defaultProps} />);
      expect(screen.getByText("Custom Blocks Code")).toBeInTheDocument();
      expect(screen.getByText("Show")).toBeInTheDocument();
    });

    it("toggles visibility", async () => {
      const user = userEvent.setup();
      render(<CustomBlockEditor {...defaultProps} />);
      const showButton = screen.getByTestId("code-toggle");

      await user.click(showButton);
      
      expect(screen.getByText("Hide")).toBeInTheDocument();
      const textarea = screen.getByTestId("code-textarea");
      expect(textarea).toBeInTheDocument();
      const jsonValue = (textarea as HTMLTextAreaElement).value;
      expect(jsonValue).toContain("setter");
      expect(jsonValue).toContain("color");
      expect(screen.getByTestId("code-reset")).toBeInTheDocument();
      expect(screen.getByTestId("code-update")).toBeInTheDocument();

      await user.click(showButton);
  
      expect(screen.getByText("Show")).toBeInTheDocument();
      expect(textarea).not.toBeInTheDocument();
    });

    it("displays JSON representation of custom blocks", async () => {
      const user = userEvent.setup();
      render(<CustomBlockEditor {...defaultProps} />);
      
      await user.click(screen.getByTestId("code-toggle"));
      
      const textarea = screen.getByTestId("code-textarea");
      expect(textarea).toBeInTheDocument();
      const jsonValue = (textarea as HTMLTextAreaElement).value;
      expect(jsonValue).toContain("setter");
      expect(jsonValue).toContain("color");
    });
  });
});
