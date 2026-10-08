import { randomBytes, randomUUID, createHash, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { InvalidGrantError, InvalidScopeError, InvalidRequestError, InvalidTokenError } from '@modelcontextprotocol/sdk/server/auth/errors.js';
const scrypt=promisify(scryptCallback);
const opaque=()=>randomBytes(32).toString('hex');
const digest=x=>createHash('sha256').update(x).digest('hex');
const now=()=>Math.floor(Date.now()/1000);
export const SCOPES=['loops:read','loops:write'];
export class OAuthProvider {
 constructor(store,origin){
  this.store=store;this.db=store.db;this.origin=new URL(origin).origin;this.resource=new URL('/mcp',this.origin).href;this.pending=new Map();
  this.db.exec(`CREATE TABLE IF NOT EXISTS auth_users (id TEXT PRIMARY KEY,name TEXT UNIQUE NOT NULL,salt TEXT NOT NULL,password_hash TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS auth_clients (id TEXT PRIMARY KEY,payload TEXT NOT NULL);
   CREATE TABLE IF NOT EXISTS auth_codes (hash TEXT PRIMARY KEY,payload TEXT NOT NULL,expires INTEGER NOT NULL);
   CREATE TABLE IF NOT EXISTS auth_tokens (hash TEXT PRIMARY KEY,type TEXT NOT NULL,family TEXT NOT NULL,payload TEXT NOT NULL,expires INTEGER NOT NULL);
   CREATE TABLE IF NOT EXISTS auth_spent_refresh (hash TEXT PRIMARY KEY,family TEXT NOT NULL,client_id TEXT NOT NULL,expires INTEGER NOT NULL);`);
  this.clientsStore={getClient:id=>{const row=this.db.prepare('SELECT payload FROM auth_clients WHERE id=?').get(id);return row?JSON.parse(row.payload):undefined;},registerClient:async c=>{
   if(this.db.prepare('SELECT count(*) AS n FROM auth_clients').get().n>=500)throw new InvalidRequestError('Client limit reached.');
   for(const uri of c.redirect_uris??[]){const u=new URL(uri);if(u.hash || u.username || u.password || !(u.protocol==='https:' || (u.protocol==='http:' && ['localhost','127.0.0.1','[::1]'].includes(u.hostname))))throw new InvalidRequestError('HTTPS redirect required.');}
   const client={redirect_uris:c.redirect_uris,client_name:String(c.client_name??'OAuth client').slice(0,80),client_id:randomUUID(),client_id_issued_at:now(),token_endpoint_auth_method:'none',grant_types:['authorization_code','refresh_token'],response_types:['code']};delete client.client_secret;delete client.client_secret_expires_at;
   this.db.prepare('INSERT INTO auth_clients VALUES (?,?)').run(client.client_id,JSON.stringify(client));return client;
  }};
 }
 owner(userId){return 'oauth:'+digest(this.origin+'\0'+userId);}
 prune(){this.db.prepare('DELETE FROM auth_codes WHERE expires<=?').run(now());this.db.prepare('DELETE FROM auth_spent_refresh WHERE expires<=?').run(now());this.db.prepare('DELETE FROM auth_tokens WHERE expires<=?').run(now());for(const [id,p] of this.pending)if(p.expires<=now())this.pending.delete(id);}
 async createUser(name,password){
  name=String(name).toLowerCase();if(!/^[a-z0-9._-]{3,40}$/.test(name) || typeof password!=='string' || password.length<12 || password.length>128)throw new InvalidRequestError('Username: 3–40 letters/digits; password: 12–128 characters.');
  if(this.db.prepare('SELECT count(*) AS n FROM auth_users').get().n>=500)throw new InvalidRequestError('Account limit reached.');
  const salt=opaque(),hash=(await scrypt(password,salt,64)).toString('hex'),id=randomUUID();
  try{this.db.prepare('INSERT INTO auth_users VALUES (?,?,?,?)').run(id,name,salt,hash);}catch{throw new InvalidRequestError('Account could not be created.');}return id;
 }
 async login(name,password){
  if(typeof name!=='string'||typeof password!=='string'||password.length>128)return null;
  const user=this.db.prepare('SELECT * FROM auth_users WHERE name=?').get(name.toLowerCase());
  const salt=user?.salt??'dummy-salt-for-constant-work';const hash=await scrypt(password,salt,64);
  const expected=user?Buffer.from(user.password_hash,'hex'):Buffer.alloc(64);
  return user && timingSafeEqual(hash,expected)?user.id:null;
 }
 async authorize(client,params,res){
  this.prune();if(params.resource?.href!==this.resource)throw new InvalidRequestError('Incorrect resource.');
  if(!params.scopes?.includes('loops:read') || params.scopes.some(s=>!SCOPES.includes(s)))throw new InvalidScopeError('Use loops:read and optionally loops:write.');
  if(!/^[A-Za-z0-9_-]{43}$/.test(params.codeChallenge))throw new InvalidRequestError('S256 PKCE required.');
  if(this.pending.size>=500)throw new InvalidRequestError('Too many pending requests.');
  const id=opaque();this.pending.set(id,{clientId:client.client_id,clientName:client.client_name??new URL(params.redirectUri).hostname,...params,resource:params.resource.href,expires:now()+600,csrf:null});
  res.redirect(new URL('/consent?request='+id,this.origin).href);
 }
 approve(id,userId,approved){
  const p=this.pending.get(id);if(!p || p.expires<=now())throw new InvalidGrantError('Authorization expired.');
  this.pending.delete(id);const target=new URL(p.redirectUri);if(p.state)target.searchParams.set('state',p.state);
  if(!approved){target.searchParams.set('error','access_denied');return target.href;}
  if(!this.db.prepare('SELECT id FROM auth_users WHERE id=?').get(userId))throw new InvalidGrantError('User not found.');
  const code=opaque();this.db.prepare('INSERT INTO auth_codes VALUES (?,?,?)').run(digest(code),JSON.stringify({...p,userId}),now()+60);target.searchParams.set('code',code);return target.href;
 }
 code(client,code){const row=this.db.prepare('SELECT * FROM auth_codes WHERE hash=?').get(digest(code));if(!row||row.expires<=now())throw new InvalidGrantError('Code invalid or expired.');const data=JSON.parse(row.payload);if(data.clientId!==client.client_id)throw new InvalidGrantError('Client mismatch.');return data;}
 async challengeForAuthorizationCode(client,code){return this.code(client,code).codeChallenge;}
 issue(data,family=opaque()){
  const access=opaque(),refresh=opaque();
  this.db.prepare('INSERT INTO auth_tokens VALUES (?,?,?,?,?)').run(digest(access),'access',family,JSON.stringify(data),now()+600);
  this.db.prepare('INSERT INTO auth_tokens VALUES (?,?,?,?,?)').run(digest(refresh),'refresh',family,JSON.stringify(data),now()+7*86400);
  return {access_token:access,token_type:'Bearer',expires_in:600,refresh_token:refresh,scope:data.scopes.join(' ')};
 }
 async exchangeAuthorizationCode(client,code,_verifier,redirectUri,resource){
  const data=this.code(client,code);if(redirectUri!==data.redirectUri||resource?.href!==this.resource)throw new InvalidGrantError('Redirect or resource mismatch.');
  const removed=this.db.prepare('DELETE FROM auth_codes WHERE hash=?').run(digest(code));if(removed.changes!==1)throw new InvalidGrantError('Code consumed.');
  return this.issue({userId:data.userId,clientId:client.client_id,resource:this.resource,scopes:data.scopes});
 }
 async exchangeRefreshToken(client,token,scopes,resource){
  const spent=this.db.prepare('SELECT * FROM auth_spent_refresh WHERE hash=? AND client_id=?').get(digest(token),client.client_id);if(spent){this.db.prepare('DELETE FROM auth_tokens WHERE family=?').run(spent.family);throw new InvalidGrantError('Refresh replay; grant revoked.');}
  const row=this.db.prepare('SELECT * FROM auth_tokens WHERE hash=? AND type=?').get(digest(token),'refresh');if(!row||row.expires<=now())throw new InvalidGrantError('Refresh token invalid or expired.');
  const data=JSON.parse(row.payload);if(data.clientId!==client.client_id||resource?.href!==this.resource||scopes?.some(s=>!data.scopes.includes(s)))throw new InvalidGrantError('Refresh client/resource/scope mismatch.');
  if(!this.db.prepare('SELECT id FROM auth_users WHERE id=?').get(data.userId))throw new InvalidGrantError('Account deleted.');
  this.db.prepare('INSERT INTO auth_spent_refresh VALUES (?,?,?,?)').run(digest(token),row.family,client.client_id,row.expires);this.db.prepare('DELETE FROM auth_tokens WHERE family=?').run(row.family);return this.issue({...data,scopes:scopes??data.scopes},row.family);
 }
 async verifyAccessToken(token){
  const row=this.db.prepare('SELECT * FROM auth_tokens WHERE hash=? AND type=?').get(digest(token),'access');if(!row||row.expires<=now())throw new InvalidTokenError('Token invalid or expired.');const data=JSON.parse(row.payload);
  if(data.resource!==this.resource||!this.db.prepare('SELECT id FROM auth_users WHERE id=?').get(data.userId))throw new InvalidTokenError('Invalid resource/account.');
  return {token,clientId:data.clientId,scopes:data.scopes,expiresAt:row.expires,resource:new URL(this.resource),extra:{owner:this.owner(data.userId)}};
 }
 async revokeToken(client,request){const row=this.db.prepare('SELECT * FROM auth_tokens WHERE hash=?').get(digest(request.token));if(row&&JSON.parse(row.payload).clientId===client.client_id)this.db.prepare('DELETE FROM auth_tokens WHERE family=?').run(row.family);}
 deleteUser(userId){for(const row of this.db.prepare('SELECT hash,payload FROM auth_codes').all())if(JSON.parse(row.payload).userId===userId)this.db.prepare('DELETE FROM auth_codes WHERE hash=?').run(row.hash);this.store.forget(this.owner(userId));this.db.prepare('DELETE FROM auth_users WHERE id=?').run(userId);for(const row of this.db.prepare('SELECT hash,payload FROM auth_tokens').all())if(JSON.parse(row.payload).userId===userId)this.db.prepare('DELETE FROM auth_tokens WHERE hash=?').run(row.hash);}
}
