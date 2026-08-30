import { Bond } from "../types/chemistry";
import * as AA from "@gjmcn/atomic-agents";

/**
 * Renders bonds between atoms as lines using PIXI.Graphics.
 * Created once during vis setup; render() called every tick in afterTick.
 */
export class BondRenderer {
  private graphics: any; // PIXI.Graphics

  constructor(app: any /* PIXI.Application */, PIXI: any) {
    this.graphics = new PIXI.Graphics();
    // Insert at index 0 so bonds render behind atom sprites
    app.stage.addChildAt(this.graphics, 0);
  }

  /**
   * Redraw all bond lines for the current tick.
   */
  render(bonds: Bond[], atomMap: Map<number, AA.Actor>) {
    this.graphics.clear();

    for (const bond of bonds) {
      const a1 = atomMap.get(bond.atom1Id);
      const a2 = atomMap.get(bond.atom2Id);
      if (!a1 || !a2) continue;

      this.drawBondLines(a1.x, a1.y, a2.x, a2.y, bond.type);
    }
  }

  /**
   * Draw bond lines between two points.
   * Single bond = 1 line, double = 2 parallel, triple = 3.
   */
  private drawBondLines(x1: number, y1: number, x2: number, y2: number, type: 1 | 2 | 3) {
    const lineWidth = 1.5;
    const lineColor = 0x888888;
    const lineAlpha = 0.9;
    const spacing = 2; // pixel spacing between parallel lines

    if (type === 1) {
      this.graphics.lineStyle(lineWidth, lineColor, lineAlpha);
      this.graphics.moveTo(x1, y1);
      this.graphics.lineTo(x2, y2);
    } else {
      // Calculate perpendicular offset for parallel lines
      const dx = x2 - x1;
      const dy = y2 - y1;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len < 0.001) return;
      const nx = -dy / len; // unit normal
      const ny = dx / len;

      const offsets = type === 2
        ? [-spacing / 2, spacing / 2]
        : [-spacing, 0, spacing];

      for (const offset of offsets) {
        this.graphics.lineStyle(lineWidth, lineColor, lineAlpha);
        this.graphics.moveTo(x1 + nx * offset, y1 + ny * offset);
        this.graphics.lineTo(x2 + nx * offset, y2 + ny * offset);
      }
    }
  }

  destroy() {
    this.graphics?.destroy();
  }
}
