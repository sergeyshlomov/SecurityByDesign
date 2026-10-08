// Deploy only after verification. Secrets travel through stdin, never CLI arguments or files.
import { spawn } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { setGlobalProxyFromEnv } from 'node:http';
import { checkMailAccess } from './mail-preflight.mjs';

// Node fetch must use the platform's HTTPS proxy, with normal TLS verification.
setGlobalProxyFromEnv();
const senderArgs = process.env.MAIL_FROM ? ['--var', `MAIL_FROM:${process.env.MAIL_FROM}`] : [];
function run(args,input){return new Promise((resolve,reject)=>{
  const child=spawn(process.execPath,['node_modules/wrangler/bin/wrangler.js',...args],{stdio:['pipe','pipe','pipe'],env:{...process.env,CI:'true',WRANGLER_SEND_METRICS:'false',XDG_CONFIG_HOME:resolve('.local/config')}});
  let output='';child.stdout.on('data',chunk=>{output+=chunk;});child.stderr.on('data',()=>{});
  if(input)child.stdin.write(input+'\n');child.stdin.end();
  child.on('error',reject);child.on('close',code=>code===0?resolve(output):reject(new Error(`Wrangler ${args[0]} failed (exit ${code}). Check account access, network and configuration.`)));
});}
try {
  await checkMailAccess(process.env);
  await run(['deploy','--dry-run','--outdir','.local/worker',...senderArgs]);
  const output=await run(['deploy',...senderArgs]);
  const url=output.match(/https:\/\/security-by-design-contact\.[a-z0-9-]+\.workers\.dev/i)?.[0];
  if(!url)throw new Error('Worker readiness could not be confirmed: its deployment URL was not detected. The website configuration has not been changed.');
  await run(['secret','put','RESEND_API_KEY'],process.env.RESEND_API_KEY);
  const health=await fetch(`${url}/health`);
  if(!health.ok || !(await health.json()).mailConfigured)throw new Error('Worker is not mail-ready. Check its secret and sender configuration.');
  await writeFile('public/site-config.json',JSON.stringify({contactEndpoint:`${url}/api/contact`})+'\n');
  console.log(`Worker ready: ${url}. Contact endpoint saved. Build, run tests and publish the frontend again before claiming live email delivery.`);
} catch(error){console.error(error.message);process.exit(1);}
