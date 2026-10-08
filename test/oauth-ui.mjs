// Browser uses a synthetic HTTPS origin routed to our real loopback server.
// This verifies Secure cookies/forms, not a public certificate or ChatGPT login.
import {chromium} from '@playwright/test';
import {once} from 'node:events';
import {existsSync,mkdirSync} from 'node:fs';
import {randomBytes,createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {startReleaseServer} from '../src/release-server.js';
const origin='https://release.example',app=startReleaseServer({publicOrigin:origin,port:0,dataPath:':memory:'});await once(app.http,'listening');const base='http://127.0.0.1:'+app.http.address().port;
const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:existsSync('/usr/bin/chromium')?{executablePath:'/usr/bin/chromium'}:{})});
try{
 let callback;
 const context=await browser.newContext({viewport:{width:390,height:844},locale:'de-DE'});
 await context.route(origin+'/**',async route=>{const request=route.request(),u=new URL(request.url()),headers={...await request.allHeaders(),Host:u.host};delete headers['content-length'];const r=await fetch(base+u.pathname+u.search,{method:request.method(),headers,body:request.postData()??undefined,redirect:'manual'});if(r.status===302){callback=r.headers.get('location');await route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><html lang="de"><body>Test-Rueckkehr</body></html>'});return;}const out=Object.fromEntries(r.headers);delete out['content-length'];delete out['content-encoding'];await route.fulfill({status:r.status,headers:out,body:Buffer.from(await r.arrayBuffer())});});
 await context.route('https://chatgpt.com/connector/oauth/browser-test**',route=>route.fulfill({contentType:'text/html',body:'<!doctype html><html lang="de"><body>Test-Rueckkehr</body></html>'}));
 const client=await (await fetch(base+'/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({redirect_uris:['https://chatgpt.com/connector/oauth/browser-test'],token_endpoint_auth_method:'none',client_name:'Synthetischer Browsertest'})})).json();
 const verifier=randomBytes(48).toString('base64url'),challenge=createHash('sha256').update(verifier).digest('base64url');
 const q=new URLSearchParams({client_id:client.client_id,redirect_uri:client.redirect_uris[0],response_type:'code',code_challenge:challenge,code_challenge_method:'S256',resource:origin+'/mcp',scope:'loops:read loops:write',state:'browser-state'});
 const page=await context.newPage(),errors=[];page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));const auth=await fetch(base+'/authorize?'+q,{redirect:'manual'});await page.goto(auth.headers.get('location'));
 await page.getByLabel('Benutzername',{exact:true}).fill('browser-test');await page.getByLabel('Passwort',{exact:true}).fill('synthetic-test-password-123');await page.getByLabel('Neues Konto erstellen',{exact:false}).check();
 // Missing explicit approval prevents navigation and account creation.
 await page.getByRole('button',{name:'Bestätigen und verbinden'}).click();assert.ok(page.url().startsWith(origin+'/consent'));assert.equal(app.store.db.prepare('SELECT count(*) n FROM auth_users').get().n,0);
 await page.getByLabel('Diesem Client',{exact:false}).check();mkdirSync('artifacts',{recursive:true});await page.screenshot({path:'artifacts/dranbleib-oauth-consent.png',fullPage:true});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.getByRole('button',{name:'Bestätigen und verbinden'}).click();await page.getByText('Test-Rueckkehr',{exact:true}).waitFor();assert.equal(new URL(callback).searchParams.get('state'),'browser-state');assert.equal(app.store.db.prepare('SELECT count(*) n FROM auth_users').get().n,1);
 await page.goto(origin+'/account/delete');await page.getByLabel('Benutzername',{exact:true}).fill('browser-test');await page.getByLabel('Passwort',{exact:true}).fill('synthetic-test-password-123');await page.getByLabel('Konto und alle meine Vorgänge endgültig löschen.').check();await page.getByRole('button',{name:'Löschen bestätigen'}).click();await page.getByRole('heading',{name:'Konto gelöscht',exact:true}).waitFor();assert.equal(app.store.db.prepare('SELECT count(*) n FROM auth_users').get().n,0);assert.deepEqual(errors,[]);
 console.log('PASS OAuth-Browser: Secure-Cookie, explizite Zustimmung, Kontoerstellung, Rückkehr mit State, bestätigte Kontolöschung, mobile Darstellung. HTTPS lokal simuliert.');
}finally{await browser.close();await app.close();}
