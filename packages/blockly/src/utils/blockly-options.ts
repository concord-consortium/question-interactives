/**
 * Blockly 13 changed the default renderer from `geras` to `thrasos`. Thrasos drops the
 * bevel that geras draws on each block (the `blocklyPathLight`/`blocklyPathDark` paths),
 * so leaving the default in place would restyle every student's blocks as a side effect
 * of an accessibility upgrade. We pin geras to keep the appearance unchanged.
 *
 * Shared by every `inject()` site that renders for a user — the runtime, both authoring
 * workspaces, and the report item — so they cannot drift apart. (A test injects a bare
 * workspace directly; the renderer does not matter there.)
 */
export const BLOCKLY_RENDERER = "geras";
