/**
 * Chemistry types for the bonding simulation.
 */

export interface ElementDef {
  symbol: string;            // "H", "O", "Cl", "C"
  name: string;              // "Hydrogen", "Oxygen", etc.
  mass: number;              // relative atomic mass (Da)
  radius: number;            // display/collision radius in sim units
  valenceElectrons: number;  // number of valence electrons
  color: number;             // hex tint for rendering (0xRRGGBB)
}

/**
 * Per-atom state stored on each AA.Actor's `state` property.
 */
export interface AtomState {
  elementIndex: number;      // index into ELEMENTS array
  sharedElectrons: number;   // electrons currently committed to bonds
  bondIds: number[];         // IDs of bonds this atom participates in
}

/**
 * A radial bond between two atoms.
 */
export interface Bond {
  id: number;
  atom1Id: number;           // AA.Actor id
  atom2Id: number;           // AA.Actor id
  type: 1 | 2 | 3;          // single, double, triple
  length: number;            // equilibrium bond length (sim units)
  strength: number;          // spring constant for strain calculation
  chemicalEnergy: number;    // energy stored in this bond (arbitrary units)
}

/**
 * Configuration for initial molecule templates (e.g., CH₄ fuel).
 */
export interface MoleculeTemplate {
  name: string;              // "CH4", "H2O", etc.
  /** Central atom element index, plus satellite atoms with relative offsets. */
  atoms: Array<{
    elementIndex: number;
    offsetX: number;         // relative to molecule center
    offsetY: number;
  }>;
  /** Bonds within the template (indices into the atoms array). */
  bonds: Array<{
    from: number;
    to: number;
    type: 1 | 2 | 3;
  }>;
}
