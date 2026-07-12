/**
 * Blockly 13 changed the default renderer from `geras` to `thrasos`. Thrasos drops the
 * bevel that geras draws on each block (the `blocklyPathLight`/`blocklyPathDark` paths),
 * so leaving the default in place would restyle every student's blocks as a side effect
 * of an accessibility upgrade. We pin geras to keep the appearance unchanged.
 *
 * This is shared by all four `inject()` sites so they cannot drift apart.
 */
export const BLOCKLY_RENDERER = "geras";
