import { render, screen, waitFor } from "@testing-library/react";
import React from "react";

import { ICustomBlock, SEED_BLOCK_TYPES } from "./types";
import { StarterProgramEditor } from "./starter-program-editor";

const validToolbox = JSON.stringify({
  kind: "categoryToolbox",
  contents: [
    { kind: "category", name: "General", colour: "#00836B", contents: [] }
  ]
});

const wrap = (blocks: Record<string, any>[]) => JSON.stringify({ blocks: { blocks } });

const starterWithNested = wrap([
  {
    type: "setup", x: 10, y: 10, deletable: false,
    inputs: { statements: { block: { type: "controls_if", id: "starter-if" } } }
  },
  { type: "go", x: 10, y: 80, deletable: false },
  { type: "onclick", x: 10, y: 150, deletable: false }
]);

describe("StarterProgramEditor", () => {
  it("renders with seed blocks when starterBlocklyState is empty", () => {
    render(
      <StarterProgramEditor
        customBlocks={[]}
        starterBlocklyState=""
        toolbox={validToolbox}
        onChange={jest.fn()}
      />
    );
    expect(screen.getByTestId("starter-program-editor")).toBeInTheDocument();
    expect(screen.getByText("Starter Program")).toBeInTheDocument();
    expect(document.querySelector(".injectionDiv")).toBeInTheDocument();
    SEED_BLOCK_TYPES.forEach(type => {
      expect(document.querySelector(`.${type}`)).toBeInTheDocument();
    });
  });

  it("loads existing starterBlocklyState", async () => {
    render(
      <StarterProgramEditor
        customBlocks={[]}
        starterBlocklyState={starterWithNested}
        toolbox={validToolbox}
        onChange={jest.fn()}
      />
    );
    await waitFor(() => {
      expect(document.querySelector(".controls_if")).toBeInTheDocument();
    });
  });

  it("falls back to seed blocks on malformed input", () => {
    render(
      <StarterProgramEditor
        customBlocks={[]}
        starterBlocklyState="not json"
        toolbox={validToolbox}
        onChange={jest.fn()}
      />
    );
    expect(document.querySelector(".injectionDiv")).toBeInTheDocument();
    SEED_BLOCK_TYPES.forEach(type => {
      expect(document.querySelector(`.${type}`)).toBeInTheDocument();
    });
  });

  it("calls onChange with pruned value when a custom block is removed", async () => {
    const customBlock: ICustomBlock = {
      category: "General",
      color: "#FF0000",
      config: { canHaveChildren: false, previousStatement: true, nextStatement: true },
      id: "custom_test_block",
      name: "test",
      type: "action"
    };

    const starterWithCustom = wrap([
      {
        type: "setup", x: 10, y: 10, deletable: false,
        inputs: { statements: { block: { type: "custom_test_block", id: "c1" } } }
      },
      { type: "go", x: 10, y: 80, deletable: false },
      { type: "onclick", x: 10, y: 150, deletable: false }
    ]);

    const onChange = jest.fn<void, [string]>();

    const { rerender } = render(
      <StarterProgramEditor
        customBlocks={[customBlock]}
        starterBlocklyState={starterWithCustom}
        toolbox={validToolbox}
        onChange={onChange}
      />
    );

    // Remove the custom block from the list
    rerender(
      <StarterProgramEditor
        customBlocks={[]}
        starterBlocklyState={starterWithCustom}
        toolbox={validToolbox}
        onChange={onChange}
      />
    );

    // onChange fires multiple times (initial load, seed events, prune-persist).
    // Find a coherent "pruned" call: the stale custom block reference is gone AND the three
    // seed blocks are all still present.
    const isCoherentPrunedCall = (serialized: string) => {
      const blocks = JSON.parse(serialized)?.blocks?.blocks;
      if (!Array.isArray(blocks)) return false;
      const byType = new Map(blocks.map((b: Record<string, any>) => [b.type, b]));
      const setup = byType.get("setup");
      if (!setup || setup.inputs) return false; // setup must exist, and must no longer have the stale child
      return byType.has("go") && byType.has("onclick");
    };
    await waitFor(() => {
      const prunedCalls = onChange.mock.calls.filter(([serialized]) => isCoherentPrunedCall(serialized));
      expect(prunedCalls.length).toBeGreaterThan(0);
    });
  });

  it("does not render workspace when toolbox is empty", () => {
    render(
      <StarterProgramEditor
        customBlocks={[]}
        starterBlocklyState=""
        toolbox=""
        onChange={jest.fn()}
      />
    );
    expect(screen.getByTestId("starter-program-editor")).toBeInTheDocument();
    expect(document.querySelector(".injectionDiv")).not.toBeInTheDocument();
  });
});
