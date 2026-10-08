import {test} from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync,spawn} from 'node:child_process';
import {mkdtempSync,readFileSync,rmSync,statSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {once} from 'node:events';
import https from 'node:https';
import {checkServerIdentity} from 'node:tls';
import {startReleaseServer} from '../src/release-server.js';
import {startHttpsProxy,loadTls} from '../src/https-proxy.js';
const origin='https://127.0.0.1:8443';
function request(port,ca,path,headers={}){return new Promise((resolve,reject)=>{const req=https.request({hostname:'127.0.0.1',port,ca,checkServerIdentity:(_host,cert)=>checkServerIdentity('127.0.0.1',cert),path,headers:{Host:'127.0.0.1:8443',...headers}},res=>{let text='';res.on('data',c=>text+=c);res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,text}));});req.on('error',reject);req.end();});}

test('Echter TLS-Proxy: verifizierte lokale CA, Host/Origin-Schutz, Discovery und kein anonymer Zugriff',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'dranbleib-tls-'));let app,proxy;
 try{
  execFileSync('openssl',['req','-x509','-newkey','rsa:2048','-nodes','-keyout',join(dir,'privkey.pem'),'-out',join(dir,'fullchain.pem'),'-days','1','-subj','/CN=127.0.0.1','-addext','subjectAltName=IP:127.0.0.1'],{stdio:'ignore'});
  const ca=readFileSync(join(dir,'fullchain.pem'));assert.throws(()=>loadTls(dir,'192.0.2.1'));
  app=startReleaseServer({publicOrigin:origin,port:0,dataPath:':memory:'});await once(app.http,'listening');
  proxy=startHttpsProxy({origin,tlsDirectory:dir,port:0,backendPort:app.http.address().port});await once(proxy.server,'listening');const p=proxy.server.address().port;
  assert.equal((await request(p,ca,'/health')).status,200);
  assert.equal((await request(p,ca,'/mcp')).status,401);
  assert.equal(JSON.parse((await request(p,ca,'/.well-known/oauth-protected-resource/mcp')).text).resource,origin+'/mcp');
  assert.equal((await request(p,ca,'/health',{Host:'attacker.example'})).status,403);
  assert.equal((await request(p,ca,'/health',{Origin:'https://attacker.example'})).status,403);
  assert.equal((await request(p,ca,'/health',{Forwarded:'host=attacker.example','X-Forwarded-Host':'attacker.example'})).status,200);
  for(const path of ['/privacy','/terms','/support'])assert.equal((await request(p,ca,path)).status,200);
 }finally{if(proxy)await proxy.close();if(app)await app.close();rmSync(dir,{recursive:true,force:true});}
});

test('Geschlossene Registrierung und Betreiberkonten: reale OAuth-CRUD-Tests ohne öffentliche Anmeldung',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'dranbleib-operator-')),path=join(dir,'preview.sqlite'),credentials=join(dir,'credentials.json');let app;
 try{
  const output=execFileSync(process.execPath,['scripts/account-admin.js','--data',path,'--origin',origin,'--count','2','--credentials-out',credentials],{encoding:'utf8'});
  const data=JSON.parse(readFileSync(credentials,'utf8'));assert.equal(data.accounts.length,2);assert.equal(statSync(credentials).mode&0o777,0o600);assert.ok(data.accounts.every(a=>!output.includes(a.password)));
  app=startReleaseServer({publicOrigin:origin,port:0,dataPath:path});await once(app.http,'listening');const base='http://127.0.0.1:'+app.http.address().port;
  const child=spawn(process.execPath,['deployment/smoke-release.mjs'],{env:{...process.env,SMOKE_BASE:base,SMOKE_CREDENTIALS:credentials},stdio:['ignore','pipe','pipe']});let logs='';child.stdout.on('data',c=>logs+=c);child.stderr.on('data',c=>logs+=c);const [code]=await once(child,'exit');assert.equal(code,0,logs);assert.ok(data.accounts.every(a=>!logs.includes(a.password)));assert.equal(app.store.db.prepare('SELECT count(*) n FROM auth_users').get().n,0);
  const client=await (await fetch(base+'/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({redirect_uris:['https://chatgpt.com/test'],token_endpoint_auth_method:'none'})})).json();
  const params=new URLSearchParams({client_id:client.client_id,redirect_uri:'https://chatgpt.com/test',response_type:'code',code_challenge:'a'.repeat(43),code_challenge_method:'S256',resource:origin+'/mcp',scope:'loops:read'});
  const auth=await fetch(base+'/authorize?'+params,{redirect:'manual'}),url=new URL(auth.headers.get('location'));const form=await fetch(base+url.pathname+url.search),html=await form.text();assert.ok(!html.includes('name="create"'));
  const csrf=html.match(/name="csrf" value="([a-f0-9]+)"/)[1],cookie=form.headers.get('set-cookie').split(';')[0];
  const denied=await fetch(base+'/consent',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded',Cookie:cookie,Origin:origin},body:new URLSearchParams({request:url.searchParams.get('request'),csrf,name:'forbidden-signup',password:'synthetic-password-only',create:'yes',approved:'yes'})});assert.equal(denied.status,403);assert.equal(app.store.db.prepare('SELECT count(*) n FROM auth_users').get().n,0);
 }finally{if(app)await app.close();rmSync(dir,{recursive:true,force:true});}
});
