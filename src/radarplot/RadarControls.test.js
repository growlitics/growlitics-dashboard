import { generateColorMap, COLOR_PALETTE } from "./RadarControls";

describe("generateColorMap", () => {
  it("assigns gold to optimized and sorts others alphabetically", () => {
    const map = generateColorMap(["B", "Optimized", "A"]);
    expect(map.Optimized).toBe(COLOR_PALETTE[0]);
    expect(map.A).toBe(COLOR_PALETTE[1]);
    expect(map.B).toBe(COLOR_PALETTE[2]);
  });

  it("returns consistent colors regardless of input order", () => {
    const first = generateColorMap(["Alpha", "Beta", "Gamma"]);
    const second = generateColorMap(["Gamma", "Alpha", "Beta"]);
    expect(first).toEqual(second);
  });
});
