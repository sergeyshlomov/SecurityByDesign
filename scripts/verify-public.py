"""Download public files with normal TLS verification and compare to tested dist/."""
from pathlib import Path
from urllib.request import Request, urlopen
from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
import sys

root = Path(__file__).resolve().parent.parent
base = 'https://sergeyshlomov.github.io/SecurityByDesign/'
destination = root / '.local' / 'public-files' / 'SecurityByDesign'
files = [p for p in (root / 'dist').rglob('*') if p.is_file() and p.name != '.nojekyll']

def check(path):
    relative = path.relative_to(root / 'dist').as_posix()
    with urlopen(Request(base + relative, headers={'Cache-Control':'no-cache'}), timeout=30) as response:
        data = response.read()
        status = response.status
    digest = hashlib.sha256(data).hexdigest()
    expected = hashlib.sha256(path.read_bytes()).hexdigest()
    target = destination / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(data)
    return {'file':relative,'status':status,'sha256':digest,'matches':digest == expected}

with ThreadPoolExecutor(max_workers=6) as pool:
    results = list(pool.map(check, files))
(root / '.local' / 'public-verification.json').write_text(json.dumps(results, indent=2))
failed = [r for r in results if r['status'] != 200 or not r['matches']]
print(json.dumps({'public_files':len(results),'matching':len(results)-len(failed),'failed':failed}))
sys.exit(bool(failed))
