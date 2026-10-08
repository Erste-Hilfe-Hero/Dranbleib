import {z} from 'zod';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import {readFileSync,writeFileSync,mkdirSync,mkdtempSync,copyFileSync,rmSync,realpathSync,existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {join,resolve} from 'node:path';
import {tmpdir} from 'node:os';
import {execFileSync} from 'node:child_process';
const ROOT=fileURLToPath(new URL('../',import.meta.url));
const filled=z.string().min(3).max(1000).refine(v=>!/(OFFEN|TODO|REQUIRED|example\.com|<[^>]+>)/i.test(v),'Tatsächliche Angabe erforderlich.');
const httpsUrl=filled.pipe(z.url()).refine(v=>new URL(v).protocol==='https:','HTTPS erforderlich.');
export const configSchema=z.object({providerName:filled,providerAddress:filled,supportEmail:filled.pipe(z.email()),websiteURL:httpsUrl,privacyPolicyURL:httpsUrl,termsOfServiceURL:httpsUrl,mcpURL:httpsUrl,recordingURL:httpsUrl,providerConfirmed:z.literal(true)}).strict();
export function buildMetadata(input){
 const c=configSchema.parse(input),plugin=JSON.parse(readFileSync(resolve(ROOT,'submission/plugin.template.json'),'utf8')),mcp=JSON.parse(readFileSync(resolve(ROOT,'submission/mcp.template.json'),'utf8'));
 plugin.author={name:c.providerName,email:c.supportEmail,url:c.websiteURL};plugin.homepage=c.websiteURL;plugin.repository='https://github.com/Erste-Hilfe-Hero/Dranbleib';
 Object.assign(plugin.extensions['com.openai'].interface,{developerName:c.providerName,websiteURL:c.websiteURL,supportURL:'https://github.com/Erste-Hilfe-Hero/Dranbleib/issues',privacyPolicyURL:c.privacyPolicyURL,termsOfServiceURL:c.termsOfServiceURL});
 plugin.extensions['com.openai'].review.demo_recording_url=c.recordingURL;mcp.mcpServers.dranbleib.url=c.mcpURL;
 const ajv=new Ajv2020({allErrors:true,strict:false});addFormats(ajv);
 for(const [name,value] of [['plugin',plugin],['mcp',mcp]]){const validate=ajv.compile(JSON.parse(readFileSync(resolve(ROOT,'docs/'+name+'.schema.json'),'utf8')));if(!validate(value))throw new Error(name+' does not match the official schema: '+ajv.errorsText(validate.errors));}
 return {plugin,mcp};
}
export function packageSubmission(configPath,out=resolve(ROOT,'artifacts/dranbleib-submission.zip')){
 const {plugin,mcp}=buildMetadata(JSON.parse(readFileSync(configPath,'utf8'))),temp=mkdtempSync(join(tmpdir(),'dranbleib-submission-'));
 const files=['plugin.json','mcp.json',...['icon.png','icon-dark.png','logo.png','logo-dark.png','screenshot.png'].map(n=>'assets/'+n)];
 try{mkdirSync(join(temp,'assets'));writeFileSync(join(temp,'plugin.json'),JSON.stringify(plugin,null,2));writeFileSync(join(temp,'mcp.json'),JSON.stringify(mcp,null,2));for(const file of files.filter(n=>n.startsWith('assets/')))copyFileSync(resolve(ROOT,file),join(temp,file));mkdirSync(resolve(out,'..'),{recursive:true});if(existsSync(out))throw new Error('Refusing to overwrite an existing submission package.');execFileSync('zip',['-q',out,'-@'],{cwd:temp,input:files.join('\n')+'\n'});return out;}finally{rmSync(temp,{recursive:true,force:true});}
}
if(process.argv[1]&&existsSync(process.argv[1])&&realpathSync(process.argv[1])===fileURLToPath(import.meta.url)){
 try{const config=process.argv[2];if(!config)throw new Error('Provide a completed operator configuration. See submission/provider.example.json.');console.log(packageSubmission(config));console.log('Schema-checked package prepared. This does not verify identity, legal texts, domain, ChatGPT behavior or OpenAI approval.');}catch(e){console.error(e instanceof z.ZodError?'Fehlende/ungültige Anbieterfelder: '+e.issues.map(i=>i.path.join('.')).join(', '):e.message);process.exitCode=1;}
}
