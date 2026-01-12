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
        defaultCount: 100,
        minCount: 0,
        maxCount: 500,
        typeOptions: [["water", "WATER"], ["air", "AIR"]]
      }
    }
  ];

  const defaultProps = {
    customBlocks: mockCustomBlocks,
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
