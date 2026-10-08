#!/usr/bin/env python3
"""Separate unprivileged Node TLS service on free 8443, never touch game proxy."""
import json
import os
from pathlib import Path
import pwd
import socket
import subprocess
import time
import urllib.request
BASE=Path('/opt/dranbleib-https')
UNIT=Path('/etc/systemd/system/dranbleib-https.service')
ORIGIN='https://161.97.102.171:8443'
def run(*args):return subprocess.run(args,check=True,capture_output=True,text=True,timeout=30).stdout

def running():return {l.split()[0] for l in run('systemctl','list-units','--type=service','--state=running','--no-legend','--plain').splitlines() if l.strip()}-{'dranbleib-https.service','dranbleib-certificate-sync.service'}
def main():
 if os.geteuid()!=0:raise RuntimeError('Expected authorized root installer.')
 if BASE.is_symlink() or (BASE.exists() and not (BASE/'dranbleib-managed').is_file()):raise RuntimeError('Unmanaged proxy path.')
 if UNIT.exists():raise RuntimeError('TLS service already exists; inspect before reinstalling.')
 for name in ['dranbleib-certificate-sync.service','dranbleib-certificate-sync.timer']:
  if Path('/etc/systemd/system',name).exists():raise RuntimeError('Certificate helper already exists; inspect before reinstalling.')
 with socket.socket() as s:
  if s.connect_ex(('127.0.0.1',8443))==0:raise RuntimeError('Port 8443 occupied.')
 before=running()
 if not Path('/opt/dranbleib-preview/current/src/https-proxy.js').is_file():raise RuntimeError('Qualified preview source not installed.')
 try:
  user=pwd.getpwnam('dranbleib-https')
  if user.pw_dir!='/var/lib/dranbleib-https' or user.pw_uid==0:raise RuntimeError('Unexpected service account.')
 except KeyError:run('useradd','--system','--home-dir','/var/lib/dranbleib-https','--no-create-home','--shell','/usr/sbin/nologin','dranbleib-https')
 BASE.mkdir(mode=0o755,exist_ok=True);(BASE/'dranbleib-managed').touch()
 sync=BASE/'sync-certificate.py';sync.write_bytes(Path(__file__).with_name('sync-certificate.py').read_bytes());sync.chmod(0o644)
 run('python3',str(sync))
 unit='''[Unit]
Description=Dranbleib separate HTTPS preview
After=network.target dranbleib-preview.service
Requires=dranbleib-preview.service
[Service]
User=dranbleib-https
Group=dranbleib-https
ExecStart=/opt/dranbleib-preview/current/runtime/node /opt/dranbleib-preview/current/src/https-proxy.js
Environment=PUBLIC_ORIGIN=https://161.97.102.171:8443
Environment=HTTPS_PORT=8443
Environment=BACKEND_PORT=8792
Environment=TLS_DIR=/var/lib/dranbleib-https/tls
StateDirectory=dranbleib-https
StateDirectoryMode=0700
UMask=0077
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ProtectKernelTunables=true
ProtectKernelModules=true
ProtectControlGroups=true
RestrictSUIDSGID=true
CapabilityBoundingSet=
Restart=on-failure
RestartSec=5
[Install]
WantedBy=multi-user.target
'''
 UNIT.write_text(unit)
 helper=Path('/etc/systemd/system/dranbleib-certificate-sync.service');helper.write_text('''[Unit]
Description=Dranbleib validated local TLS certificate import
[Service]
Type=oneshot
ExecStart=/usr/bin/python3 /opt/dranbleib-https/sync-certificate.py
UMask=0077
NoNewPrivileges=true
PrivateTmp=true
ProtectHome=true
ProtectSystem=strict
ReadWritePaths=/var/lib/dranbleib-https
''')
 timer=Path('/etc/systemd/system/dranbleib-certificate-sync.timer');timer.write_text('''[Unit]
Description=Dranbleib local TLS certificate refresh every five minutes
[Timer]
OnBootSec=2min
OnUnitActiveSec=5min
Persistent=true
[Install]
WantedBy=timers.target
''')
 try:
  run('systemctl','daemon-reload');run('systemctl','enable','--now','dranbleib-certificate-sync.timer','dranbleib-https.service')
  healthy=False
  for _ in range(15):
   try:
    with urllib.request.urlopen(ORIGIN+'/health',timeout=3) as r:healthy=json.load(r).get('status')=='ok'
    if healthy:break
   except (OSError,ValueError):pass
   time.sleep(1)
  if not healthy or before-running():raise RuntimeError('HTTPS health or existing service invariant failed.')
  timers=[l for l in run('systemctl','list-timers','--all','--no-legend','--plain').splitlines() if any(s in l.lower() for s in ['cert','renew','tls'])]
  print(json.dumps({'status':'https-preview-installed','origin':ORIGIN,'backend':'127.0.0.1:8792','existing_services_preserved':True,'certificate_sync_timer_active':True,'certificate_related_timers':timers,'production_published':False}))
 except Exception:
  run('systemctl','disable','--now','dranbleib-https.service','dranbleib-certificate-sync.timer')
  UNIT.unlink(missing_ok=True);helper.unlink(missing_ok=True);timer.unlink(missing_ok=True);run('systemctl','daemon-reload');raise
if __name__=='__main__':main()
