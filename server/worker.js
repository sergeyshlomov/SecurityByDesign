import { handleContact } from './contact.js';

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (path === '/health' && request.method === 'GET') return Response.json({ status:'ok', mailConfigured:Boolean(env.RESEND_API_KEY && env.MAIL_FROM) }, { headers:{ 'Cache-Control':'no-store' } });
    if (path !== '/api/contact') return new Response('Not found', { status:404 });
    return handleContact(request, env, { limiter:async () => {
      const ip = request.headers.get('CF-Connecting-IP');
      if (!ip || !env.CONTACT_RATE_LIMIT) return false;
      return (await env.CONTACT_RATE_LIMIT.limit({ key:ip })).success;
    }});
  }
};
