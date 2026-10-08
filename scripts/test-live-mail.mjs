// Sends one explicitly identified test enquiry to the site's fixed recipient.
import { setGlobalProxyFromEnv } from 'node:http';
setGlobalProxyFromEnv();
const site = 'https://sergeyshlomov.github.io/SecurityByDesign/';
try {
  const configResponse = await fetch(`${site}site-config.json`, { cache:'no-store', signal:AbortSignal.timeout(15000) });
  if (!configResponse.ok) throw new Error('Published site configuration is unavailable.');
  const config = await configResponse.json();
  if (!config.contactEndpoint) throw new Error('The published website has no contact endpoint. Deploy the Worker and publish the configured frontend first.');
  const endpoint = new URL(config.contactEndpoint);
  if (endpoint.protocol !== 'https:') throw new Error('The contact endpoint must use HTTPS.');
  const origin = new URL(site).origin;
  const preflight = await fetch(endpoint, { method:'OPTIONS', headers:{ Origin:origin, 'Access-Control-Request-Method':'POST', 'Access-Control-Request-Headers':'content-type' }, signal:AbortSignal.timeout(15000) });
  if (!preflight.ok || preflight.headers.get('Access-Control-Allow-Origin') !== origin) throw new Error('The mail server does not allow requests from the published website.');
  const time = new Intl.DateTimeFormat('en-GB',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Jerusalem'}).format(new Date());
  const response = await fetch(endpoint, { method:'POST', headers:{ Origin:origin, 'Content-Type':'application/json' }, body:JSON.stringify({name:'Website delivery check',email:'shlomovs@gmail.com',message:`Authorized test enquiry from the SecurityByDesign contact form. ${time} (Israel time). This checks server-side email delivery; no action is required.`,interest:3,lang:'en',website:''}), signal:AbortSignal.timeout(18000) });
  const result = await response.json();
  if (!response.ok || !result.ok || result.code !== 'ACCEPTED') throw new Error(`Live mail check failed: HTTP ${response.status}, ${result.code || 'unknown response'}.`);
  console.log('PASS: the published endpoint accepted one test enquiry for shlomovs@gmail.com. Check the inbox or Resend delivery event to confirm arrival.');
} catch(error) { console.error(error.message);process.exit(1); }
