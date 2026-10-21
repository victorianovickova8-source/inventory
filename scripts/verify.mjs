import assert from 'node:assert/strict';
import {readFile,readdir,lstat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),files=[];
async function visit(relative=''){
 for(const name of await readdir(new URL(relative,root))){
  if(name==='.git'||name==='__pycache__')continue;
  const path=relative+name,info=await lstat(new URL(path,root));
  assert(!info.isSymbolicLink(),'Symlink is not allowed: '+path);
  if(info.isDirectory())await visit(path+'/');else files.push(path);
 }
}
await visit();
const allowed=new Set(['.gitignore','package.json','README.md','index.html','src/shell.html','src/demo.css','src/demo.js','scripts/build.mjs','scripts/serve.mjs','scripts/verify.mjs','tests/browser.py']);
for(const path of files){
 assert(allowed.has(path),'Unexpected file: '+path);
 const raw=await readFile(new URL(path,root));
 const text=new TextDecoder('utf-8',{fatal:true}).decode(raw);
 assert(!text.includes('\0'),'Binary content: '+path);
 assert(!/\b[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}\b/i.test(text),'Opaque identifier: '+path);
 assert(!/(?:github_pat_[A-Za-z0-9_]{20,}|gh[pousr]_[A-Za-z0-9]{20,}|sk-[A-Za-z0-9_-]{20,}|BEGIN [A-Z ]*PRIVATE KEY)/.test(text),'Sensitive value pattern: '+path);
 for(const match of text.matchAll(/https?:\/\/[^\s'"<>`]+/g)){
  assert(/^http:\/\/(?:127\.0\.0\.1|localhost)(?::\d*)?(?:[\/)]|$)/.test(match[0]),'External address: '+path);
 }
}
assert.equal(files.length,allowed.size,'Incomplete file set');
const html=await readFile(new URL('index.html',root),'utf8'),style=await readFile(new URL('src/demo.css',root),'utf8'),script=await readFile(new URL('src/demo.js',root),'utf8');
assert.equal(html.match(/<style>([\s\S]*?)<\/style>/)[1],style,'Built CSS differs from source');
assert.equal(html.match(/<script>([\s\S]*?)<\/script>/)[1],script,'Built JavaScript differs from source');
for(const source of [style,script])assert(html.includes("'sha256-"+createHash('sha256').update(source).digest('base64')+"'"),'Invalid content policy hash');
assert(html.includes("connect-src 'none'")&&html.includes("form-action 'none'"));
assert(!/\b(?:fetch|XMLHttpRequest|WebSocket|EventSource|Worker)\s*\(/.test(script),'Network operation in client');
assert(!/localStorage|sessionStorage|indexedDB|serviceWorker|sendBeacon|document\.cookie/.test(script),'Persistence or background activity in client');
assert(!/<(?:iframe|object|embed)\b|<script[^>]+src=|<link[^>]+rel=["']stylesheet/.test(html),'External resource element');
assert(!/__CSP__|__STYLE__|__SCRIPT__/.test(html));
const pkg=JSON.parse(await readFile(new URL('package.json',root),'utf8'));
assert.equal(pkg.private,true);assert(!pkg.dependencies&&!pkg.devDependencies);
console.log(`PASS ${files.length} UTF-8 files: strict file allowlist, no binaries/symlinks, identifier/secret/address patterns, exact built source, CSP hashes, no network or persistence APIs, no dependencies.`);
