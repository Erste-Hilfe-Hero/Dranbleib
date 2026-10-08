#!/usr/bin/env python3
"""Install Dranbleib only; preserve all existing application services."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import platform
import pwd
import re
import socket
import subprocess
import tarfile
import time
import urllib.request

BASE = Path('/opt/dranbleib')
UNIT = Path('/etc/systemd/system/dranbleib.service')
PORT = 8790
SERVICE = "dranbleib"
DESCRIPTION = "Dranbleib private local MCP demo"
ENTRY = "server.js"
DATA_DIR = "/var/lib/dranbleib"
ORIGIN = None
HEALTH_MODE = "local-demo"


def run(*args):
    return subprocess.run(args, check=True, capture_output=True, text=True).stdout.strip()


def running_services():
    return {line.split()[0] for line in run('systemctl', 'list-units', '--type=service', '--state=running', '--no-legend', '--plain').splitlines() if line.strip()} - {SERVICE + '.service'}


def assert_archive_safe(archive):
    for member in archive.getmembers():
        path = Path(member.name)
        if path.is_absolute() or '..' in path.parts or member.issym() or member.islnk() or not (member.isfile() or member.isdir()):
            raise RuntimeError('Archive has unsafe entries.')
        if path.parts and path.parts[0] not in {'src', 'public', 'node_modules', 'runtime', 'package.json', 'package-lock.json', 'scripts', 'assets'}:
            raise RuntimeError('Unexpected archive content.')


def main():
    global BASE, UNIT, PORT, SERVICE, DESCRIPTION, ENTRY, DATA_DIR, ORIGIN, HEALTH_MODE
    parser = argparse.ArgumentParser()
    parser.add_argument('--archive', required=True)
    parser.add_argument('--sha256', required=True)
    parser.add_argument('--commit', required=True)
    parser.add_argument('--mode', choices=['private','authenticated','preview'], default='private')
    parser.add_argument('--public-origin')
    args = parser.parse_args()
    if args.mode in ['authenticated','preview']:
        from urllib.parse import urlsplit
        u = urlsplit(args.public_origin or '')
        if u.scheme != 'https' or not u.netloc or u.path not in ['', '/'] or u.query or u.fragment or u.username or u.password or not re.fullmatch(r'https://[a-zA-Z0-9.:-]+/?', args.public_origin):
            raise RuntimeError('Canonical HTTPS origin required.')
        SERVICE = 'dranbleib-release'
        BASE = Path('/opt/' + SERVICE)
        UNIT = Path('/etc/systemd/system/' + SERVICE + '.service')
        PORT = 8791
        DESCRIPTION = 'Dranbleib authenticated release candidate'
        ENTRY = 'release-server.js'
        DATA_DIR = '/var/lib/' + SERVICE
        ORIGIN = args.public_origin.rstrip('/')
        HEALTH_MODE = 'authenticated-release-candidate'
        if args.mode == 'preview':
            SERVICE = 'dranbleib-preview'
            BASE = Path('/opt/' + SERVICE)
            UNIT = Path('/etc/systemd/system/' + SERVICE + '.service')
            DATA_DIR = '/var/lib/' + SERVICE
            PORT = 8792
            DESCRIPTION = 'Dranbleib closed HTTPS preview' 
    if os.geteuid() != 0 or platform.system() != 'Linux' or platform.machine() != 'x86_64':
        raise RuntimeError('Expected root on an inspected Linux x86_64 host.')
    if not re.fullmatch(r'[a-f0-9]{40}', args.commit) or not re.fullmatch(r'[a-f0-9]{64}', args.sha256):
        raise RuntimeError('Invalid immutable source/hash.')
    if hashlib.sha256(Path(args.archive).read_bytes()).hexdigest() != args.sha256:
        raise RuntimeError('Release checksum mismatch.')
    if BASE.is_symlink() or (BASE.exists() and not (BASE / 'dranbleib-managed').is_file()):
        raise RuntimeError('Refusing to overwrite an unmanaged directory.')
    if UNIT.exists() and ('Description=' + DESCRIPTION) not in UNIT.read_text():
        raise RuntimeError('Refusing to overwrite an unrelated service.')
    with socket.socket() as probe:
        in_use = probe.connect_ex(('127.0.0.1', PORT)) == 0
    if in_use and not UNIT.exists():
        raise RuntimeError('The separate port is occupied.')
    before = running_services()
    with tarfile.open(args.archive) as archive:
        assert_archive_safe(archive)
        BASE.mkdir(mode=0o755, exist_ok=True)
        (BASE / 'dranbleib-managed').touch(mode=0o644)
        release = BASE / 'releases' / args.commit
        if release.exists():
            raise RuntimeError('Immutable release exists; inspect before retry.')
        release.mkdir(parents=True, mode=0o755)
        # All paths checked; no links/devices/absolute or parent paths allowed.
        archive.extractall(release)
    for path in release.rglob('*'):
        path.chmod(0o755 if path.is_dir() or path == release / 'runtime/node' else 0o644)
    node = release / 'runtime/node'
    if not run(str(node), '--version').startswith('v24.'):
        raise RuntimeError('Expected qualified private Node.js 24 runtime.')
    try:
        user = pwd.getpwnam(SERVICE)
        if user.pw_dir != DATA_DIR or user.pw_uid == 0:
            raise RuntimeError('Existing service account does not match.')
    except KeyError:
        run('useradd', '--system', '--home-dir', DATA_DIR, '--no-create-home', '--shell', '/usr/sbin/nologin', SERVICE)
    current = BASE / 'current'
    if current.exists() and not current.is_symlink():
        raise RuntimeError('Refusing to replace a real current directory.')
    old_target = os.readlink(current) if current.is_symlink() else None
    old_unit = UNIT.read_bytes() if UNIT.exists() else None
    unit = '''[Unit]
Description=Dranbleib private local MCP demo
After=network.target
[Service]
Type=simple
User=dranbleib
Group=dranbleib
WorkingDirectory=/opt/dranbleib/current
ExecStart=/opt/dranbleib/current/runtime/node /opt/dranbleib/current/src/server.js
Environment=PORT=8790
Environment=DATA_PATH=/var/lib/dranbleib/dranbleib.sqlite
StateDirectory=dranbleib
StateDirectoryMode=0700
UMask=0077
Restart=on-failure
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ProtectKernelTunables=true
ProtectKernelModules=true
ProtectControlGroups=true
RestrictSUIDSGID=true
CapabilityBoundingSet=
[Install]
WantedBy=multi-user.target
'''
    unit = unit.replace('Dranbleib private local MCP demo', DESCRIPTION).replace('/opt/dranbleib', str(BASE)).replace('/var/lib/dranbleib', DATA_DIR).replace('User=dranbleib', 'User=' + SERVICE).replace('Group=dranbleib', 'Group=' + SERVICE).replace('StateDirectory=dranbleib', 'StateDirectory=' + SERVICE).replace('PORT=8790', 'PORT=' + str(PORT)).replace('/src/server.js', '/src/' + ENTRY)
    if ORIGIN:
        unit = unit.replace('Environment=PORT=', 'Environment=PUBLIC_ORIGIN=' + ORIGIN + '\nEnvironment=PORT=')
    if args.mode == 'preview':
        unit = unit.replace('Environment=PUBLIC_ORIGIN=', 'EnvironmentFile=-/etc/dranbleib-preview.env\nEnvironment=PUBLIC_ORIGIN=')
    try:
        link = BASE / 'next'
        if link.is_symlink():
            link.unlink()
        link.symlink_to(release)
        os.replace(link, current)
        UNIT.write_text(unit)
        run('systemctl', 'daemon-reload')
        run('systemctl', 'enable', SERVICE)
        run('systemctl', 'restart', SERVICE)
        health = None
        for attempt in range(20):
            try:
                with urllib.request.urlopen(f'http://127.0.0.1:{PORT}/health', timeout=3) as response:
                    health = json.load(response)
                if health == {'status': 'ok', 'mode': HEALTH_MODE}:
                    break
            except (OSError, ValueError):
                pass
            time.sleep(1)
        if health != {'status': 'ok', 'mode': HEALTH_MODE}:
            raise RuntimeError('Private health check failed.')
        if before - running_services():
            raise RuntimeError('An existing service stopped; investigate.')
        print(json.dumps({'status':'installed-' + args.mode,'source_commit':args.commit,'health':health,'address':f'127.0.0.1:{PORT}','service':SERVICE,'existing_services_preserved':True,'publicly_exposed':False}, indent=2))
    except Exception:
        run('systemctl', 'stop', SERVICE)
        if old_target:
            current.unlink()
            current.symlink_to(old_target)
        if old_unit:
            UNIT.write_bytes(old_unit)
            run('systemctl', 'daemon-reload')
            run('systemctl', 'start', SERVICE)
        else:
            run('systemctl', 'disable', SERVICE)
            UNIT.unlink(missing_ok=True)
            run('systemctl', 'daemon-reload')
        raise


if __name__ == '__main__':
    main()
