import https from 'node:https';
import http from 'node:http';
import {readFileSync,realpathSync,existsSync} from 'node:fs';
import {X509Certificate,createPrivateKey,createPublicKey} from 'node:crypto';
import {fileURLToPath} from 'node:url';
export function loadTls(directory,hostname){
 const cert=readFileSync(directory+'/fullchain.pem'),key=readFileSync(directory+'/privkey.pem'),x=new X509Certificate(cert);
 const matches=/^[0-9.]+$/.test(hostname)?x.checkIP(hostname):x.checkHost(hostname);
 if(!matches||Date.parse(x.validTo)<=Date.now()||Date.parse(x.validFrom)>Date.now())throw new Error('TLS certificate does not match or is not valid.');
 const privatePublic=createPublicKey(createPrivateKey(key)).export({type:'spki',format:'der'}),certificatePublic=x.publicKey.export({type:'spki',format:'der'});
 if(!privatePublic.equals(certificatePublic))throw new Error('TLS key mismatch.');
 return {cert,key,expires:x.validTo};
}
export function startHttpsProxy({origin=process.env.PUBLIC_ORIGIN,tlsDirectory=process.env.TLS_DIR,port=Number(process.env.HTTPS_PORT??8443),backendPort=Number(process.env.BACKEND_PORT??8791)}={}){
 const u=new URL(origin);if(u.protocol!=='https:'||u.pathname!=='/'||u.search||u.hash||u.username||u.password)throw new Error('Canonical HTTPS origin required.');
 let tls=loadTls(tlsDirectory,u.hostname);
 const server=https.createServer({...tls,minVersion:'TLSv1.2'},(req,res)=>{
  if(req.headers.host!==u.host||!req.url.startsWith('/')||req.url.startsWith('//')){res.writeHead(403);res.end();return;}
  if(!['GET','HEAD','POST','DELETE','OPTIONS'].includes(req.method)){res.writeHead(405);res.end();return;}
  const headers={...req.headers,host:u.host};for(const h of ['forwarded','x-forwarded-for','x-forwarded-host','x-forwarded-proto','connection','proxy-authorization','proxy-connection'])delete headers[h];
  const upstream=http.request({host:'127.0.0.1',port:backendPort,path:req.url,method:req.method,headers},r=>{const responseHeaders={...r.headers};delete responseHeaders.connection;res.writeHead(r.statusCode,responseHeaders);r.pipe(res);});
  upstream.on('error',()=>{if(!res.headersSent)res.writeHead(502);res.end();});
  let bytes=0;req.on('data',chunk=>{bytes+=chunk.length;if(bytes>100000){upstream.destroy();if(!res.headersSent)res.writeHead(413);res.end();req.destroy();}});
  req.on('aborted',()=>upstream.destroy());res.on('close',()=>upstream.destroy());req.pipe(upstream);
 });
 server.requestTimeout=30000;server.headersTimeout=10000;server.maxConnections=150;
 const timer=setInterval(()=>{try{const current=loadTls(tlsDirectory,u.hostname);if(!current.cert.equals(tls.cert)||!current.key.equals(tls.key)){server.setSecureContext({...current,minVersion:'TLSv1.2'});tls=current;}}catch{console.error('TLS refresh failed; retaining previous certificate.');}},60000);timer.unref();
 server.listen(port,'0.0.0.0');return {server,close:async()=>{clearInterval(timer);await new Promise(r=>server.close(r));}};
}
if(process.argv[1]&&existsSync(process.argv[1])&&realpathSync(process.argv[1])===fileURLToPath(import.meta.url)){const proxy=startHttpsProxy();for(const sig of ['SIGTERM','SIGINT'])process.on(sig,async()=>{await proxy.close();process.exit(0);});}
