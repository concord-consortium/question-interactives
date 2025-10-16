import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";

jest.mock("blockly/core", () => {
  const actualBlockly = jest.requireActual("blockly/core");
  return {
    ...actualBlockly,
    Blocks: {
      chance: {
        init: jest.fn()
      },
      repeat: {
        init: jest.fn()
      },
      when: {
        init: jest.fn()
      },
      controls_if: {
        init: jest.fn()
      },
      logic_negate: {
        init: jest.fn()
      },
      logic_operation: {
        init: jest.fn()
      }
    }
  };
});

// Import after mock is set up
import { BuiltInBlockEditorSection } from "./built-in-block-editor-section";

const defaultProps = {
  availableCategories: ["First Category", "Second Category"],
  blockCategories: {"First Category": "test_block"},
  onCategoryChange: jest.fn()
};

describe("BuiltInBlockEditorSection", () => {
  it("renders the built-in blocks section with header", () => {
    render(<BuiltInBlockEditorSection {...defaultProps} />);

    expect(screen.getByTestId("section-built-in")).toBeInTheDocument();
    expect(screen.getByText("Built-in Blocks")).toBeInTheDocument();
    expect(screen.getByTestId("toggle-built-in")).toBeInTheDocument();
  });

  it("shows block count in header", () => {
    render(<BuiltInBlockEditorSection {...defaultProps} />);

    expect(screen.getByText(/\(1 block in toolbox\)/)).toBeInTheDocument();
  });

  it("expands to show blocks when toggle is clicked", async () => {
    const user = userEvent.setup();
    render(<BuiltInBlockEditorSection {...defaultProps} />);

    expect(screen.queryByTestId("block-list")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("toggle-built-in"));

    expect(screen.getByTestId("block-list")).toBeInTheDocument();
    expect(screen.getByText("chance block")).toBeInTheDocument();
    expect(screen.getAllByTestId("block-list-item").length).toBeGreaterThan(0);
  });

  it("calls onChange when category is changed", async () => {
    const user = userEvent.setup();
    render(<BuiltInBlockEditorSection {...defaultProps} />);

    await user.click(screen.getByTestId("toggle-built-in"));

    const select = screen.getByTestId("select-category-chance");
    await user.selectOptions(select, "Second Category");

    expect(defaultProps.onCategoryChange).toHaveBeenCalledWith("chance", "Second Category");
  });
});
