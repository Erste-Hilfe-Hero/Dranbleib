// Operator-only CLI. Never prints passwords or tokens. Not an HTTP endpoint.
import {parseArgs} from 'node:util';
import {randomBytes} from 'node:crypto';
import {mkdirSync,writeFileSync,readFileSync,existsSync,unlinkSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import {Store} from '../src/domain.js';
import {OAuthProvider} from '../src/oauth.js';
const {values}=parseArgs({options:{data:{type:'string'},origin:{type:'string'},name:{type:'string'},'credentials-out':{type:'string'},count:{type:'string',default:'1'},'seed-demo':{type:'boolean',default:false},'cleanup-test-credentials':{type:'string'}}});
if(!values.data||!values.origin)throw new Error('Use --data and --origin.');
if(values['credentials-out']&&resolve(values['credentials-out']).startsWith(resolve(new URL('../',import.meta.url).pathname)+'/'))throw new Error('Credentials must be outside the project tree.');
const count=Number(values.count);if(!Number.isInteger(count)||count<1||count>2)throw new Error('Count must be 1 or 2.');
process.umask(0o077);
if(values['credentials-out']&&existsSync(values['credentials-out']))throw new Error('Refusing to overwrite credentials.');
const store=new Store(values.data),provider=new OAuthProvider(store,values.origin),created=[];
try{
 if(values['cleanup-test-credentials']){
  const saved=JSON.parse(readFileSync(values['cleanup-test-credentials'],'utf8'));
  for(const a of saved.accounts){if(!/^test-[a-f0-9]{16}$/.test(a.name))throw new Error('Not a generated test account.');const id=await provider.login(a.name,a.password);if(id)provider.deleteUser(id);}
  unlinkSync(values['cleanup-test-credentials']);
 }else for(let n=0;n<count;n++){
  const name=values.name??'test-'+randomBytes(8).toString('hex');
  const password=values['credentials-out']?randomBytes(32).toString('hex'):readFileSync(0,'utf8').replace(/\r?\n$/,'');
  const id=await provider.createUser(name,password);created.push({id,name,password});
  if(values['seed-demo']){
   for(const entry of [{text:'Demo: Bitte senden Sie das aktualisierte Angebot bis 2026-10-12.',title:'Demo – Angebot nachhalten',status:'wartend',waitingOn:'Ich warte auf den Demoanbieter',nextAction:'Am bestätigten Termin den Demostand prüfen.'},{text:'Demo-Behördenbrief: Ein Rechtsbehelf ist binnen 14 Tagen nach Zustellung möglich.',title:'Demo – Brief und Zustellung prüfen',status:'offen',waitingOn:'Zustelldatum und Wortlaut fehlen',nextAction:'Original und Zustelldatum prüfen; keine verbindliche Fristberechnung.'}]){const owner=provider.owner(id),proposal=store.execute(owner,'preview_open_loop',{text:entry.text,sourceType:entry.title.includes('Brief')?'brief':'notiz'}).proposal;const {text,title,status,waitingOn,nextAction}=entry;store.execute(owner,'capture_open_loop',{proposalId:proposal.proposalId,fields:{...proposal.fields,title,status,waitingOn,nextAction,party:'Synthetischer Demoanbieter'},confirmed:true});}
  }
 }
 if(values['credentials-out']){mkdirSync(dirname(values['credentials-out']),{recursive:true,mode:0o700});writeFileSync(values['credentials-out'],JSON.stringify({accounts:created.map(({name,password})=>({name,password}))}),{mode:0o600,flag:'wx'});}
 console.log('Test account created. Credentials remain in operator input/private file.');
}catch{for(const {id} of created)provider.deleteUser(id);process.exitCode=1;console.error('Account creation failed; no credentials printed.');}finally{store.close();}
