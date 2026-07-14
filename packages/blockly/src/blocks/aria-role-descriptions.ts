/** The role description a screen reader speaks after a block's own label ("repeat 3, control
 *  block"). Blockly's default for our blocks is the structural "statement" or "value", which tells
 *  a student nothing about what the block *does*. These names match the block types authors already
 *  work in and the toolbox categories students already see.
 *
 *  Every block in this package draws its role description from here -- the authored blocks in
 *  block-factory, the built-ins, and the `setup`/`go`/`onclick` seed blocks -- so that the
 *  vocabulary a screen reader speaks is one vocabulary, and rewording or localizing it is one edit
 *  rather than a hunt through three files. */
export const ARIA_ROLE_DESCRIPTIONS = {
  action: "action block",
  ask: "ask block",
  condition: "condition block",
  control: "control block",
  creator: "creator block",
  globalValue: "global value block",
  programSection: "program section",
  setter: "setter block",
  value: "value block"
} as const;

/** The keys above deliberately double as `ICustomBlock["type"]` for every authored type that has a
 *  role description, so an authored block can look its own up.
 *
 *  Deriving it from the block's type, rather than adding a per-block authoring field, is deliberate:
 *  an authored field would mean a schema change, new authoring UI, and every block that already
 *  exists shipping blank until someone went back and filled it in. Types with no entry here (the
 *  `builtIn` passthrough) simply get none. */
export const ariaRoleDescriptionForType = (type: string): string | undefined =>
  ARIA_ROLE_DESCRIPTIONS[type as keyof typeof ARIA_ROLE_DESCRIPTIONS];
