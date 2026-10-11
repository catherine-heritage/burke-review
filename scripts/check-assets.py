"""Run with Python 3; no third-party packages required."""
from pathlib import Path
from collections import Counter
import hashlib,json,xml.etree.ElementTree as ET
ROOT=Path(__file__).resolve().parents[1]
photos=json.loads((ROOT/'assets/mockups/source-map.json').read_text(encoding='utf-8'))
assert len(photos)==40
assert len({p['path'] for p in photos})==40
for item in photos:
    assert hashlib.sha256((ROOT/item['path']).read_bytes()).hexdigest()==item['sha256'],item['path']
def shapes(p):
    return [(e.tag.split('}')[-1],tuple(sorted(e.attrib.items()))) for e in ET.parse(p).getroot().iter() if e.tag.split('}')[-1] in ['path','rect','polygon','circle','ellipse']]
count=0
for logo in [1,2,3]:
    for palette in ['black','gold','blue','green']:
        source=ROOT/f'assets/logos/source/All 3 Logo Options_Logo {logo} {palette.title()}.svg'
        original=Counter(shapes(source))
        extracted=Counter()
        applications=list((ROOT/f'assets/logos/{palette}/{logo}').glob('*.svg'))
        assert len(applications)==(4 if palette=='black' else 5)
        for asset in applications:extracted.update(shapes(asset));count+=1
        assert not (extracted-original),f'Altered or invented geometry in {logo}/{palette}'
        if palette!='black':assert extracted==original,f'Missing geometry in {logo}/{palette}'
assert count==57
print('PASS: 40 unchanged PNGs, complete 36-image mapping, 57 SVGs with original geometry and fills.')
