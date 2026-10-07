// Deploy only after verification. Secrets travel through stdin, never CLI arguments or files.
import { spawn } from 'node:child_process';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const missing=['CLOUDFLARE_API_TOKEN','CLOUDFLARE_ACCOUNT_ID','RESEND_API_KEY'].filter(name=>!process.env[name]);
if(missing.length){console.error(`Deployment blocked: configure secure environment settings for ${missing.join(', ')}.`);process.exit(1);}
function run(args,input){return new Promise((resolve,reject)=>{
  const child=spawn('npx',['wrangler',...args],{stdio:['pipe','pipe','pipe'],env:{...process.env,CI:'true',WRANGLER_SEND_METRICS:'false',XDG_CONFIG_HOME:resolve('.local/config')}});
  let output='';child.stdout.on('data',chunk=>{output+=chunk;});child.stderr.on('data',()=>{});
  if(input)child.stdin.write(input+'\n');child.stdin.end();
  child.on('error',reject);child.on('exit',code=>code===0?resolve(output):reject(new Error(`Wrangler ${args[0]} failed (exit ${code}). Check account access, network and configuration.`)));
});}
try {
  await run(['deploy','--dry-run','--outdir','.local/worker']);
  const output=await run(['deploy']);
  await run(['secret','put','RESEND_API_KEY'],process.env.RESEND_API_KEY);
  const url=output.match(/https:\/\/security-by-design-contact\.[a-z0-9-]+\.workers\.dev/i)?.[0];
  if(!url)throw new Error('Worker deployment completed but its URL was not detected. Verify the Cloudflare dashboard before configuring the website.');
  const health=await fetch(`${url}/health`);
  if(!health.ok || !(await health.json()).mailConfigured)throw new Error('Worker is not mail-ready. Check its secret and sender configuration.');
  await writeFile('public/site-config.json',JSON.stringify({contactEndpoint:`${url}/api/contact`})+'\n');
  console.log(`Worker ready: ${url}. Contact endpoint saved. Build, run tests and publish the frontend again before claiming live email delivery.`);
} catch(error){console.error(error.message);process.exit(1);}
