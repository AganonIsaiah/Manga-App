"""Rebuild the local city suggestion index from GeoNames' CC BY 4.0 export."""
import io
import json
from pathlib import Path
from urllib.request import urlopen
from zipfile import ZipFile

URL = 'https://download.geonames.org/export/dump/cities15000.zip'
with urlopen(URL, timeout=60) as response:
    archive = ZipFile(io.BytesIO(response.read()))
rows = {}
for line in archive.read('cities15000.txt').decode('utf-8').splitlines():
    fields = line.split('\t')
    country, name, population = fields[8], fields[1], int(fields[14] or 0)
    if country and len(name) <= 100:
        cities = rows.setdefault(country, {})
        cities[name] = max(cities.get(name, 0), population)
result = {country: sorted(cities, key=lambda name: (-cities[name], name))
          for country, cities in sorted(rows.items())}
output = Path(__file__).resolve().parents[1] / 'public/locations/cities.json'
output.write_text(json.dumps(result, ensure_ascii=False, separators=(',', ':'))+'\n')
print(f'Wrote {sum(map(len, result.values()))} city suggestions across {len(result)} countries.')
