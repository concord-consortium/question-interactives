import { AtomState, ElementDef, MoleculeTemplate } from "../types/chemistry";

/**
 * Element definitions. Index in this array is the element's ID.
 */
export const ELEMENTS: ElementDef[] = [
  { symbol: "H",  name: "Hydrogen", mass: 1,  radius: 6,   valenceElectrons: 1, color: 0xEEEEEE },
  { symbol: "O",  name: "Oxygen",   mass: 16, radius: 10,  valenceElectrons: 6, color: 0xFF4444 },
  { symbol: "Cl", name: "Chlorine", mass: 35, radius: 12,  valenceElectrons: 7, color: 0x44FF44 },
  { symbol: "C",  name: "Carbon",   mass: 12, radius: 9,   valenceElectrons: 4, color: 0x666666 },
];

// Element index constants for readability
export const EL_H = 0;
export const EL_O = 1;
export const EL_CL = 2;
export const EL_C = 3;

/**
 * Bond length ratio: bond length = ratio * (radius_i + radius_j).
 * From lab's chemical-reactions.js BOND_LEN_RATIO.
 */
export const BOND_LEN_RATIO = 0.6;

/**
 * Bond energies for element pairs, keyed by sorted pair "i-j" and bond type.
 * Values are in arbitrary energy units matching the simplified KE model.
 * Higher = harder to break.
 */
const BOND_ENERGY_TABLE: Record<string, Record<1 | 2 | 3, number>> = {
  "0-0": { 1: 4.5,  2: 0,    3: 0 },    // H-H (single only)
  "0-1": { 1: 4.8,  2: 0,    3: 0 },    // H-O
  "0-2": { 1: 4.3,  2: 0,    3: 0 },    // H-Cl
  "0-3": { 1: 4.1,  2: 0,    3: 0 },    // H-C
  "1-1": { 1: 1.5,  2: 5.2,  3: 0 },    // O-O (single or double)
  "1-2": { 1: 2.1,  2: 0,    3: 0 },    // O-Cl
  "1-3": { 1: 3.6,  2: 7.8,  3: 0 },    // O-C
  "2-2": { 1: 2.5,  2: 0,    3: 0 },    // Cl-Cl
  "2-3": { 1: 3.4,  2: 0,    3: 0 },    // Cl-C
  "3-3": { 1: 3.5,  2: 6.3,  3: 8.7 },  // C-C (single, double, triple)
};

/**
 * Activation energies for bond exchange, keyed the same way.
 * Collision KE must exceed this to initiate an exchange.
 */
const ACTIVATION_ENERGY_TABLE: Record<string, number> = {
  "0-0": 1.0, "0-1": 1.2, "0-2": 0.8, "0-3": 1.0,
  "1-1": 1.5, "1-2": 1.3, "1-3": 1.4,
  "2-2": 1.1, "2-3": 1.2,
  "3-3": 1.6,
};

function pairKey(el1: number, el2: number): string {
  return el1 <= el2 ? `${el1}-${el2}` : `${el2}-${el1}`;
}

/** Get bond energy for a given element pair and bond type. */
export function getBondEnergy(el1: number, el2: number, type: 1 | 2 | 3): number {
  const entry = BOND_ENERGY_TABLE[pairKey(el1, el2)];
  return entry?.[type] ?? 0;
}

/** Get activation energy for bond exchange involving this element pair. */
export function getActivationEnergy(el1: number, el2: number): number {
  return ACTIVATION_ENERGY_TABLE[pairKey(el1, el2)] ?? 1.0;
}

/** Calculate equilibrium bond length between two elements. */
export function getBondLength(el1: number, el2: number): number {
  return BOND_LEN_RATIO * (ELEMENTS[el1].radius + ELEMENTS[el2].radius);
}

/** Spring strength for bonds. Higher = stiffer bonds, more strain from stretching. */
export const BOND_STRENGTH = 8.0;

/**
 * Maximum number of bonds an element can form (octet rule).
 * Elements with valence ≤ 4 can share up to valence electrons.
 * Elements with valence > 4 can share up to (8 - valence) electrons.
 * H is a special case: max 1 bond.
 */
export function maxBonds(elementIndex: number): number {
  const el = ELEMENTS[elementIndex];
  if (el.valenceElectrons <= 4) return el.valenceElectrons;
  return 8 - el.valenceElectrons;
}

/**
 * Whether an atom is a radical (has unpaired electrons available for bonding).
 */
export function isRadical(state: AtomState): boolean {
  return state.sharedElectrons < maxBonds(state.elementIndex);
}

/** Number of unpaired electrons available for bonding. */
export function getUnpairedElectrons(state: AtomState): number {
  return Math.max(0, maxBonds(state.elementIndex) - state.sharedElectrons);
}

/**
 * CH₄ molecule template: one carbon bonded to four hydrogens.
 * Offsets place H atoms in a square around the C center.
 */
export const CH4_TEMPLATE: MoleculeTemplate = {
  name: "CH4",
  atoms: [
    { elementIndex: EL_C, offsetX: 0, offsetY: 0 },
    { elementIndex: EL_H, offsetX: -10, offsetY: -10 },
    { elementIndex: EL_H, offsetX: 10,  offsetY: -10 },
    { elementIndex: EL_H, offsetX: 10,  offsetY: 10 },
    { elementIndex: EL_H, offsetX: -10, offsetY: 10 },
  ],
  bonds: [
    { from: 0, to: 1, type: 1 },
    { from: 0, to: 2, type: 1 },
    { from: 0, to: 3, type: 1 },
    { from: 0, to: 4, type: 1 },
  ],
};

/**
 * Create an SVG data URI for an atom of the given element.
 * Renders as a colored circle with the element symbol.
 */
export function atomSvgDataUri(elementIndex: number): string {
  const el = ELEMENTS[elementIndex];
  const r = el.radius * 2; // SVG radius in pixels
  const size = r * 2 + 4;
  const cx = size / 2;
  const cy = size / 2;
  const hex = `#${el.color.toString(16).padStart(6, "0")}`;
  const textColor = elementIndex === EL_C ? "#ffffff" : "#000000";
  const fontSize = Math.max(8, r);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${hex}" stroke="#333" stroke-width="0.5"/>
    <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central"
          font-family="Arial,sans-serif" font-size="${fontSize}" font-weight="bold"
          fill="${textColor}">${el.symbol}</text>
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
