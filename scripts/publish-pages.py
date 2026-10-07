"""Upload dist/ to the origin gh-pages branch without replacing source files."""
from pathlib import Path
import os
import subprocess
import tempfile

root = Path(__file__).resolve().parent.parent
dist = root / 'dist'
assert (dist / 'index.html').is_file(), 'Run npm run build first.'
assert not any(p.is_symlink() for p in dist.rglob('*')), 'Refusing to publish symlinked files.'

def git(*args, env=None):
    return subprocess.check_output(['git', *args], cwd=root, env=env, text=True).strip()

heads = git('ls-remote', '--heads', 'origin', 'refs/heads/gh-pages')
parent = None
if heads:
    git('fetch', '--no-tags', 'origin', 'refs/heads/gh-pages')
    parent = git('rev-parse', 'FETCH_HEAD')

local = root / '.local'
local.mkdir(exist_ok=True)
handle, index = tempfile.mkstemp(prefix='pages-index-', dir=local)
os.close(handle)
os.unlink(index)
environment = dict(os.environ, GIT_INDEX_FILE=index)
try:
    git('-C', str(dist), '--git-dir=' + str(root / '.git'), '--work-tree=' + str(dist), 'add', '--all', '--', '.', env=environment)
    tree = git('write-tree', env=environment)
    published_files = set(git('ls-tree', '-r', '--name-only', tree).splitlines())
    expected_files = {p.relative_to(dist).as_posix() for p in dist.rglob('*') if p.is_file()}
    assert published_files == expected_files, 'Publication tree differs from the validated build.'
    # An existing publication is updated with a child commit, never a force push.
    args = ['commit-tree', tree]
    if parent:
        args += ['-p', parent]
    args += ['-m', 'Publish Sergey Shlomov multilingual profile website']
    commit = git(*args)
    subprocess.run(['git', 'push', 'origin', commit + ':refs/heads/gh-pages'], cwd=root, check=True)
    print('Uploaded static website to origin/gh-pages. Pages activation and HTTP verification are still required.')
finally:
    Path(index).unlink(missing_ok=True)
