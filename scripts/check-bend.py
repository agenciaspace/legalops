#!/usr/bin/env python3
"""Prove finite policies and verify their complete generated decision tables.

The runtime consumes these tables, so it needs no Bend process or native runtime.
The proof covers the Bend policies; host parsing, IO and authorization still need tests.
"""
import argparse
import hashlib
import itertools
import json
import os
from pathlib import Path
import platform
import shutil
import subprocess
import tempfile
import urllib.request

VERSION = '2.0.8'
SUMS = {
    ('Linux', 'x86_64'): ('linux-x64', '8f12d24fa2578877770efb6c7a695f43b644f9c59514eab4b5db12e06fdb5331'),
    ('Linux', 'aarch64'): ('linux-arm64', '03b8989e319c89ef2446018ce2d4bd77d02453d86453205a6c9cf84d0e75bd2b'),
    ('Darwin', 'arm64'): ('darwin-arm64', '3d757980a67f7cddd98ada2e35e79ee726f0ad3b2e865459b0d675639f0eae7b'),
    ('Darwin', 'x86_64'): ('darwin-x64', 'b1bc1f2ca5144e72023243df0a420f919feb8f47a7d407de1fff081ffd16d1b2'),
}
ENV = dict(os.environ, BEND_NO_TELEMETRY='1')
ROOT = Path(__file__).resolve().parent.parent


def run(binary, *args, cwd=ROOT):
    result = subprocess.run([str(binary), *map(str, args)], cwd=cwd, env=ENV,
                            text=True, capture_output=True, timeout=90)
    if result.returncode:
        raise RuntimeError(result.stderr + result.stdout)
    return result.stdout.strip()


def compiler():
    configured = os.environ.get('BEND_BIN') or shutil.which('bend')
    if configured:
        if run(configured, '--version').strip() not in (VERSION, 'Bend ' + VERSION, 'bend ' + VERSION):
            raise RuntimeError(f'Bend {VERSION} is required; found another version')
        return Path(configured)
    target, checksum = SUMS[(platform.system(), platform.machine())]
    cache = Path(os.environ.get('XDG_CACHE_HOME', str(Path.home() / '.cache'))) / 'bend' / VERSION / target
    binary = cache / 'bin' / 'bend'
    if not binary.exists():
        cache.mkdir(parents=True, exist_ok=True)
        with tempfile.TemporaryDirectory() as temporary:
            archive = Path(temporary) / 'bend.tar.gz'
            url = f'https://github.com/bendlang/bend/releases/download/v{VERSION}/bend-{VERSION}-{target}.tar.gz'
            urllib.request.urlretrieve(url, archive)
            if hashlib.sha256(archive.read_bytes()).hexdigest() != checksum:
                raise RuntimeError('Bend download checksum mismatch')
            subprocess.run(['tar', '-xzf', str(archive), '-C', str(cache), '--strip-components=1'], check=True)
    return binary


def generate(binary):
    manifest = json.loads((ROOT / 'bend/policies.json').read_text())
    tables = {}
    for policy in manifest:
        calls = []
        for flags in itertools.product((False, True), repeat=len(policy['inputs'])):
            args = ', '.join('True{}' if flag else 'False{}' for flag in flags)
            calls.append(f'as_number(Policy.{policy["function"]}({args}))')
        source = ('import Base\nimport ./' + policy['source'] + ' as Policy\n'
                  'def as_number(value: Bool) -> U32:\n  match value:\n'
                  '    case False{}:\n      0\n    case True{}:\n      1\n'
                  'def main() -> List<U32>:\n  [' + ', '.join(calls) + ']\n')
        with tempfile.TemporaryDirectory() as temporary:
            folder = Path(temporary)
            shutil.copytree(ROOT / 'bend', folder / 'bend')
            (folder / 'table.bend').write_text(source)
            values = json.loads(run(binary, folder / 'table.bend', cwd=folder))
        if len(values) != len(calls) or any(type(value) is not int or value not in (0, 1) for value in values):
            raise RuntimeError('Invalid Bend decision table')
        tables[policy['name']] = {'inputs': policy['inputs'], 'values': values}
    return json.dumps({'compiler': 'Bend ' + VERSION, 'tables': tables}, indent=2) + '\n'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--write', action='store_true', help='Regenerate the runtime artifact after proving laws')
    args = parser.parse_args()
    binary = compiler()
    print(run(binary, 'PROOF.bend'))
    expected = generate(binary)
    artifact = ROOT / 'bend/decisions.generated.json'
    if args.write:
        artifact.write_text(expected)
    elif not artifact.exists() or artifact.read_text() != expected:
        raise SystemExit('Bend artifact is stale. Run python3 scripts/check-bend.py --write and review the diff.')
    print('Bend proofs and complete runtime decision tables verified.')


if __name__ == '__main__':
    main()
