import express from 'express';
import { rateLimit } from 'express-rate-limit';
import { randomBytes, timingSafeEqual, createHash, randomUUID } from 'node:crypto';
import { readFileSync, mkdirSync, realpathSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mcpAuthRouter, createOAuthMetadata, getOAuthProtectedResourceMetadataUrl } from '@modelcontextprotocol/sdk/server/auth/router.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { Store } from './domain.js';
import { createMcp } from './server.js';
import { OAuthProvider, SCOPES } from './oauth.js';
const ROOT=fileURLToPath(new URL('../',import.meta.url));
const hash=x=>createHash('sha256').update(x).digest('hex');
const esc=x=>String(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const page=(title,body)=>`<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)} · Dranbleib</title><link rel="stylesheet" href="/style.css"></head><body><main><h1>Dranbleib</h1><section class="panel"><h2>${esc(title)}</h2>${body}</section><footer>Release-Kandidat. Kein Versand, keine Überwachung, keine Rechtsberatung.</footer></main></body></html>`;
export function startReleaseServer({publicOrigin=process.env.PUBLIC_ORIGIN,port=Number(process.env.PORT??8791),dataPath=process.env.DATA_PATH??resolve(ROOT,'data/release.sqlite')}={}){
 if(!publicOrigin)throw new Error('PUBLIC_ORIGIN must be the owned HTTPS origin.');
 const origin=new URL(publicOrigin);if(origin.protocol!=='https:'||origin.pathname!=='/'||origin.search||origin.hash||origin.username||origin.password)throw new Error('Canonical HTTPS origin required.');
 process.umask(0o077);if(dataPath!==':memory:')mkdirSync(dirname(dataPath),{recursive:true,mode:0o700});
 const store=new Store(dataPath),provider=new OAuthProvider(store,origin.origin),metadataUrl=getOAuthProtectedResourceMetadataUrl(new URL(provider.resource));
 const app=express();app.disable('x-powered-by');const sessions=new Map();const formSessions=new Map();let http;
 const csrfCookie=req=>req.headers.cookie?.match(/(?:^|;\s*)dranbleib_csrf=([a-f0-9]{64})(?:;|$)/)?.[1];
 function bindForm(res){const nonce=randomBytes(32).toString('hex');res.setHeader('Set-Cookie',`dranbleib_csrf=${nonce}; Secure; HttpOnly; SameSite=Lax; Path=/; Max-Age=600`);return nonce;}
 function validCsrf(req,expected){const a=csrfCookie(req),b=req.body.csrf;if(typeof a!=='string'||typeof b!=='string'||a.length!==64||b.length!==64)return false;return timingSafeEqual(Buffer.from(a),Buffer.from(b))&&hash(a)===expected;}
 app.use((req,res,next)=>{
  const backendOrigin='http://127.0.0.1:'+http?.address()?.port;
  if(![origin.host,new URL(backendOrigin).host].includes(req.headers.host))return res.status(403).json({error:'Unzulässiger Host.'});
  if(req.headers.origin&&! [origin.origin,backendOrigin].includes(req.headers.origin))return res.status(403).json({error:'Unzulässiger Ursprung.'});
  res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');res.setHeader('Content-Security-Policy',"default-src 'none'; style-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'");next();
 });
 const authOptions={provider,issuerUrl:origin,resourceServerUrl:new URL(provider.resource),scopesSupported:SCOPES,resourceName:'Dranbleib'};
 const authMetadata={...createOAuthMetadata(authOptions),token_endpoint_auth_methods_supported:['none'],revocation_endpoint_auth_methods_supported:['none']};
 app.get('/.well-known/oauth-authorization-server',(_req,res)=>res.json(authMetadata));
 app.use(mcpAuthRouter(authOptions));
 app.get('/style.css',(_req,res)=>res.type('css').send(readFileSync(resolve(ROOT,'public/style.css'),'utf8')));
 app.use('/consent',rateLimit({windowMs:600000,max:20,standardHeaders:true,legacyHeaders:false}));
 app.get('/consent',(req,res)=>{
  const id=req.query.request,p=provider.pending.get(id);if(!p||p.expires<=Date.now()/1000)return res.status(400).send(page('Anfrage abgelaufen','Bitte die Verbindung in ChatGPT neu beginnen.'));
  const nonce=bindForm(res);p.csrf=hash(nonce);
  res.send(page('Anmelden und Verbindung prüfen',`<p>Client: <strong>${esc(p.clientName)}</strong><br>Rückkehr zu: ${esc(new URL(p.redirectUri).origin)}</p><p>Berechtigungen: ${esc(p.scopes.join(', '))}. Bestätigte Vorgänge und kurze Belege werden dauerhaft deinem Konto zugeordnet. Ganze Quellen werden nicht gespeichert. Export über das Tool; Konto löschen über /account/delete.</p><form method="post" action="/consent"><input type="hidden" name="request" value="${esc(id)}"><input type="hidden" name="csrf" value="${nonce}"><label>Benutzername<input name="name" minlength="3" maxlength="40" required autocomplete="username"></label><label>Passwort<input name="password" type="password" minlength="12" maxlength="128" required autocomplete="current-password"></label><label><input type="checkbox" name="create" value="yes"> Neues Konto erstellen (keine E-Mail, keine Passwortwiederherstellung).</label><label><input type="checkbox" name="approved" value="yes" required> Diesem Client die genannten Rechte erteilen.</label><button class="primary">Bestätigen und verbinden</button></form>`));
 });
 app.post('/consent',express.urlencoded({extended:false,limit:'8kb'}),async(req,res)=>{
  const p=provider.pending.get(req.body.request);if(!p||p.expires<=Date.now()/1000||!validCsrf(req,p.csrf)||req.body.approved!=='yes')return res.status(403).send(page('Nicht bestätigt','Verbindung erneut beginnen; nichts freigegeben.'));
  try{const userId=req.body.create==='yes'?await provider.createUser(req.body.name,req.body.password):await provider.login(req.body.name,req.body.password);if(!userId)throw new Error();res.redirect(provider.approve(req.body.request,userId,true));}catch{return res.status(400).send(page('Anmeldung nicht möglich','Angaben prüfen oder Verbindung erneut beginnen.'));}
 });
 app.use('/account/delete',rateLimit({windowMs:600000,max:10,standardHeaders:true,legacyHeaders:false}));
 app.get('/account/delete',(_req,res)=>{const nonce=bindForm(res);formSessions.set(hash(nonce),Date.now()+600000);res.send(page('Konto und alle Vorgänge löschen',`<p>Nach Bestätigung werden dieses Konto, Vorgänge, Belege und erteilte Zugriffe gelöscht. Exporte und Backups separat löschen.</p><form method="post"><input type="hidden" name="csrf" value="${nonce}"><label>Benutzername<input name="name" required autocomplete="username"></label><label>Passwort<input name="password" type="password" required autocomplete="current-password"></label><label><input name="confirmed" type="checkbox" value="yes" required> Konto und alle meine Vorgänge endgültig löschen.</label><button class="danger">Löschen bestätigen</button></form>`));});
 app.post('/account/delete',express.urlencoded({extended:false,limit:'8kb'}),async(req,res)=>{const key=hash(csrfCookie(req)??'');if(!validCsrf(req,key)||(formSessions.get(key)??0)<Date.now()||req.body.confirmed!=='yes')return res.status(403).json({error:'Bestätigung fehlt.'});const user=await provider.login(req.body.name,req.body.password);if(!user)return res.status(400).json({error:'Anmeldung nicht möglich.'});formSessions.delete(key);provider.deleteUser(user);res.send(page('Konto gelöscht','Vorgänge und Zugriffe wurden entfernt.'));});
 let html=readFileSync(resolve(ROOT,'public/index.html'),'utf8');html=html.replace('<head>','<head><meta name="dranbleib-mode" content="release">').replace('Entwicklungsdemo','Release-Kandidat');
 const widget=html.replace('<link rel="stylesheet" href="/style.css">',`<style>${readFileSync(resolve(ROOT,'public/style.css'),'utf8')}</style>`).replace('<script type="module" src="/app.js"></script>',`<script type="module">${readFileSync(resolve(ROOT,'public/app.js'),'utf8')}</script>`);
 app.all('/mcp',async(req,res)=>{
  let auth;try{if(!/^Bearer [a-f0-9]{64}$/.test(req.headers.authorization??''))throw new Error();auth=await provider.verifyAccessToken(req.headers.authorization.slice(7));if(!auth.scopes.includes('loops:read'))throw new Error();}catch{res.setHeader('WWW-Authenticate',`Bearer resource_metadata="${metadataUrl}", error="invalid_token", error_description="Login required", scope="loops:read"`);return res.status(401).json({error:'Anmeldung erforderlich.'});}
  req.auth=auth;const owner=auth.extra.owner,sid=req.headers['mcp-session-id'];let entry=sessions.get(sid);
  if(entry && (entry.owner!==owner||entry.expires<=Date.now()))return res.status(404).json({error:'Sitzung nicht gefunden.'});
  if(sid&&!entry)return res.status(404).json({error:'Sitzung nicht gefunden.'});
  if(!['GET','POST','DELETE'].includes(req.method))return res.status(405).end();
  try{
   let payload;if(req.method==='POST'){let chunks=[],bytes=0;for await(const c of req){bytes+=c.length;if(bytes>100000)throw new Error('size');chunks.push(c);}payload=JSON.parse(Buffer.concat(chunks).toString());}
   if(!entry){if(!isInitializeRequest(payload))return res.status(400).json({error:'MCP zuerst initialisieren.'});if(sessions.size>=100)return res.status(429).end();const server=createMcp(store,owner,widget,{authenticated:true,resourceMetadataUrl:metadataUrl});const transport=new StreamableHTTPServerTransport({sessionIdGenerator:()=>randomUUID(),enableJsonResponse:true,onsessioninitialized:id=>sessions.set(id,entry)});entry={owner,server,transport,expires:Date.now()+1800000};transport.onclose=()=>sessions.delete(transport.sessionId);await server.connect(transport);}
   await entry.transport.handleRequest(req,res,payload);
  }catch{if(!res.headersSent)res.status(400).json({error:'Ungültige MCP-Anfrage.'});else res.end();}
 });
 app.get('/health',(_req,res)=>res.json({status:'ok',mode:'authenticated-release-candidate'}));
 app.get('/',(_req,res)=>res.send(page('Authentifizierter Release-Kandidat','<p>Dranbleib verwaltet bestätigte Vorgänge mit Quellenbelegen. Zugang über eine OAuth-geschützte MCP-Verbindung in ChatGPT. Diese Kandidatenversion ist noch nicht öffentlich freigegeben.</p><p><a href="/account/delete">Eigenes Konto löschen</a></p>')));
 app.use((_req,res)=>res.status(404).json({error:'Nicht gefunden.'}));
 app.use((_error,_req,res,_next)=>{if(!res.headersSent)res.status(400).json({error:'Anfrage nicht verarbeitet.'});});
 http=app.listen(port,'127.0.0.1');
 const timer=setInterval(()=>{provider.prune();store.prune();for(const [k,expiry] of formSessions)if(expiry<Date.now())formSessions.delete(k);for(const [id,e] of sessions)if(e.expires<=Date.now()){sessions.delete(id);e.transport.close();e.server.close();}},30000);timer.unref();
 return {http,store,provider,async close(){clearInterval(timer);for(const e of sessions.values()){await e.transport.close();await e.server.close();}await new Promise(r=>http.close(r));store.close();}};
}
if(process.argv[1]&&existsSync(process.argv[1])&&realpathSync(process.argv[1])===fileURLToPath(import.meta.url)){const app=startReleaseServer();app.http.on('listening',()=>console.log('Dranbleib authentifizierter Release-Kandidat gestartet (Loopback).'));for(const sig of ['SIGINT','SIGTERM'])process.on(sig,async()=>{await app.close();process.exit(0);});}
