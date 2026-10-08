#!/usr/bin/env python3
"""Read-only server inventory for a separate Dranbleib deployment. No secret reads."""
import json
import os
import platform
import re
from pathlib import Path
import shutil
import socket
import subprocess


def command(args):
    try:
        p = subprocess.run(args, capture_output=True, text=True, timeout=15)
        return p.returncode, p.stdout.strip()
    except (OSError, subprocess.TimeoutExpired):
        return None, ''


def probe_port(port):
    with socket.socket() as sock:
        return sock.connect_ex(('127.0.0.1', port)) == 0


_, node_version = command(['node', '--version'])
_, service_status = command(['systemctl', 'is-active', 'dranbleib'])
_, disk = command(['df', '-Pk', '/opt'])
_, containers = command(['docker','ps','--format','{{.Names}}\t{{.Image}}\t{{.Ports}}'])
_, certificate = command(['openssl','x509','-in','/etc/letsencrypt/live/nyrathen-contabo-eu/fullchain.pem','-noout','-dates','-ext','subjectAltName'])
_, firewall = command(['ufw','status'])
domains=set()
for folder in ['/etc/nginx/sites-enabled','/etc/nginx/conf.d']:
    p=Path(folder)
    if p.exists():
        for file in p.iterdir():
            if not file.is_file():
                continue
            raw=file.read_text(errors='replace')
            for value in re.findall(r'(?m)^\s*server_name\s+([^;]+);',raw):
                for host in value.split():
                    if re.fullmatch(r'[a-zA-Z0-9.-]+',host) and '.' in host:
                        domains.add(host)
report = {
    'configured_nginx_hostnames':sorted(domains),
    'ports_in_use':{str(p):probe_port(p) for p in [80,443,8443,8790,8791]},
    'proxy_binaries':{p:bool(shutil.which(p)) for p in ['caddy','nginx','docker','certbot']},
    'public_certificate_metadata':certificate,
    'containers_public_metadata':containers,
    'firewall_status':firewall,
    'certificate_names':sorted(p.name for p in Path('/etc/letsencrypt/live').glob('*') if p.is_dir()),
    'mode': 'read-only-preflight',
    'platform': platform.system(),
    'architecture': platform.machine(),
    'libc': list(platform.libc_ver()),
    'system_node': node_version or 'not-found',
    'systemd_available': bool(shutil.which('systemctl')),
    'private_port_8790_in_use': probe_port(8790),
    'dranbleib_service_status': service_status or 'unknown',
    'project_path_exists': os.path.exists('/opt/dranbleib'),
    'data_path_exists': os.path.exists('/var/lib/dranbleib'),
    'opt_disk_usage': disk,
    'existing_app_changes': False,
}
print(json.dumps(report, indent=2))
