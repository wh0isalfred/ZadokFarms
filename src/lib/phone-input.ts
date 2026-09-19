import metadata from "@/data/calling-codes.json";

export const callingCountries = metadata.regions;
export type PhoneInput = { country: string; national: string };
export const emptyPhone: PhoneInput = { country: "NG", national: "" };
const compact = (value: string) => value.trim().replace(/[\s().-]/g, "");

/** Display projection only: callers keep the original saved attempt authoritative. */
export function restorePhone(phone: string, preferredCountry?: string): PhoneInput {
  const value = compact(phone);
  if (!value.startsWith("+")) return { country: "NG", national: phone };
  const candidates = callingCountries.filter((country) => value.startsWith(`+${country.callingCode}`));
  const country = candidates.find((candidate) => candidate.id === preferredCountry)
    ?? candidates.find((candidate) => candidate.leadingDigits && new RegExp(`^(?:${candidate.leadingDigits})`).test(value.slice(candidate.callingCode.length + 1)))
    ?? candidates.find((candidate) => candidate.main)
    ?? candidates[0];
  // Unknown/legacy codes remain visible and intact rather than becoming Nigerian numbers.
  return country ? { country: country.id, national: value.slice(country.callingCode.length + 1) }
    : { country: "", national: phone };
}

export function canonicalPhone(input: PhoneInput): string {
  const value = compact(input.national);
  if (!value) return "";
  if (value.startsWith("+")) return /^\+[1-9]\d{6,14}$/.test(value) ? value : "";
  if (!/^\d+$/.test(value)) return "";
  const country = callingCountries.find((candidate) => candidate.id === input.country);
  if (!country) return "";
  let national = value;
  if (country.prefix) {
    const prefix = new RegExp(`^(?:${country.prefix})`);
    const match = national.match(prefix);
    if (match) {
      const replacement = country.transform && match[match.length - 1] ? country.transform : "";
      const candidate = national.replace(prefix, replacement);
      // Strip/transform only a recognised national prefix; retain significant zeroes (e.g. Italy).
      if (new RegExp(`^(?:${country.nationalPattern})$`).test(candidate)) national = candidate;
    }
  }
  const result = `+${country.callingCode}${national}`;
  return /^\+[1-9]\d{6,14}$/.test(result) ? result : "";
}

export function restorePhoneDraft(phone: string, saved: unknown): PhoneInput {
  if (saved && typeof saved === "object" && "country" in saved && "national" in saved &&
      typeof saved.country === "string" && typeof saved.national === "string" && saved.national.length <= 30 &&
      (saved.country === "" || callingCountries.some((country) => country.id === saved.country))) {
    const input = { country: saved.country, national: saved.national };
    if (canonicalPhone(input) === phone) return input;
  }
  return restorePhone(phone);
}
