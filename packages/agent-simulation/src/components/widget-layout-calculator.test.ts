import { computeLayoutForAllWidgets, sizeToRowSpan } from "./widget-layout-calculator";
import { WidgetSize } from "../types/widgets";

describe("widget-layout-calculator", () => {
  describe("sizeToRowSpan", () => {
    it("should map widget sizes to correct row spans", () => {
      expect(sizeToRowSpan["short"]).toBe(1);
      expect(sizeToRowSpan["tall"]).toBe(2);
      expect(sizeToRowSpan["very-tall"]).toBe(3);
    });
  });

  describe("computeLayoutForAllWidgets", () => {
    describe("basic cases", () => {
      it("should return empty array for empty input", () => {
        const result = computeLayoutForAllWidgets([]);
        expect(result).toEqual([]);
      });

      it("should handle single short widget", () => {
        const result = computeLayoutForAllWidgets(["short"]);
        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
          col: 0,
          gridRowEnd: 1,
          gridRowStart: 0,
          size: "short",
          spansFullWidth: true
        });
      });

      it("should handle single tall widget", () => {
        const result = computeLayoutForAllWidgets(["tall"]);
        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
          col: 0,
          gridRowEnd: 2,
          gridRowStart: 0,
          size: "tall",
          spansFullWidth: true
        });
      });

      it("should handle single very-tall widget", () => {
        const result = computeLayoutForAllWidgets(["very-tall"]);
        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({
          col: 0,
          gridRowEnd: 3,
          gridRowStart: 0,
          size: "very-tall",
          spansFullWidth: true
        });
      });
    });

    describe("two-column layout", () => {
      it("should place two short widgets side by side", () => {
        const result = computeLayoutForAllWidgets(["short", "short"]);
        
        expect(result[0]).toMatchObject({
          col: 0,
          gridRowEnd: 1,
          gridRowStart: 0,
          size: "short",
          spansFullWidth: false
        });
        
        expect(result[1]).toMatchObject({
          col: 1,
          gridRowEnd: 1,
          gridRowStart: 0,
          size: "short",
          spansFullWidth: false
        });
      });

      it("should place two tall widgets side by side", () => {
        const result = computeLayoutForAllWidgets(["tall", "tall"]);
        
        expect(result[0]).toMatchObject({
          col: 0,
          gridRowEnd: 2,
          gridRowStart: 0,
          size: "tall",
        });
        
        expect(result[1]).toMatchObject({
          col: 1,
          gridRowEnd: 2,
          gridRowStart: 0,
          size: "tall",
        });
      });
    });

    describe("dense packing", () => {
      it("should pack two short widgets next to one tall widget", () => {
        const result = computeLayoutForAllWidgets(["tall", "short", "short"]);
        
        // Tall in column 0, rows 0-2
        expect(result[0]).toMatchObject({
          col: 0,
          gridRowEnd: 2,
          gridRowStart: 0,
          size: "tall",
        });
        
        // First short in column 1, row 0-1
        expect(result[1]).toMatchObject({
          col: 1,
          gridRowEnd: 1,
          gridRowStart: 0,
          size: "short",
        });
        
        // Second short in column 1, row 1-2
        expect(result[2]).toMatchObject({
          col: 1,
          gridRowEnd: 2,
          gridRowStart: 1,
          size: "short",
        });
      });

      it("should place third widget below when both columns occupied", () => {
        const result = computeLayoutForAllWidgets(["tall", "tall", "short"]);
        
        // Third widget goes in shorter column (both at 2)
        expect(result[2]).toMatchObject({
          col: 0,
          gridRowEnd: 3,
          gridRowStart: 2,
          size: "short",
          spansFullWidth: true
        });
      });
    });

    describe("full width detection", () => {
      it("should mark widget as full width when alone in its row", () => {
        const result = computeLayoutForAllWidgets(["tall", "tall", "short"]);
        
        // Third widget is alone in row 2
        expect(result[2].spansFullWidth).toBe(true);
      });

      it("should not mark widget as full width when sharing row", () => {
        const result = computeLayoutForAllWidgets(["short", "short"]);
        
        expect(result[0].spansFullWidth).toBe(false);
        expect(result[1].spansFullWidth).toBe(false);
      });

      it("should handle very-tall widget spanning both columns", () => {
        const result = computeLayoutForAllWidgets(["short", "very-tall", "short"]);
        
        // First short in column 0
        expect(result[0]).toMatchObject({
          col: 0,
          gridRowEnd: 1,
          gridRowStart: 0,
        });
        
        // Very-tall forces to row 1, spans both columns
        expect(result[1]).toMatchObject({
          col: 0,
          gridRowEnd: 4,
          gridRowStart: 1,
          size: "very-tall",
        });
        
        // Third widget goes after very-tall
        expect(result[2]).toMatchObject({
          col: 0,
          gridRowEnd: 5,
          gridRowStart: 4,
        });
      });
    });

    describe("spanToMatchTall flag", () => {
      it("should mark short widget to match tall when exactly one short next to tall", () => {
        const result = computeLayoutForAllWidgets(["tall", "short"]);

        expect(result[1].spanToMatchTall).toBe(true);
      });

      it("should not mark short to match tall when multiple shorts beside tall", () => {
        const result = computeLayoutForAllWidgets(["tall", "short", "short"]);

        expect(result[1].spanToMatchTall).toBeUndefined();
        expect(result[2].spanToMatchTall).toBeUndefined();
      });
    });


    describe("complex layouts", () => {
      it("should handle mixed widget sizes with proper packing", () => {
        const sizes: WidgetSize[] = ["tall", "short", "short", "very-tall", "short"];
        const result = computeLayoutForAllWidgets(sizes);
        
        expect(result).toHaveLength(5);
        
        // Verify very-tall spans both columns
        expect(result[3].size).toBe("very-tall");
        expect(result[3].col).toBe(0);
        
        // Verify widgets are placed in valid positions
        result.forEach((layout, i) => {
          expect(layout.gridRowStart).toBeGreaterThanOrEqual(0);
          expect(layout.gridRowEnd).toBeGreaterThan(layout.gridRowStart);
          expect([0, 1]).toContain(layout.col);
        });
      });

      it("should maintain column order for widgets in same band", () => {
        const result = computeLayoutForAllWidgets(["short", "short", "short"]);
        
        // First two should be side by side
        expect(result[0]).toMatchObject({
          col: 0,
          gridRowStart: 0,
        });
        expect(result[1]).toMatchObject({
          col: 1,
          gridRowStart: 0,
        });
        
        // Third should go in next available slot (column 0, row 1)
        expect(result[2]).toMatchObject({
          col: 0,
          gridRowStart: 1,
        });
      });
    });
  });
});

