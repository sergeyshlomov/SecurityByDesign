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

`npm start` serves production files and the actual contact API on loopback port 8787. Set PORT for another available port. `/health` reports process readiness and mail configuration separately. For hot reload, run `npm run dev:api` in one persistent session and `npm run dev -- --port 3000` in another. Vite proxies contact requests to port 8787. Do not stop unrelated processes or create worktrees for this isolated cloud task.

Smoke tests check 12 language/viewport combinations (1440, 768, 390, 320px), internal links, three service dialogs, five attack dialogs, pager briefing, tabs, mobile navigation, keyboard access, focus restoration and WCAG A/AA rules. They compare rendered pixels of the pager and map a second apart on desktop/tablet/mobile, including reduced-motion preferences, and verify pause/resume. Screenshots are saved in ignored .local/.

Contact integration tests exercise the production HTTP handler with an explicitly simulated mail provider: acceptance, rejection, rate limiting and missing configuration in all languages. They do **not** prove real email delivery. API tests cover validation, size limits, origin restrictions, fixed recipient, reply-to handling and provider failure. Worker dry-run validates Cloudflare packaging and bindings without deploying.

## Server email: live activation requires credentials

GitHub Pages cannot run a mail server. The form uses a server endpoint and never opens a desktop email application. `public/site-config.json` selects that endpoint. Its initial null value shows that sending is unavailable; it never reports success.

The server sends only to **shlomovs@gmail.com**, uses the validated visitor address as reply_to, and delivers through Resend. Cloudflare rate limiting permits five requests/minute/IP. Clients cannot choose the recipient or subject. Application code logs no message contents or provider credentials.

1. Use Sergey’s Cloudflare and Resend accounts. Register/verify Resend with shlomovs@gmail.com when using the initial onboarding@resend.dev sender, which can deliver only to the account owner. For a custom sender, verify a domain and edit MAIL_FROM in wrangler.jsonc.
2. Add CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID and RESEND_API_KEY in secure environment settings. The Cloudflare token needs Workers Scripts edit and account access required by Wrangler. Never place secrets in source or chat.
3. Run `npm run deploy:worker`. It stops before deployment when bindings are missing, deploys the verified Worker, supplies the Resend secret through stdin, checks health and records the endpoint in public/site-config.json. Local Wrangler state stays under ignored .local/.
4. Build and verify the configured frontend, then publish. The default smoke test intentionally expects an unconfigured candidate; use a dedicated live-mail check for a configured deployment.
5. Send an authorized test enquiry to Sergey. Verify provider acceptance and a Resend delivery event or inbox arrival before claiming delivery. An accepted request alone is not proof of arrival.

The Node server is an alternative for a host supporting Node. Supply RESEND_API_KEY, MAIL_FROM and exact comma-separated ALLOWED_ORIGINS securely. Use the host’s HTTPS reverse proxy. Node rate limits are process-local; use shared rate limiting when scaling.

## Deploy and export

Project moved from havivian to SecurityByDesign; old repository preserved. Source belongs on main, validated static build on gh-pages.

`npm run deploy:pages` uploads existing dist/ with an ordinary non-force push; it does not silently rebuild. Enable GitHub Pages from gh-pages, folder /. Complete local checks before publishing and verify HTTP, TLS and SHA-256 equality of public files afterwards.

Direct public Chromium access may be blocked by the environment proxy certificate. Do not disable TLS verification or change trust stores. A copy downloaded with verified TLS can be tested locally; record that distinction.

`npm run export` creates an illustrative standalone HTML and static ZIP in .local/. Embedded visuals work independently; email still requires a configured server and allowed origin. An offline file is not a working mail service.

## Profile and content

Facts come from the two supplied 2026 CVs. User confirmed Ministry of Finance / SIGMA, 2026–present, and education programs without disputed dates. Employers are employment history, not endorsements. IDF/Mamram computing/software background is presented as supplied; do not invent Unit 8200 service or current intelligence affiliation.

People, room, lab and equipment are photorealistic AI illustrations, not Sergey’s photographs or claims of facility ownership. Five cases are representative educational scenarios, not invented personal client projects or a universal statistical ranking. See [content review](docs/content-review.md).

Translations: src/content.js; professional Russian/Hebrew copy and form messages: src/localization.js; cases and citations: src/attacks.js. Pager warning remains English as requested.

Contact: +972 54 760 7213, shlomovs@gmail.com. No LinkedIn URL supplied. No advertising, analytics or remote fonts. Language preference is local; ?lang=en, ?lang=ru, ?lang=he override it.
