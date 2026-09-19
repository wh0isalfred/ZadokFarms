"""Refresh the dependency-free calling-code snapshot from a reviewed upstream commit.

Usage: python scripts/update-calling-codes.py <40-character libphonenumber commit>
Uses only Python's standard library. Review the generated diff and run phone tests.
"""
import json
from pathlib import Path
import re
import sys
from urllib.request import urlopen
import xml.etree.ElementTree as ET

commit = sys.argv[1]
if not re.fullmatch(r"[0-9a-f]{40}", commit):
    raise SystemExit("Supply a full reviewed google/libphonenumber commit SHA")
base = f"https://raw.githubusercontent.com/google/libphonenumber/{commit}"
xml = urlopen(f"{base}/resources/PhoneNumberMetadata.xml").read().decode()
names = {code: name for name, code in re.findall(r"<!-- ([^<>\n]+) \(([A-Z]{2})\) -->", xml)}
regions = []
for territory in ET.fromstring(xml).find("territories"):
    code = territory.get("id")
    if code == "001":  # Global services are not country/territory calling codes.
        continue
    compact = lambda value: re.sub(r"\s+", "", value or "")
    regions.append({
        "id": code, "name": names[code], "callingCode": territory.get("countryCode"),
        "prefix": compact(territory.get("nationalPrefixForParsing", territory.get("nationalPrefix"))),
        "transform": territory.get("nationalPrefixTransformRule", ""),
        "nationalPattern": compact(territory.findtext("generalDesc/nationalNumberPattern")),
        "leadingDigits": compact(territory.get("leadingDigits")),
        "main": territory.get("mainCountryForCode") == "true",
    })
regions.sort(key=lambda region: region["name"])
root = Path(__file__).resolve().parents[1]
(root / "src/data/calling-codes.json").write_text(json.dumps({
    "source": f"{base}/resources/PhoneNumberMetadata.xml",
    "regions": regions,
}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
license_dir = root / "docs/licenses"
license_dir.mkdir(exist_ok=True)
(license_dir / "libphonenumber.txt").write_bytes(urlopen(f"{base}/LICENSE").read())
print(f"Generated {len(regions)} country/territory entries from {commit}")
