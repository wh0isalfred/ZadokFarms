import { describe, expect, it } from "vitest";
import { callingCountries, canonicalPhone, restorePhone, restorePhoneDraft } from "../src/lib/phone-input";

describe("calling-code metadata and input normalisation", () => {
  it("contains every geographic region from the pinned source, without duplicate IDs", () => {
    expect(callingCountries).toHaveLength(245);
    expect(new Set(callingCountries.map((country) => country.id)).size).toBe(245);
    for (const country of callingCountries) {
      expect(country.callingCode).toMatch(/^[1-9]\d{0,2}$/);
      expect(country.name.length).toBeGreaterThan(1);
      expect(() => new RegExp(country.prefix)).not.toThrow();
    }
  });

  it.each([
    ["NG", "0801 234 5678", "+2348012345678"],
    ["NG", "8012345678", "+2348012345678"],
    ["GB", "07911 123456", "+447911123456"],
    ["US", "(202) 555-0123", "+12025550123"],
    ["US", "1 202 555 0123", "+12025550123"],
    ["IT", "02 36618 300", "+390236618300"],
    ["RU", "8 912 345 6789", "+79123456789"],
    ["AR", "011 15 2345 6789", "+5491123456789"],
    ["BR", "0 21 11 91234 5678", "+5511912345678"],
    ["NG", "letters", ""],
    ["NG", "", ""],
    ["NG", "1234567890123456", ""],
  ])("normalises %s %s without losing significant digits", (country, national, expected) => {
    expect(canonicalPhone({ country, national })).toBe(expected);
  });

  it("restores known full numbers and preserves unrecognised legacy codes", () => {
    expect(restorePhone("+2348012345678")).toEqual({ country: "NG", national: "8012345678" });
    expect(restorePhone("+44 (7911) 123456")).toEqual({ country: "GB", national: "7911123456" });
    expect(restorePhone("+12425550123")).toEqual({ country: "BS", national: "2425550123" });
    expect(restorePhone("+9991234567")).toEqual({ country: "", national: "+9991234567" });
  });

  it("retains empty-country selections and rejects stale draft projections", () => {
    expect(restorePhoneDraft("", { country: "GB", national: "" })).toEqual({ country: "GB", national: "" });
    expect(restorePhoneDraft("+2348012345678", { country: "GB", national: "7911123456" })).toEqual({ country: "NG", national: "8012345678" });
  });
});
