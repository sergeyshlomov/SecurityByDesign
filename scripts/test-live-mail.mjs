// Sends one explicitly identified test enquiry to the site's fixed recipient.
import { setGlobalProxyFromEnv } from 'node:http';
import { sendContact } from '../src/contact-client.js';
setGlobalProxyFromEnv();
const site = 'https://sergeyshlomov.github.io/SecurityByDesign/';
try {
  const configResponse = await fetch(`${site}site-config.json`, { cache:'no-store', signal:AbortSignal.timeout(15000) });
  if (!configResponse.ok) throw new Error('Published site configuration is unavailable.');
  const config = await configResponse.json();
  if (!config.contactEndpoint) throw new Error('The published website has no contact endpoint. Publish the configured frontend first.');
  const endpoint = new URL(config.contactEndpoint);
  if (endpoint.protocol !== 'https:') throw new Error('The contact endpoint must use HTTPS.');
  const origin = new URL(site).origin;
  const headers = { Origin:origin, Referer:site, 'User-Agent':'SecurityByDesign/1.0' };
  const preflight = await fetch(endpoint, { method:'OPTIONS', headers:{ ...headers, 'Access-Control-Request-Method':'POST', 'Access-Control-Request-Headers':'content-type' }, signal:AbortSignal.timeout(15000) });
  if (!preflight.ok || ![origin,'*'].includes(preflight.headers.get('Access-Control-Allow-Origin'))) throw new Error('The mail service does not allow requests from the published website.');
  const time = new Intl.DateTimeFormat('en-GB',{dateStyle:'medium',timeStyle:'short',timeZone:'Asia/Jerusalem'}).format(new Date());
  const result = await sendContact(config,{name:'Website delivery check',email:'shlomovs@gmail.com',message:`Authorized test enquiry from the SecurityByDesign contact form. ${time} (Israel time). This checks email delivery from the published form.`,interest:3,topic:'Contact delivery check',lang:'en',website:''},{pageUrl:site,fetchRequest:(url,init)=>fetch(url,{...init,headers:{...init.headers,...headers}})});
  if (result.code==='MAIL_ACTIVATION_REQUIRED') throw new Error('FormSubmit sent an Activate Form email to the recipient. Owner verification is still required; no delivery is claimed.');
  if (!result.ok) throw new Error(`Live mail check failed: ${result.code}.`);
  console.log('PASS: the published endpoint accepted one test enquiry for shlomovs@gmail.com. Inbox arrival must still be confirmed before claiming delivery.');
} catch(error) { console.error(error.message);process.exit(1); }
