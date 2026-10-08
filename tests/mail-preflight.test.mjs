import test from 'node:test';
import assert from 'node:assert/strict';
import { checkMailAccess } from '../scripts/mail-preflight.mjs';

const settings = { CLOUDFLARE_ACCOUNT_ID:'a'.repeat(32), CLOUDFLARE_API_TOKEN:'proxy-placeholder-cloudflare', RESEND_API_KEY:'proxy-placeholder-resend' };
test('invalid account ID prevents any deployment API calls', async () => {
  let calls = 0;
  await assert.rejects(checkMailAccess({...settings,CLOUDFLARE_ACCOUNT_ID:'not-an-id'},async()=>{calls++;}),/32-character Account ID/);
  assert.equal(calls,0);
});
test('authorization failures stop before proceeding to another service and redact credentials', async () => {
  let calls = 0;
  await assert.rejects(checkMailAccess(settings,async()=>{calls++;return Response.json({success:false,errors:[{message:`Invalid token ${settings.CLOUDFLARE_API_TOKEN}`}]},{status:400});}),error=>error.message.includes('Cloudflare rejected') && error.message.includes('[redacted]') && !error.message.includes(settings.CLOUDFLARE_API_TOKEN));
  assert.equal(calls,1);
});
test('Resend authentication rejection is not mistaken for a limited sending key', async () => {
  await assert.rejects(checkMailAccess(settings,async url=>url.includes('cloudflare')?Response.json({success:true}):Response.json({name:'validation_error',message:'API key is invalid'},{status:400})),/Resend rejected access: API key is invalid/);
});
test('proxy placeholders are passed through the supported HTTPS routes and sending-only keys are accepted', async () => {
  const calls=[];
  await checkMailAccess(settings,async(url,options)=>{calls.push({url,authorization:options.headers.Authorization});return url.includes('cloudflare')?Response.json({success:true}):Response.json({name:'restricted_api_key'},{status:403});});
  assert.equal(calls.length,2);
  assert.equal(calls[0].authorization,`Bearer ${settings.CLOUDFLARE_API_TOKEN}`);
  assert.equal(calls[1].authorization,`Bearer ${settings.RESEND_API_KEY}`);
  assert.ok(calls.every(call=>call.url.startsWith('https://')));
});
