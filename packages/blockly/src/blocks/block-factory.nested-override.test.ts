import Blockly from "blockly/core";
import { registerCustomBlocks } from "./block-factory";
import { ICustomBlock } from "../components/types";

interface ICustomBlockWithXml extends Blockly.BlockSvg {
  __savedChildrenXml: string;
}

describe("block-factory nested override", () => {
  let workspace: Blockly.WorkspaceSvg | null;

  beforeEach(() => {
    document.body.innerHTML = '<div id="workspace"></div>';
    const el = document.getElementById("workspace");
    if (!el) throw new Error("workspace element not found");
    workspace = Blockly.inject(el, { trashcan: false, toolbox: undefined });
  });

  afterEach(() => {
    if (workspace) workspace.dispose();
    document.body.innerHTML = "";
  });

  test("applies nested default override to child dropdown", () => {
    const setterBlock: ICustomBlock = {
      id: "custom_setter_color_test",
      name: "color",
      type: "setter",
      category: "Properties",
      color: "#000000",
      config: {
        canHaveChildren: false,
        inputsInline: true,
        nextStatement: true,
        previousStatement: true,
        typeOptions: [["blue", "BLUE"], ["red", "RED"]],
        defaultOptionValue: "RED"
      }
    };

    const creatorBlock: ICustomBlock = {
      id: "custom_creator_molecules_test",
      name: "molecules",
      type: "creator",
      category: "Properties",
      color: "#000000",
      config: {
        canHaveChildren: true,
        inputsInline: true,
        nextStatement: true,
        previousStatement: true,
        childBlocks: [
          { blockId: "custom_setter_color_test", defaultOptionValue: "BLUE" }
        ],
        typeOptions: [["water", "WATER"]]
      }
    };

    registerCustomBlocks([setterBlock, creatorBlock]);

    const cb = workspace?.newBlock("custom_creator_molecules_test") as ICustomBlockWithXml;
    cb?.initSvg();
    cb?.render();

    expect(cb.__savedChildrenXml).toContain(`<field name="value">BLUE</field>`);
  });
});
