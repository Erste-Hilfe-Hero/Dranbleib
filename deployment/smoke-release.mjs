import assert from 'node:assert/strict';
import {randomBytes,createHash} from 'node:crypto';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StreamableHTTPClientTransport} from '@modelcontextprotocol/sdk/client/streamableHttp.js';
const base=process.env.SMOKE_BASE??'http://127.0.0.1:8791';
const metadata=await (await fetch(base+'/.well-known/oauth-protected-resource/mcp')).json();
const resource=metadata.resource,origin=new URL(resource).origin;
const verifier=randomBytes(48).toString('base64url'),challenge=createHash('sha256').update(verifier).digest('base64url');
const password=randomBytes(24).toString('hex'),redirect='https://chatgpt.com/connector/oauth/dranbleib-synthetic-test';
const accounts=[],connections=[];
async function post(path,body,headers={}){return fetch(base+path,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded',Origin:origin,...headers},body:new URLSearchParams(body),redirect:'manual'});}
async function account(){
 const name='smoke-'+randomBytes(6).toString('hex');
 const reg=await fetch(base+'/register',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({redirect_uris:[redirect],token_endpoint_auth_method:'none',client_name:'Dranbleib synthetic deployment verification'})});assert.equal(reg.status,201);const client=await reg.json();
 const q=new URLSearchParams({client_id:client.client_id,redirect_uri:redirect,response_type:'code',code_challenge:challenge,code_challenge_method:'S256',resource,scope:'loops:read loops:write',state:'synthetic-verification'});
 const a=await fetch(base+'/authorize?'+q,{redirect:'manual'});assert.equal(a.status,302);const url=new URL(a.headers.get('location'));
 const f=await fetch(base+url.pathname+url.search);const html=await f.text(),csrf=html.match(/name="csrf" value="([a-f0-9]+)"/)[1],cookie=f.headers.get('set-cookie').split(';')[0];
 const consent=await post('/consent',{request:url.searchParams.get('request'),csrf,name,password,create:'yes',approved:'yes'},{Cookie:cookie});assert.equal(consent.status,302);accounts.push(name);
 const callback=new URL(consent.headers.get('location'));assert.equal(callback.searchParams.get('state'),'synthetic-verification');
 const token=await post('/token',{grant_type:'authorization_code',client_id:client.client_id,code:callback.searchParams.get('code'),code_verifier:verifier,redirect_uri:redirect,resource});assert.equal(token.status,200);const tokens=await token.json();
 const c=new Client({name:'deployment-smoke',version:'1.0'}),t=new StreamableHTTPClientTransport(new URL(base+'/mcp'),{requestInit:{headers:{Authorization:'Bearer '+tokens.access_token}}});await c.connect(t);connections.push({c,t});return c;
}
try{
 assert.equal((await fetch(base+'/mcp',{method:'POST'})).status,401);
 const a=await account(),b=await account(),call=(c,name,args={})=>c.callTool({name,arguments:args});
 const proposal=(await call(a,'preview_open_loop',{text:'Bitte bis Freitag antworten.'})).structuredContent.proposal;
 assert.ok(proposal.uncertainties.length);assert.equal(proposal.fields.dueDate,null);
 const loop=(await call(a,'capture_open_loop',{proposalId:proposal.proposalId,fields:proposal.fields,confirmed:true})).structuredContent.loop;
 assert.equal((await call(b,'list_open_loops')).structuredContent.loops.length,0);
 assert.equal((await call(b,'get_open_loop',{id:loop.id})).isError,true);
 assert.equal((await call(a,'get_open_loop',{id:loop.id})).structuredContent.loop.id,loop.id);
 assert.equal((await call(a,'draft_followup',{id:loop.id,kind:'nachfassen'})).isError,undefined);
 const updated=await call(a,'update_open_loop',{id:loop.id,changes:{status:'erledigt'},confirmed:true});assert.ok(!updated.isError);
 assert.equal((await call(a,'list_open_loops',{filter:'erledigt'})).structuredContent.loops.length,1);
 assert.equal((await call(a,'delete_open_loop',{id:loop.id,confirmed:true})).isError,undefined);
 assert.equal((await call(a,'list_open_loops')).structuredContent.loops.length,0);
 console.log(JSON.stringify({status:'passed',mode:'authenticated-release-candidate',oauth_pkce_consent:true,authenticated_crud:true,account_isolation:true,uncertain_date:true,no_anonymous_access:true,publicly_exposed:false}));
}finally{
 for(const {c,t} of connections){try{await t.terminateSession();}catch{}await c.close();}
 for(const name of accounts){const f=await fetch(base+'/account/delete'),html=await f.text(),csrf=html.match(/name="csrf" value="([a-f0-9]+)"/)[1],cookie=f.headers.get('set-cookie').split(';')[0];const r=await post('/account/delete',{csrf,name,password,confirmed:'yes'},{Cookie:cookie});assert.equal(r.status,200);}
}
