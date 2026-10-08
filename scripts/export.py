"""Export the current Vite build as a deployable ZIP and a self-contained HTML."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import base64
import json
import mimetypes
import re

project = Path(__file__).resolve().parent.parent
dist = project / 'dist'
output = project / '.local'
output.mkdir(exist_ok=True)
html = (dist / 'index.html').read_text()

def data_uri(path):
    mime = mimetypes.guess_type(path.name)[0] or 'application/octet-stream'
    return 'data:' + mime + ';base64,' + base64.b64encode(path.read_bytes()).decode()

script = re.search(r'<script[^>]+src="([^"]+)"[^>]*></script>', html)
stylesheet = re.search(r'<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"[^>]*>', html)
js = (dist / script.group(1).lstrip('/')).read_text()
css_path = dist / stylesheet.group(1).lstrip('/')

def inline_font(match):
    url = match.group(1).strip('\"\'')
    if url.startswith('data:'):
        return match.group(0)
    path = dist / url.lstrip('/') if url.startswith('/') else css_path.parent / url
    return 'url(' + data_uri(path) + ')'

css = re.sub(r'url\(([^)]+)\)', inline_font, css_path.read_text())
for image in ['operations-room.webp', 'security-lab.webp', 'attack-equipment.png']:
    relative = './' + image
    assert relative in js, f'Missing bundled image reference: {relative}'
    js = js.replace(relative, data_uri(dist / image))

for image in sorted((dist / 'logos').iterdir()):
    if image.suffix not in {'.svg', '.png', '.jpg'}:
        continue
    relative = 'logos/' + image.name
    assert relative in js, f'Missing bundled logo reference: {relative}'
    js = js.replace(relative, data_uri(image))

# Keep the attribution page reachable when the standalone HTML is used offline.
credits_reference = '"./logos/credits.html"'
assert credits_reference in js, 'Missing bundled image-credits link'
credits = json.dumps((dist / 'logos/credits.html').read_text())
js = js.replace(credits_reference, 'URL.createObjectURL(new Blob([' + credits + '],{type:"text/html"}))')

html = html.replace(script.group(0), '<script type="module">' + js.replace('</script', '<\\/script') + '</script>')
html = html.replace(stylesheet.group(0), '<style>' + css + '</style>')
html = html.replace('./favicon.svg', data_uri(dist / 'favicon.svg'))
(output / 'Sergey-Shlomov.html').write_text(html)

with ZipFile(output / 'sergey-shlomov-site.zip', 'w', ZIP_DEFLATED) as archive:
    for file in sorted(dist.rglob('*')):
        if file.is_file():
            archive.write(file, file.relative_to(dist))

print('Exported .local/Sergey-Shlomov.html and .local/sergey-shlomov-site.zip')
