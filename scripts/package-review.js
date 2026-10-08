import { execFileSync } from 'node:child_process';
import { mkdirSync, readdirSync, statSync, existsSync } from 'node:fs';
import { resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const files=['README.md','package.json','package-lock.json','.env.example','.gitignore'];
function collect(directory){for(const entry of readdirSync(resolve(root,directory))){if(entry==='__pycache__' || /\.py[co]$/.test(entry))continue;const path=`${directory}/${entry}`;if(statSync(resolve(root,path)).isDirectory())collect(path);else files.push(path);}}
for(const directory of ['src','public','test','scripts','docs','submission','deployment'])collect(directory);
for(const path of ['artifacts/dranbleib-mobile.png','artifacts/dranbleib-mcp-host.png','artifacts/dranbleib-oauth-consent.png'])if(existsSync(resolve(root,path)))files.push(path);
if(files.some(p=>/(^|\/)(data|node_modules|\.git)(\/|$)|\.sqlite|(^|\/)\.env(?!\.example$)/.test(p)))throw new Error('Nicht erlaubte Datei im Paket.');
mkdirSync(resolve(root,'artifacts'),{recursive:true});
const output=resolve(root,'artifacts/dranbleib-review-preparation.zip');
// Explicit allowlist, no git history, runtime data or environment dumps.
if(existsSync(output)){const {unlinkSync}=await import('node:fs');unlinkSync(output);}
execFileSync('zip',['-q',output,'-@'],{cwd:root,input:files.join('\n')+'\n'});
console.log(`Vorbereitungspaket: ${relative(root,output)} (${files.length} Dateien). Nicht einreichungsbereit; siehe submission/CHECKLIST.md.`);
