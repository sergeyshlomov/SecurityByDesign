export function validateMailSettings(env) {
  const missing = ['CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID', 'RESEND_API_KEY'].filter(name => !env[name]);
  if (missing.length) throw new Error(`Configure secure environment settings for ${missing.join(', ')}.`);
  // API keys may be proxy-backed placeholders. Only the directly injected account ID is validated here.
  if (!/^[a-f\d]{32}$/i.test(env.CLOUDFLARE_ACCOUNT_ID)) throw new Error('CLOUDFLARE_ACCOUNT_ID must be the 32-character Account ID from the Cloudflare dashboard.');
  if (env.MAIL_FROM && /[\r\n]/.test(env.MAIL_FROM)) throw new Error('MAIL_FROM must not contain line breaks.');
}

export async function checkMailAccess(env, fetcher = fetch) {
  validateMailSettings(env);
  const checks = [
    ['Cloudflare', `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/workers/subdomain`, env.CLOUDFLARE_API_TOKEN],
    ['Resend', 'https://api.resend.com/domains', env.RESEND_API_KEY],
  ];
  for (const [service, url, key] of checks) {
    let response, data;
    try {
      response = await fetcher(url, { headers:{ Authorization:`Bearer ${key}`, Accept:'application/json', 'User-Agent':'SecurityByDesign/1.0' }, signal:AbortSignal.timeout(15000) });
      data = await response.json();
    } catch { throw new Error(`${service} could not be verified. Check network access and secure credential bindings.`); }
    // Resend sending-only keys intentionally cannot list domains.
    if (service === 'Resend' && response.status === 403 && data.name === 'restricted_api_key') continue;
    if (!response.ok || data.success === false) {
      let reason = data.message || data.errors?.map(error => error.message).join('; ') || `HTTP ${response.status}`;
      for (const name of ['CLOUDFLARE_API_TOKEN','RESEND_API_KEY']) if (env[name]) reason = reason.split(env[name]).join('[redacted]');
      throw new Error(`${service} rejected access: ${reason}. Check its secure environment binding.`);
    }
  }
}
