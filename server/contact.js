const recipient = 'shlomovs@gmail.com';
const topics = ['Cybersecurity / CISO', 'Enterprise IT / CIO', 'Technology / CTO', 'Project / enquiry'];
const maximumBody = 12000;

function reply(status, code, origin) {
  const headers = { 'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store', 'X-Content-Type-Options':'nosniff', 'Vary':'Origin' };
  if (origin) Object.assign(headers, { 'Access-Control-Allow-Origin':origin, 'Access-Control-Allow-Methods':'POST, OPTIONS', 'Access-Control-Allow-Headers':'Content-Type', 'Access-Control-Max-Age':'600' });
  return new Response(JSON.stringify({ ok:status === 200, code }), { status, headers });
}

export async function handleContact(request, env, { limiter, fetchMail = fetch } = {}) {
  const origin = request.headers.get('Origin');
  const allowed = (env.ALLOWED_ORIGINS || 'https://sergeyshlomov.github.io').split(',').map(s => s.trim());
  if (!origin || !allowed.includes(origin)) return reply(403, 'ORIGIN_DENIED');
  if (request.method === 'OPTIONS') return reply(200, 'PREFLIGHT', origin);
  if (request.method !== 'POST') return reply(405, 'METHOD_NOT_ALLOWED', origin);
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) return reply(415, 'INVALID_CONTENT_TYPE', origin);
  if (Number(request.headers.get('Content-Length') || 0) > maximumBody) return reply(413, 'TOO_LARGE', origin);
  let bytes = 0, parts = [];
  try {
    const reader = request.body?.getReader();
    if (!reader) return reply(400, 'INVALID_INPUT', origin);
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maximumBody) { await reader.cancel(); return reply(413, 'TOO_LARGE', origin); }
      parts.push(value);
    }
  } catch { return reply(400, 'INVALID_INPUT', origin); }
  let data;
  try { data = JSON.parse(new TextDecoder().decode(await new Blob(parts).arrayBuffer())); } catch { return reply(400, 'INVALID_INPUT', origin); }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return reply(400, 'INVALID_INPUT', origin);
  const name = typeof data.name === 'string' ? data.name.trim() : '';
  const email = typeof data.email === 'string' ? data.email.trim() : '';
  const message = typeof data.message === 'string' ? data.message.trim() : '';
  const interest = Number(data.interest);
  if (!name || name.length > 120 || /[\r\n\x00-\x1f]/.test(name) || email.length > 200 || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email) || !message || message.length > 4000 || !Number.isInteger(interest) || interest < 0 || interest > 3 || data.website) return reply(400, 'INVALID_INPUT', origin);
  // A recipient is never accepted from the client. Anonymous visitors cannot use this as an open relay.
  if (!limiter || !await limiter()) return reply(429, 'RATE_LIMITED', origin);
  if (!env.RESEND_API_KEY || !env.MAIL_FROM || /[\r\n]/.test(env.MAIL_FROM)) return reply(503, 'MAIL_NOT_CONFIGURED', origin);
  try {
    const response = await fetchMail('https://api.resend.com/emails', {
      method:'POST',
      headers:{ 'Authorization':`Bearer ${env.RESEND_API_KEY}`, 'Content-Type':'application/json' },
      body:JSON.stringify({ from:env.MAIL_FROM, to:[recipient], reply_to:email, subject:`Website enquiry: ${topics[interest]}`, text:`Name: ${name}\nReply to: ${email}\nTopic: ${topics[interest]}\nLanguage: ${['en','ru','he'].includes(data.lang) ? data.lang : 'en'}\n\n${message}` }),
      signal:AbortSignal.timeout(12000)
    });
    // Success means the mail provider accepted the message, not that inbox arrival was verified.
    const result = await response.json().catch(() => null);
    if (!response.ok || typeof result?.id !== 'string' || !result.id) return reply(502, 'DELIVERY_FAILED', origin);
    return reply(200, 'ACCEPTED', origin);
  } catch { return reply(502, 'DELIVERY_FAILED', origin); }
}
