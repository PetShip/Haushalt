"""Static packaging checks. Does not replace signed-device or iCloud tests."""
from pathlib import Path
import plistlib
import re
import xml.etree.ElementTree as ET
import json
import struct

root = Path(__file__).resolve().parents[1]
app = root / "Household"
for path in app.rglob("*"):
    if not path.is_file():
        continue
    if path.suffix == '.png':
        continue
    text = path.read_text(encoding="utf-8")
    assert not re.search(r"(?i)(prisma|DATABASE_URL|ADMIN_PIN|vercel\.app|paul|rosalie|mavi|anna-sophia)", text), f"Private web-app reference in {path.name}"
    assert not re.search(r"(?i)(postgres(?:ql)?://|BEGIN PRIVATE KEY|sk_live_)", text), f"Credential pattern in {path.name}"
for path in [app / "Info.plist", app / "PrivacyInfo.xcprivacy", app / "Household.entitlements"]:
    with path.open("rb") as file:
        plistlib.load(file)
ET.parse(root / "Household.xcodeproj/xcshareddata/xcschemes/Household.xcscheme")
project = (root / "Household.xcodeproj/project.pbxproj").read_text(encoding="utf-8")
for source in app.glob("*.swift"):
    assert source.name in project, f"Missing Xcode source: {source.name}"
assert 'publicCloudDatabase' not in (app / 'CloudHouseholdService.swift').read_text().replace('// publicCloudDatabase', '')
icon_dir = app / 'Assets.xcassets/AppIcon.appiconset'
catalog = json.loads((icon_dir / 'Contents.json').read_text())
icon = (icon_dir / catalog['images'][0]['filename']).read_bytes()
assert icon[:8] == b'\x89PNG\r\n\x1a\n'
assert struct.unpack('>II', icon[16:24]) == (1024, 1024)
assert icon[25] == 2, 'App icon must be opaque RGB'
print("Public app boundary, plists, scheme and source references checked")
