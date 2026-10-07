# Sergey Shlomov — cybersecurity & technology advisory

A responsive profile and advisory website in English, Russian and Hebrew. React 19, Vite 6, locally served fonts, a cinematic operations-room illustration, interactive service hotspots, a photo-aligned animated pager LCD, softly animated monitor maps, a workstation/lab section and educational security scenarios.

## Development

Use Node.js 22 or newer and npm. The current environment has Node.js 24.

```bash
cd /workspace/havivian
npm ci
npm run dev -- --port 3000
```

## Production and verification

```bash
npm run build
npm run test:smoke
```

The smoke test starts its own production preview, checks all three languages at 1440, 768, 390 and 320 pixels, verifies interactions, keyboard navigation, language persistence, email preparation, phone and email links, and checks WCAG A/AA rules with axe. It uses `/usr/bin/chromium`; set `CHROMIUM_PATH` for a different installed browser. Local test screenshots are written to `.local/` and are ignored by Git. To test an already running server, set `TEST_BASE_URL`.

Deploy the generated `dist/` directory to any static web host. No backend, application secrets or database are required. The deployment state is recorded under “Hosting and exports”; do not infer a live site from build or branch-upload success.

## Content

All translated content is in `src/content.js`. Layout and interactions are in `src/main.jsx`; responsive styling is in `src/styles.css`.

- Profile details were taken from the two supplied 2026 CV documents. The more recent cybersecurity CV supplies the 2026 Ministry of Finance / SIGMA role and the end date for ICL.
- The user confirmed the current 2026–present Ministry of Finance / SIGMA role and the presentation of MBA and Technion CIO programs without disputed dates. No claim is made about graduation status beyond the supplied CVs.
- Company names describe employment experience, not endorsements or consulting clients.
- Mamram / IDF experience is presented as supplied. There is no claim of Unit 8200 service, intelligence-agency affiliation or current government endorsement.
- The hero is an AI-generated illustration, not a photograph of Sergey. Its source image is retained outside the repository at `/workspace/generated_images/exec-be78ae02-18e8-4a1d-ae4c-9906006391ae.png`; the optimized web asset is in `public/operations-room.webp`.
- Threat scenarios are educational illustrations, not live events or threat statistics. Career performance figures are self-reported in the CVs.
- The contact form validates input and shows a draft, then lets the visitor open it in an email application using a `mailto:` link. It does not transmit or store submissions; a user completes sending in their email application. A visible draft and copy option provide a fallback.
- No analytics, advertising scripts or third-party font requests are used. Only the selected language is persisted in browser local storage. `?lang=en`, `?lang=ru` and `?lang=he` override the saved choice.
- Phone: `+972 54 760 7213`. Email: `shlomovs@gmail.com`. The CVs do not provide a LinkedIn URL, so no speculative profile link is added.

Each cloud task is already isolated. Use this checkout rather than creating a worktree unless specifically requested.

## Hosting and exports

The Vite build uses relative asset paths so it works both at a domain root and below `/havivian/`.

```bash
npm run export
```

This creates `.local/Sergey-Shlomov.html` (all scripts, fonts and images embedded in one file) and `.local/sergey-shlomov-site.zip` (the static site for a host).

`npm run deploy:pages` uploads the current `dist/` build to the origin `gh-pages` branch using the existing Git authentication, an isolated temporary index and an ordinary non-force push. It preserves the source checkout and any prior publication history. GitHub Pages must also be enabled with branch `gh-pages` and folder `/` in repository Settings → Pages, or through an authorized GitHub API call. A branch upload alone does not prove the website is live. The expected project URL is `https://sergeyshlomov.github.io/havivian/`; verify an HTTP 200 response and the actual page before reporting publication.

The runtime initially blocked `api.github.com` and `sergeyshlomov.github.io` at the network proxy (CONNECT 403). Both hosts were added to the environment's network draft; saving a draft does not apply it to the runtime. Existing `GH_TOKEN` presence does not by itself prove GitHub API scope or Pages administration permission.

The lab scene is an AI-generated photorealistic illustration, not a claim of facility ownership. Original image: `/workspace/generated_images/exec-68efa829-982f-41c8-93d3-0321aa736118.png`.
