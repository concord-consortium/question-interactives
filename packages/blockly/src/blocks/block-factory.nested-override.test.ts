import Blockly from "blockly/core";
import { registerCustomBlocks } from "./block-factory";
import { ICustomBlock } from "../components/types";

interface ICustomBlockWithXml extends Blockly.BlockSvg {
  __disclosureOpen: boolean;
  __savedChildrenXml: string;
}

describe("block-factory nested override", () => {
  let workspace: Blockly.WorkspaceSvg | null;
  let cb: ICustomBlockWithXml | null;

  beforeEach(() => {
    document.body.innerHTML = '<div id="workspace"></div>';
    const el = document.getElementById("workspace");
    if (!el) throw new Error("workspace element not found");
    workspace = Blockly.inject(el, { trashcan: false, toolbox: undefined });

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
        defaultChildBlocks: {
          "type": "custom_setter_color_test",
          "id": "?L/2u6!bZ5I,{#jfy/o-",
          "extraState": "<mutation xmlns=\"http://www.w3.org/1999/xhtml\" open=\"true\"></mutation>",
          "fields": {
            "value": "BLUE"
          }
        },
        inputsInline: true,
        nextStatement: true,
        previousStatement: true,
        typeOptions: [["water", "WATER"]]
      }
    };

    registerCustomBlocks([setterBlock, creatorBlock]);

    cb = workspace?.newBlock("custom_creator_molecules_test") as ICustomBlockWithXml;
    cb?.initSvg();
    cb?.render();
  });

  afterEach(() => {
    if (workspace) workspace.dispose();
    document.body.innerHTML = "";
  });

  it("starts closed with default child blocks that have non-default values", () => {
    expect(cb?.__disclosureOpen).toBe(false);
    expect(cb?.__savedChildrenXml).toContain(`<field name="value">BLUE</field>`);
  });
});
