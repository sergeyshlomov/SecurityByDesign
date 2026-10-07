"""Compare rendered pixels, not just computed CSS values."""
from pathlib import Path
import sys
from PIL import Image, ImageChops

device = sys.argv[1]
for part in ('lcd', 'monitor'):
    before = Image.open(Path('.local') / f'{device}-{part}-before.png').convert('RGB')
    after = Image.open(Path('.local') / f'{device}-{part}-after.png').convert('RGB')
    assert before.size == after.size
    diff = ImageChops.difference(before, after)
    changed = sum(max(pixel) > 8 for pixel in diff.get_flattened_data()) / (diff.width * diff.height)
    assert changed > .015, f'{device}/{part}: only {changed:.1%} pixels visibly changed'
    print(f'PASS {device}/{part}: {changed:.1%} rendered pixels changed in one second')
