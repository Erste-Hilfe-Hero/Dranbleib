import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { request } from 'node:http';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startServer } from '../src/server.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

test('HTTP Browser-API: Erfassung, Persistenz, Datentrennung, Origin-/Hostschutz',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'dranbleib-'));const path=join(dir,'db.sqlite');let app=startServer({port:0,dataPath:path});await once(app.http,'listening');let base=`http://127.0.0.1:${app.http.address().port}`;
 try{
  const a=(await fetch(base)).headers.get('set-cookie').split(';')[0];const b=(await fetch(base)).headers.get('set-cookie').split(';')[0];
  const call=async(cookie,name,args={})=>{const r=await fetch(base+'/api/tool',{method:'POST',headers:{Origin:base,Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify({name,arguments:args})});return {status:r.status,body:await r.json()};};
  const p=(await call(a,'preview_open_loop',{text:'Bitte bis 2026-10-09 antworten.'})).body.structuredContent.proposal;
  assert.equal((await call(a,'capture_open_loop',{proposalId:p.proposalId,fields:p.fields,confirmed:false})).status,400);
  const loop=(await call(a,'capture_open_loop',{proposalId:p.proposalId,fields:p.fields,confirmed:true})).body.structuredContent.loop;
  assert.equal((await call(b,'get_open_loop',{id:loop.id})).status,400);
  assert.equal((await call(b,'list_open_loops')).body.structuredContent.loops.length,0);
  assert.equal((await fetch(base+'/api/tool',{method:'POST',headers:{Origin:'https://evil.example',Cookie:a,'Content-Type':'application/json'},body:'{}'})).status,403);
  assert.equal(await new Promise((resolve,reject)=>{const req=request(base+'/health',{headers:{Host:'evil.example'}},res=>{res.resume();resolve(res.statusCode);});req.on('error',reject);req.end();}),403);
  assert.equal((await fetch(base+'/api/tool',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:'{}'})).status,401);
  await app.close();app=startServer({port:0,dataPath:path});await once(app.http,'listening');base=`http://127.0.0.1:${app.http.address().port}`;
  assert.equal((await call(a,'list_open_loops')).body.structuredContent.loops[0].id,loop.id);
  assert.equal((await call(a,'delete_open_loop',{id:loop.id,confirmed:true})).status,200);
  assert.equal((await call(a,'export_open_loops')).body.structuredContent.loops.length,0);
 }finally{await app.close();rmSync(dir,{recursive:true,force:true});}
});
test('Echte MCP-Verbindungen: Tools, Resource, Hauptablauf und getrennte Sitzungen',async()=>{
 const app=startServer({port:0,dataPath:':memory:'});await once(app.http,'listening');const url=new URL(`http://127.0.0.1:${app.http.address().port}/mcp`);
 const clients=[];const transports=[];
 async function connect(){const c=new Client({name:'dranbleib-test',version:'1.0'});const t=new StreamableHTTPClientTransport(url);clients.push(c);transports.push(t);await c.connect(t);return c;}
 try{
  const a=await connect(),b=await connect();const {tools}=await a.listTools();assert.equal(tools.length,9);
  assert.equal(tools.filter(t=>t._meta?.ui?.resourceUri).length,1);assert.equal(tools.find(t=>t.name==='delete_open_loop').annotations.destructiveHint,true);
  assert.equal(tools.find(t=>t.name==='draft_followup').annotations.readOnlyHint,true);
  for(const tool of tools){assert.ok(tool.outputSchema);assert.deepEqual(tool._meta.securitySchemes,[{type:'noauth'}]);}
  const resources=await a.listResources();const resource=await a.readResource({uri:resources.resources[0].uri});assert.match(resource.contents[0].mimeType,/text\/html/);assert.match(resource.contents[0].text,/ui\/initialize/);
  const invoke=(c,name,args={})=>c.callTool({name,arguments:args});
  const proposal=(await invoke(a,'preview_open_loop',{text:'Könnten Sie das Angebot bis Freitag schicken?'})).structuredContent.proposal;
  assert.equal((await invoke(b,'capture_open_loop',{proposalId:proposal.proposalId,fields:proposal.fields,confirmed:true})).isError,true);
  const loop=(await invoke(a,'capture_open_loop',{proposalId:proposal.proposalId,fields:proposal.fields,confirmed:true})).structuredContent.loop;
  assert.equal((await invoke(b,'list_open_loops')).structuredContent.loops.length,0);
  assert.equal((await invoke(b,'get_open_loop',{id:loop.id})).isError,true);
  assert.equal((await invoke(a,'update_open_loop',{id:loop.id,changes:{status:'wartend'},confirmed:true})).structuredContent.loop.status,'wartend');
  assert.equal((await invoke(a,'list_open_loops',{filter:'wartend'})).structuredContent.loops.length,1);
  assert.ok((await invoke(a,'draft_followup',{id:loop.id})).structuredContent.draft);
  assert.equal((await invoke(a,'render_dranbleib')).structuredContent.loops.length,1);
  assert.equal((await invoke(a,'delete_open_loop',{id:loop.id,confirmed:false})).isError,true);
  await invoke(a,'delete_open_loop',{id:loop.id,confirmed:true});assert.equal((await invoke(a,'list_open_loops')).structuredContent.loops.length,0);
  const last=(await invoke(a,'preview_open_loop',{text:'Bitte Antwort senden.'})).structuredContent.proposal;
  await invoke(a,'capture_open_loop',{proposalId:last.proposalId,fields:last.fields,confirmed:true});
  assert.equal(app.mcpStore.db.prepare('SELECT COUNT(*) AS n FROM loops').get().n,1);
  await transports[0].terminateSession();
  assert.equal(app.mcpStore.db.prepare('SELECT COUNT(*) AS n FROM loops').get().n,0);
 }finally{for(const t of transports){try{await t.terminateSession();}catch{}}for(const c of clients)await c.close();await app.close();}
});
