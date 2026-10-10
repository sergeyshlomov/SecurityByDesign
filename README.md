# SecurityByDesign — Sergey Shlomov

Responsive English, Russian and Hebrew (RTL) cybersecurity and IT leadership website. Original portrait, pager, laboratory, colors and service sections retained. Five physical equipment artifacts open business-risk scenarios, consequences and recovery measures. The pager scrolls and photographed maps pulse; an explicit pause control works on every device.

Repository: https://github.com/sergeyshlomov/SecurityByDesign

Website: https://sergeyshlomov.github.io/SecurityByDesign/

## Develop and verify

Use Node.js 22+ (current: Node 24), npm and Python 3 with Pillow. Browser checks use /usr/bin/chromium or CHROMIUM_PATH.

```bash
cd /workspace/SecurityByDesign
npm ci --no-audit --no-fund --cache /workspace/.npm-cache
npm run build
npm run test:api
npm run worker:check
npm run test:smoke
```

`npm run dev -- --port 3000` provides hot reload with the static site’s FormSubmit configuration. Do not send live mail as part of routine development checks. For the optional owned backend, run `npm run dev:api` and `CONTACT_PROVIDER=worker npm run dev -- --port 3000` in separate sessions; Vite then serves `/api/contact` configuration and proxies it to 8787. `npm start` serves dist/ with this optional Node API on loopback 8787. Its `/health` reports backend readiness and mail configuration separately. Set PORT for another available port. Do not stop unrelated processes or create worktrees for this isolated cloud task.

Smoke tests check 12 language/viewport combinations (1440, 768, 390, 320px), internal links, three service dialogs, five attack dialogs, pager briefing, tabs, mobile navigation, keyboard access, focus restoration and WCAG A/AA rules. They compare rendered pixels of the pager and map a second apart on desktop/tablet/mobile, including reduced-motion preferences, and verify pause/resume. Screenshots are saved in ignored .local/.

Contact integration tests exercise the production HTTP handler with an explicitly simulated mail provider: acceptance, rejection, rate limiting and missing configuration in all languages. FormSubmit browser fixtures additionally cover HTTP-200 activation/rejection, rate limits, non-JSON responses and network failures in all three languages. They do **not** prove real email delivery. API tests cover validation, size limits, origin restrictions, fixed recipient, reply-to handling and provider failure. Worker dry-run validates Cloudflare packaging and bindings without deploying.

## Contact email: free FormSubmit delivery

The published static site now uses [FormSubmit](https://formsubmit.co/) through its JSON AJAX endpoint. No Cloudflare account, API key, custom domain or desktop email app is needed for this integration. `public/site-config.json` fixes the provider and recipient endpoint to `https://formsubmit.co/ajax/shlomovs@gmail.com`. The form sends the visitor's name, email, topic, language and message; FormSubmit forwards it to Sergey and uses the visitor email for replies. The site's privacy dialog names FormSubmit and links its policy.

**Recipient verification is still pending as of the setup check on 10 October 2026.** The live service returned HTTP 200 with `success: "false"` and: “This form needs Activation. We've sent you an email containing an 'Activate Form' link. Just click it and your form will be actived!” The recipient must click **Activate Form** in that email once. This cannot be completed without access to the recipient's inbox. No mail delivery or inbox arrival is claimed while activation is pending.

`src/contact-client.js` distinguishes activation errors from accepted submissions, including FormSubmit's HTTP-200 failures. Errors retain the visitor's message and show translated feedback. The AJAX path stays on the site. The endpoint, notification subject and destination URL are fixed in code; visitor fields cannot set recipients, CC or subject. A hidden honeypot field is passed to the service. Provider anti-spam controls apply; the static website does not claim its own server-side IP rate limiting or CAPTCHA.

The manual **Check contact delivery** GitHub Actions workflow validates official service documentation, the privacy link and CORS. With the explicit `submit_test` option it also sends one identified test to the site owner's address. These are live service checks, separate from browser fixtures. The CORS check passed from the site's origin with POST and Content-Type allowed. Setup checks and their sanitized responses are visible in GitHub check annotations. Browsers do not send live messages during smoke tests.

After recipient activation, use that manual test or `node scripts/test-live-mail.mjs` to send one authorized test enquiry. Provider acceptance is distinct from inbox delivery; confirm arrival before claiming end-to-end delivery. This cloud environment may deny a new provider host until its saved network configuration is published. Do not disable TLS verification or bypass network controls.

### Optional owned backend

The Cloudflare Worker / Node + Resend implementation is retained for a later move to an owned backend. It is not required for the current static FormSubmit website. `npm run deploy:worker` checks CLOUDFLARE_ACCOUNT_ID and supported Cloudflare/Resend APIs before deployment. Use secure environment bindings for CLOUDFLARE_API_TOKEN and RESEND_API_KEY; never commit credentials. Proxy-backed placeholders are not raw API keys. `server/contact.js` sends only to shlomovs@gmail.com with a fixed subject, validates input and origin, and uses reply_to. Production Worker rate limits are five requests/minute/IP; Node limits are process-local. Configure MAIL_FROM and ALLOWED_ORIGINS securely for a Node host.

The existing Cloudflare/Resend settings failed the previous preflight checks. Do not deploy this optional backend or report mail readiness merely because bindings exist.

## Deploy and export

Project moved from havivian to SecurityByDesign; old repository preserved. Source belongs on main, validated static build on gh-pages.

`npm run deploy:pages` uploads existing dist/ with an ordinary non-force push; it does not silently rebuild. Enable GitHub Pages from gh-pages, folder /. Complete local checks before publishing and verify HTTP, TLS and SHA-256 equality of public files afterwards.

Direct public Chromium access may be blocked by the environment proxy certificate. Do not disable TLS verification or change trust stores. A copy downloaded with verified TLS can be tested locally; record that distinction.

`npm run export` creates an illustrative standalone HTML and static ZIP in .local/. Embedded visuals work independently; email still requires a reachable, activated provider and an allowed origin. An offline file is not a working mail service.

## Profile and content

Facts come from the two supplied 2026 CVs. User confirmed Ministry of Finance / SIGMA, 2026–present, and education programs without disputed dates. Employers are employment history, not endorsements. IDF/Mamram computing/software background is presented as supplied; do not invent Unit 8200 service or current intelligence affiliation.

People, room, lab and equipment are photorealistic AI illustrations, not Sergey’s photographs or claims of facility ownership. Five cases are representative educational scenarios, not invented personal client projects or a universal statistical ranking. See [content review](docs/content-review.md).

Translations: src/content.js; Russian editorial copy: src/localization.js; complete Hebrew copy: src/hebrew.js; interface captions: src/ui-copy.js; provider messages and privacy: src/mail-copy.js; cases and citations: src/attacks.js. Pager warning remains English as requested.

Contact: +972 54 760 7213, shlomovs@gmail.com. No LinkedIn URL supplied. No advertising, analytics or remote fonts. Language preference is local; ?lang=en, ?lang=ru, ?lang=he override it.
