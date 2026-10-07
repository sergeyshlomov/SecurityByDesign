import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

const origin = process.env.TEST_BASE_URL || 'http://127.0.0.1:4173';
const server = process.env.TEST_BASE_URL ? null : spawn('npm', ['run', 'preview', '--', '--port', '4173', '--strictPort'], { stdio: 'pipe', detached: true });
let browser;
const errors = [];
async function audit(page, label) {
  if (await page.locator('.modal-backdrop').count()) await page.locator('.modal-backdrop').evaluate(async el => { await Promise.all(el.getAnimations().map(a => a.finished)); });
  const result = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
  for (const v of result.violations) errors.push(`${label}: ${v.id}: ${v.nodes.map(n => n.target.join(' ')).join(', ')}`);
}
try {
  for (let i = 0; i < 60; i++) {
    try { if ((await fetch(origin)).ok) break; } catch {}
    if (i === 59) throw new Error('Preview server did not become ready');
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  const executablePath = process.env.CHROMIUM_PATH || '/usr/bin/chromium';
  browser = await chromium.launch({ executablePath, args: ['--no-sandbox'] });
  await mkdir('.local', { recursive: true });
  let checks = 0;
  for (const lang of ['en', 'ru', 'he']) {
    for (const [device, width, height] of [['desktop',1440,1000],['tablet',768,1024],['mobile',390,844],['small-mobile',320,740]]) {
      const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      page.on('pageerror', e => errors.push(e.message));
      const response = await page.goto(`${origin}/?lang=${lang}`, { waitUntil: 'networkidle' });
      assert.equal(response.status(), 200);
      await page.evaluate(() => document.fonts.ready);
      assert.equal(await page.locator('html').getAttribute('lang'), lang);
      assert.equal(await page.locator('html').getAttribute('dir'), lang === 'he' ? 'rtl' : 'ltr');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${lang}/${device} has horizontal overflow`);
      assert.equal(await page.locator('.hero-image').evaluate(el => el.complete && el.naturalWidth > 0), true);
      assert.equal(await page.locator('.service-card').count(), 3);
      assert.equal(await page.locator('.timeline-item').count(), 5);
      const screen = await page.locator('.pager-screen').boundingBox();
      assert.ok(screen.x >= 0 && screen.x + screen.width <= width && screen.width > 90, `${lang}/${device} pager LCD is clipped or too small`);
      await page.locator('.hotspot-one').click();
      await page.getByRole('dialog').waitFor();
      if (device === 'desktop') await audit(page, `${lang}/service-dialog`);
      assert.equal(await page.locator('.modal-close').evaluate(el => el === document.activeElement), true);
      await page.keyboard.press('Escape');
      assert.equal(await page.getByRole('dialog').count(), 0);
      assert.equal(await page.locator('.hotspot-one').evaluate(el => el === document.activeElement), true);
      await page.locator('.hotspot-two').click();
      await page.locator('.modal .primary').click();
      assert.equal(await page.locator('select').inputValue(), '1');
      await page.locator('.pager').click();
      await page.getByRole('dialog').waitFor();
      if (device === 'desktop') await audit(page, `${lang}/pager-dialog`);
      await page.locator('.modal-close').click();
      await page.locator('.brief-tabs').getByRole('tab').nth(1).click();
      assert.equal(await page.locator('.brief-tabs').getByRole('tab').nth(1).getAttribute('aria-selected'), 'true');
      await page.keyboard.press('ArrowRight');
      assert.equal(await page.locator('.brief-tabs').getByRole('tab').nth(2).getAttribute('aria-selected'), 'true');
      await page.locator('.lab-visual img').scrollIntoViewIfNeeded();
      await page.locator('.lab-visual img').evaluate(el => el.decode());
      const previousLabHeading = await page.locator('#lab-panel h3').innerText();
      await page.locator('.lab-tabs').getByRole('tab').nth(1).click();
      assert.notEqual(await page.locator('#lab-panel h3').innerText(), previousLabHeading);
      await page.keyboard.press('ArrowRight');
      assert.equal(await page.locator('.lab-tabs').getByRole('tab').nth(2).getAttribute('aria-selected'), 'true');
      if (width < 901) {
        await page.locator('.menu-toggle').click();
        assert.equal(await page.locator('.mobile-nav a').count(), 4);
        await page.locator('.mobile-nav a').nth(3).click();
        assert.equal(await page.locator('.mobile-nav').count(), 0);
      }
      await page.screenshot({ path: `.local/${lang}-${device}.png`, fullPage: true });
      const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
      for (const violation of accessibility.violations) errors.push(`${lang}/${device}: ${violation.id}: ${violation.nodes.map(n => n.target.join(' ')).join(', ')}`);
      checks++;
      console.log(`PASS ${lang} / ${device}: layout, image, services, modal, briefing, contact selection, keyboard navigation`);
      await context.close();
    }
  }
  const formContext = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await formContext.newPage();
  await page.goto(origin);
  await page.getByRole('button', { name: 'Русский', exact: true }).click();
  await page.reload();
  assert.equal(await page.locator('html').getAttribute('lang'), 'ru');
  await page.getByRole('button', { name: 'English', exact: true }).click();
  await page.locator('[name="name"]').fill('Example Person');
  await page.locator('[name="email"]').fill('example@example.com');
  await page.locator('[name="message"]').fill('Please discuss an IT strategy engagement.');
  await page.locator('select').selectOption('1');
  await page.locator('.form-submit').click();
  await page.locator('.email-ready').waitFor();
  const draft = await page.locator('.draft-preview').inputValue();
  assert.ok((await page.locator('.email-open').getAttribute('href')).startsWith('mailto:shlomovs@gmail.com?subject='));
  assert.ok(draft.includes('Example Person') && draft.includes('example@example.com') && draft.includes('CIO strategy'));
  await page.locator('.footer-bottom button').click();
  await page.getByRole('dialog').waitFor();
  await audit(page, 'privacy-dialog');
  assert.ok((await page.locator('.modal').innerText()).includes('no advertising trackers'));
  await page.keyboard.press('Escape');
  const links = await page.locator('a').evaluateAll(nodes => nodes.map(n => n.getAttribute('href')));
  assert.ok(links.includes('mailto:shlomovs@gmail.com') && links.includes('tel:+972547607213'));
  for (const id of links.filter(h => h.startsWith('#'))) assert.equal(await page.locator(id).count(),1);
  await page.close();
  console.log('PASS language persistence, prepared email, privacy dialog, phone/email and navigation links');
  const motionContext = await browser.newContext({ reducedMotion: 'no-preference' });
  const motionPage = await motionContext.newPage();
  await motionPage.goto(origin, { waitUntil: 'networkidle' });
  const originalTransform = await motionPage.locator('.marquee>span').evaluate(el => getComputedStyle(el).transform);
  await motionPage.waitForFunction(before => getComputedStyle(document.querySelector('.marquee>span')).transform !== before, originalTransform);
  const originalOpacity = await motionPage.locator('.monitor-glow-right').evaluate(el => getComputedStyle(el).opacity);
  await motionPage.waitForFunction(before => getComputedStyle(document.querySelector('.monitor-glow-right')).opacity !== before, originalOpacity);
  await motionPage.locator('.motion-toggle').click();
  assert.equal(await motionPage.locator('.marquee>span').evaluate(el => getComputedStyle(el).animationPlayState), 'paused');
  assert.equal(await motionPage.locator('.monitor-glow-right').evaluate(el => getComputedStyle(el).animationPlayState), 'paused');
  await motionPage.locator('.pager').hover();
  assert.equal(await motionPage.locator('.marquee>span').evaluate(el => getComputedStyle(el).animationPlayState), 'paused');
  await motionPage.locator('.motion-toggle').click();
  assert.equal(await motionPage.locator('.marquee>span').evaluate(el => getComputedStyle(el).animationPlayState), 'running');
  await motionContext.close();
  console.log('PASS LCD ticker, monitor animation, explicit pause/resume and pause retention while hovering');
  assert.deepEqual(errors, [], `Browser/accessibility errors: ${errors.join('\n')}`);
  console.log(`Complete: ${checks} responsive language combinations; no browser errors or WCAG A/AA violations.`);
} finally {
  await browser?.close();
  if (server?.pid) { try { process.kill(-server.pid, 'SIGTERM'); } catch {} }
}
