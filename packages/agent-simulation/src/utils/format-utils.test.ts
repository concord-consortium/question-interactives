
import { formatValue } from "./format-utils";

describe("formatValue", () => {
	it("formats as integer by default", () => {
		expect(formatValue(51.6)).toBe("52");
	});

	it("formats as decimal with precision", () => {
		expect(formatValue(1.234, "decimal", 3)).toBe("1.234");
    expect(formatValue(1.234, "decimal", 2)).toBe("1.23");
	});

  it("formats as decimal with precision but not beyond 5 decimal places", () => {
		expect(formatValue(1.23456789, "decimal", 10)).toBe("1.23457");
	});

	it("formats as percent", () => {
		expect(formatValue(0.1234, "percent", 2)).toBe("12.34");
		expect(formatValue(0.5, "percent")).toBe("50");
	});


});
