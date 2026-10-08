#!/usr/bin/env python3
"""Copy a validated existing certificate on the VPS; never emit private material."""
import os
import pwd
import subprocess
from pathlib import Path
SOURCE=Path('/etc/letsencrypt/live/nyrathen-contabo-eu')
DEST=Path('/etc/dranbleib-https/tls')
IP='161.97.102.171'
def run(*args):
 p=subprocess.run(args,capture_output=True,timeout=20)
 if p.returncode:raise RuntimeError('Certificate validation failed.')
 return p.stdout

def sync():
 if os.geteuid()!=0:raise RuntimeError('Root is required for the local certificate import.')
 user=pwd.getpwnam('dranbleib-https')
 cert=SOURCE/'fullchain.pem';key=SOURCE/'privkey.pem'
 run('openssl','x509','-in',str(cert),'-checkip',IP,'-checkend','3600','-noout')
 run('openssl','verify','-purpose','sslserver','-verify_ip',IP,'-untrusted',str(cert),str(cert))
 if run('openssl','x509','-in',str(cert),'-pubkey','-noout')!=run('openssl','pkey','-in',str(key),'-pubout'):
  raise RuntimeError('Certificate/key mismatch.')
 if DEST.parent.is_symlink() or DEST.is_symlink():raise RuntimeError('Unexpected certificate directory link.')
 DEST.mkdir(parents=True,exist_ok=True,mode=0o750)
 for directory in [DEST.parent,DEST]:os.chown(directory,0,user.pw_gid);directory.chmod(0o750)
 for src in [cert,key]:
  target=DEST/src.name
  if target.exists() and not target.is_symlink() and target.read_bytes()==src.read_bytes():continue
  temp=DEST/(src.name+'.next')
  if temp.exists() or temp.is_symlink():raise RuntimeError('Unexpected temporary certificate file.')
  with temp.open('xb') as f:f.write(src.read_bytes())
  temp.chmod(0o640);os.chown(temp,0,user.pw_gid);os.replace(temp,target)
 print('Validated certificate synchronized; no key material printed.')
if __name__=='__main__':sync()
