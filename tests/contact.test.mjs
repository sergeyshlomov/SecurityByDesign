import test from 'node:test';
import assert from 'node:assert/strict';
import { handleContact } from '../server/contact.js';
import worker from '../server/worker.js';

const valid = { name:'Сергей Test',email:'shlomovs@gmail.com',message:'בדיקת טופס / Проверка формы',interest:0,lang:'he',website:'' };
const env = { ALLOWED_ORIGINS:'https://sergeyshlomov.github.io',RESEND_API_KEY:'test-provider-key',MAIL_FROM:'Sergey <onboarding@resend.dev>' };
const request = (body=valid, headers={}, method='POST') => new Request('https://contact.example/api/contact',{method,headers:{Origin:'https://sergeyshlomov.github.io','Content-Type':'application/json',...headers},...(['GET','OPTIONS'].includes(method)?{}:{body:typeof body === 'string'?body:JSON.stringify(body)})});
const options = {limiter:async()=>true,fetchMail:async()=>Response.json({id:'test-only-message-id'})};

test('valid multilingual enquiry sends only to Sergey, with fixed subject and safe reply-to',async()=>{
  let sent;
  const result = await handleContact(request({...valid,to:'attacker@example.com',subject:'client-controlled'}),env,{...options,fetchMail:async(url,init)=>{assert.equal(url,'https://api.resend.com/emails');sent=JSON.parse(init.body);return Response.json({id:'test-only-message-id'});}});
  assert.equal(result.status,200);assert.deepEqual(await result.json(),{ok:true,code:'ACCEPTED'});
  assert.deepEqual(sent.to,['shlomovs@gmail.com']);assert.equal(sent.reply_to,valid.email);assert.equal(sent.subject,'Website enquiry: Cybersecurity / CISO');assert.ok(sent.text.includes(valid.message));
});
test('input checks reject invalid, oversized and header-injection payloads before delivery',async()=>{
  let calls=0;
  for(const data of [{...valid,name:''},{...valid,email:'wrong'},{...valid,email:'x@example.com\r\nBcc:a@example.com'},{...valid,name:'test\nBcc:x'},{...valid,message:''},{...valid,message:'x'.repeat(4001)},{...valid,interest:8},{...valid,interest:1.5},{...valid,website:'bot'},'bad JSON',null]) {
    const response=await handleContact(request(data),env,{...options,fetchMail:async()=>{calls++;}});assert.equal(response.status,400);
  }
  assert.equal((await handleContact(request('x'.repeat(12001)),env,options)).status,413);assert.equal(calls,0);
});
test('origin, method, content type and preflight restrictions',async()=>{
  assert.equal((await handleContact(request(valid,{Origin:'https://other.example'}),env,options)).status,403);
  assert.equal((await handleContact(request(valid,{Origin:''}),env,options)).status,403);
  assert.equal((await handleContact(request(valid,{},'GET'),env,options)).status,405);
  assert.equal((await handleContact(request(valid,{'Content-Type':'text/plain'}),env,options)).status,415);
  const preflight=await handleContact(request(valid,{},'OPTIONS'),env,options);assert.equal(preflight.status,200);assert.equal(preflight.headers.get('Access-Control-Allow-Origin'),'https://sergeyshlomov.github.io');
});
test('rate limit prevents provider calls; absent mail configuration cannot report success',async()=>{
  assert.equal((await handleContact(request(),env,{...options,limiter:async()=>false})).status,429);
  const unavailable=await handleContact(request(),{...env,RESEND_API_KEY:''},options);assert.equal(unavailable.status,503);assert.equal((await unavailable.json()).ok,false);
});
test('provider rejection, malformed success and network failure all produce truthful errors',async()=>{
  for(const fetchMail of [async()=>Response.json({message:'rejected'},{status:403}),async()=>Response.json({}),async()=>{throw new Error('connection failure');}]) {
    const response=await handleContact(request(),env,{...options,fetchMail});assert.equal(response.status,502);assert.deepEqual(await response.json(),{ok:false,code:'DELIVERY_FAILED'});
  }
});
test('worker requires production rate-limit binding and exposes honest readiness',async()=>{
  assert.equal((await worker.fetch(request(),env)).status,429);
  const health=await worker.fetch(new Request('https://contact.example/health'),{});assert.equal((await health.json()).mailConfigured,false);
  assert.equal((await worker.fetch(new Request('https://contact.example/missing'),{})).status,404);
});
