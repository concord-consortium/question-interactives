import { ICustomBlock } from "../components/types";

export const preMadeBlocks: ICustomBlock[] = [
	{
		category: "",
		color: "#0089b8",
		config: {
			canHaveChildren: true,
			inputsInline: true,
			nextStatement: true,
			previousStatement: true,
		},
    id: "pre_made_statement_chance",
		name: "Chance",
		type: "preMade",
	},
	{
		category: "",
		color: "#0089b8",
		config: {
			canHaveChildren: true,
			inputsInline: true,
			nextStatement: true,
			previousStatement: true,
		},
    id: "pre_made_statement_repeat",
		name: "Repeat",
		type: "preMade",
	},
	{
		category: "",
		color: "#0089b8",
		config: {
			canHaveChildren: true,
			conditionInput: true,
			inputsInline: true,
			nextStatement: true,
			previousStatement: true,
		},
    id: "pre_made_statement_when",
		name: "When",
		type: "preMade",
	}
];
