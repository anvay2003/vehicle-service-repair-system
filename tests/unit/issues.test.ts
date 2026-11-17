import { describe, it, expect } from "vitest";
import { ISSUES, DIAGNOSES, OTHER, buildDescription, buildDiagnosis } from "../../lib/issues";

describe("issue and diagnosis option lists", () => {
  it("offers at least 8 customer issues plus Other", () => {
    expect(ISSUES.length).toBeGreaterThanOrEqual(8);
    expect(OTHER).toBe("Other");
  });
  it("has no duplicate options", () => {
    expect(new Set(ISSUES).size).toBe(ISSUES.length);
    expect(new Set(DIAGNOSES).size).toBe(DIAGNOSES.length);
  });
});

describe("buildDescription", () => {
  it("joins issues and notes", () => {
    expect(buildDescription(["A", "B"], "x")).toBe("Issues: A; B. Notes: x");
  });
  it("omits empty notes", () => {
    expect(buildDescription(["A"], "   ")).toBe("Issues: A.");
  });
  it("supports notes only", () => {
    expect(buildDescription([], "only notes")).toBe("Notes: only notes");
  });
  it("returns an empty string when nothing is provided", () => {
    expect(buildDescription([], "")).toBe("");
  });
  it("trims notes", () => {
    expect(buildDescription(["A"], "  hi  ")).toBe("Issues: A. Notes: hi");
  });
});

describe("buildDiagnosis", () => {
  it("joins findings and notes", () => {
    expect(buildDiagnosis(["A", "B"], "x")).toBe("Findings: A; B. Notes: x");
  });
  it("omits empty notes", () => {
    expect(buildDiagnosis(["A"], "")).toBe("Findings: A.");
  });
  it("returns an empty string when nothing is provided", () => {
    expect(buildDiagnosis([], "  ")).toBe("");
  });
});
