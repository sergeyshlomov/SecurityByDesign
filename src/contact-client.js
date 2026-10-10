export const formSubmitEndpoint = 'https://formsubmit.co/ajax/shlomovs@gmail.com';
export const websiteUrl = 'https://sergeyshlomov.github.io/SecurityByDesign/';

// An HTTP 200 is also used for activation and validation errors by FormSubmit.
export function contactResult(response, result, provider) {
  if (response.status === 429) return { ok: false, code: 'RATE_LIMITED' };
  if (provider === 'formsubmit') {
    const message = typeof result?.message === 'string' ? result.message : '';
    if (/needs activation|activate (?:the |your )?form|form needs to be activated/i.test(message)) {
      return { ok: false, code: 'MAIL_ACTIVATION_REQUIRED' };
    }
    return response.ok && (result?.success === true || result?.success === 'true')
      ? { ok: true, code: 'ACCEPTED' }
      : { ok: false, code: 'DELIVERY_FAILED' };
  }
  return response.ok && result?.ok === true && result?.code === 'ACCEPTED'
    ? { ok: true, code: 'ACCEPTED' }
    : { ok: false, code: result?.code || 'DELIVERY_FAILED' };
}

export async function sendContact(config, data, { pageUrl, fetchRequest = fetch } = {}) {
  const provider = config?.contactProvider || 'worker';
  const target = config?.contactEndpoint ? new URL(config.contactEndpoint, pageUrl) : null;
  const local = target && ['localhost', '127.0.0.1'].includes(new URL(pageUrl).hostname)
    && ['localhost', '127.0.0.1'].includes(target.hostname);
  if (!target || !(target.protocol === 'https:' || local)
    || (provider === 'formsubmit' && target.href !== formSubmitEndpoint)
    || !['worker', 'formsubmit'].includes(provider)) {
    return { ok: false, code: 'MAIL_NOT_CONFIGURED' };
  }
  // Never accept a recipient, CC or subject from a visitor-controlled form field.
  const payload = provider === 'formsubmit' ? {
    name: data.name, email: data.email, message: data.message,
    topic: data.topic, language: data.lang,
    _subject: 'SecurityByDesign — website enquiry', _template: 'table',
    _honey: data.website || '', _url: websiteUrl,
  } : data;
  const response = await fetchRequest(target.href, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload), signal: AbortSignal.timeout(18000),
  });
  const result = await response.json().catch(() => null);
  return contactResult(response, result, provider);
}
