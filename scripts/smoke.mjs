import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { spawn, execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { Readable } from 'node:stream';
import { handleContact } from '../server/contact.js';
import { content } from '../src/content.js';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

const origin = process.env.TEST_BASE_URL || 'http://127.0.0.1:4173';
const server = process.env.TEST_BASE_URL ? null : spawn('npm', ['run', 'preview', '--', '--port', '4173', '--strictPort'], { stdio: 'pipe', detached: true });
let browser;
let fixture;
let fixtureMode='accepted';
let receivedMail=[];
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
    await Promise.all([['desktop',1440,1000],['tablet',768,1024],['mobile',390,844],['small-mobile',320,740]].map(async ([device, width, height]) => {
      const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
      const page = await context.newPage();
      page.on('pageerror', e => errors.push(e.message));
      page.on('response',response=>{if(response.status()>=400 && ['image','font','stylesheet','script'].includes(response.request().resourceType()))errors.push(`Asset HTTP ${response.status()}: ${response.url()}`);});
      const response = await page.goto(`${origin}/?lang=${lang}`, { waitUntil: 'networkidle' });
      assert.equal(response.status(), 200);
      await page.evaluate(() => document.fonts.ready);
      assert.equal(await page.locator('html').getAttribute('lang'), lang);
      assert.equal(await page.locator('html').getAttribute('dir'), lang === 'he' ? 'rtl' : 'ltr');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `${lang}/${device} has horizontal overflow`);
      assert.equal(await page.locator('.hero-image').evaluate(el => el.complete && el.naturalWidth > 0), true);
      assert.equal(await page.locator('.service-card').count(), 3);
      assert.equal(await page.locator('.timeline-item').count(), 5);
      assert.equal(await page.locator('.attack-artifact').count(),5);
      for(let i=0;i<5;i++){
        await page.locator('.attack-artifact').nth(i).click();
        assert.equal(await page.locator('#dialog-title').innerText(),content[lang].attacks[i].title);
        assert.ok((await page.locator('.case-impact').innerText()).includes(content[lang].attacks[i].impact));
        assert.ok((await page.locator('.case-response').innerText()).includes(content[lang].attacks[i].response));
        if(i===0 && device==='desktop')await audit(page,`${lang}/attack-dialog`);
        await page.keyboard.press('Escape');
        assert.equal(await page.locator('.attack-artifact').nth(i).evaluate(el=>el===document.activeElement),true);
      }
      const screen = await page.locator('.pager-screen').boundingBox();
      assert.ok(screen.x >= 0 && screen.x + screen.width <= width && screen.width > 90, `${lang}/${device} pager LCD is clipped or too small`);
      for(let i=0;i<3;i++){
        await page.locator('.card-action').nth(i).click();
        assert.equal(await page.locator('#dialog-title').innerText(),content[lang].services[i].title);
        await page.locator('.modal .primary').click();
        assert.equal(await page.locator('select').inputValue(),String(i));
      }
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
      for(const tabs of ['.brief-tabs','.lab-tabs'])for(let i=0;i<3;i++){await page.locator(tabs).getByRole('tab').nth(i).click();assert.equal(await page.locator(tabs).getByRole('tab').nth(i).getAttribute('aria-selected'),'true');}
      await page.locator('.lab-cta').click();assert.equal(await page.locator('select').inputValue(),'0');
      await page.locator('.hotspot-three').click();assert.equal(await page.locator('#dialog-title').innerText(),content[lang].briefDetails[2].title);await page.locator('.modal .primary').click();
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
      // Exercise every navigation anchor, including footer and contact focus link.
      const internal=await page.locator('a[href^="#"]').count();
      for(let i=0;i<internal;i++){const link=page.locator('a[href^="#"]').nth(i);if(!await link.isVisible())continue;if(await link.evaluate(el=>el.classList.contains('skip-link')))await link.focus();const href=await link.getAttribute('href');await link.click();assert.equal(await page.locator(href).count(),1);assert.equal(await page.evaluate(()=>location.hash),href);}
      await page.screenshot({ path: `.local/${lang}-${device}.png`, fullPage: true });
      const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
      for (const violation of accessibility.violations) errors.push(`${lang}/${device}: ${violation.id}: ${violation.nodes.map(n => n.target.join(' ')).join(', ')}`);
      checks++;
      console.log(`PASS ${lang} / ${device}: layout, image, services, modal, briefing, contact selection, keyboard navigation`);
      await context.close();
    }));
  }
  const formContext = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await formContext.newPage();
  await page.goto(origin);
  await page.getByRole('button', { name: 'Русский', exact: true }).click();
  await page.reload();
  assert.equal(await page.locator('html').getAttribute('lang'), 'ru');
  await page.getByRole('button', { name: 'English', exact: true }).click();
  async function fillForm(){
    await page.locator('[name="name"]').fill('Example Person');
    await page.locator('[name="email"]').fill('shlomovs@gmail.com');
    await page.locator('[name="message"]').fill('TEST ONLY — please discuss an IT strategy engagement.');
    await page.locator('select').selectOption('1');
  }
  // Production candidate has no provider credentials: it must honestly reject sending.
  await page.locator('.form-submit').click();
  assert.equal(await page.locator('[name="name"]').evaluate(el=>el.validity.valueMissing),true);
  await fillForm();await page.locator('.form-submit').click();
  await page.locator('.form-feedback.error').waitFor();
  assert.ok((await page.locator('.form-feedback.error').innerText()).includes('temporarily unavailable'));
  assert.equal(await page.locator('.form-feedback.sent').count(),0);
  // A real local HTTP API uses the production handler with an explicit test mail-provider double.
  fixture=createServer(async(req,res)=>{
    const request=new Request('http://fixture/api/contact',{method:req.method,headers:req.headers,...(['GET','OPTIONS'].includes(req.method)?{}:{body:Readable.toWeb(req),duplex:'half'})});
    const result=await handleContact(request,{ALLOWED_ORIGINS:new URL(origin).origin,RESEND_API_KEY:fixtureMode==='unconfigured'?'':'fixture-only-key',MAIL_FROM:'Sergey <onboarding@resend.dev>'},{limiter:async()=>fixtureMode!=='rate',fetchMail:async(url,init)=>{receivedMail.push(JSON.parse(init.body));await new Promise(r=>setTimeout(r,150));return fixtureMode==='failed'?Response.json({message:'test rejection'},{status:403}):Response.json({id:'fixture-only-id'});}});
    res.writeHead(result.status,Object.fromEntries(result.headers));res.end(await result.text());
  });
  await new Promise(r=>fixture.listen(0,'127.0.0.1',r));
  await page.route('**/site-config.json',route=>route.fulfill({json:{contactEndpoint:`http://127.0.0.1:${fixture.address().port}/api/contact`}}));
  for(const lang of ['en','ru','he']){
    await page.getByRole('button',{name:{en:'English',ru:'Русский',he:'עברית'}[lang],exact:true}).click();
    await fillForm();await page.locator('.form-submit').click();await page.locator('.form-feedback.sent').waitFor();
    assert.equal(await page.locator('[name="message"]').inputValue(),'');
    assert.deepEqual(receivedMail.at(-1).to,['shlomovs@gmail.com']);assert.equal(receivedMail.at(-1).reply_to,'shlomovs@gmail.com');
    for(const mode of ['failed','rate','unconfigured']){fixtureMode=mode;await fillForm();await page.locator('.form-submit').click();await page.locator('.form-feedback.error').waitFor();assert.equal(await page.locator('.form-feedback.sent').count(),0);assert.ok(await page.locator('[name="message"]').inputValue());}
    fixtureMode='accepted';
  }
  await page.getByRole('button',{name:'English',exact:true}).click();
  await page.locator('.footer-bottom button').click();
  await page.getByRole('dialog').waitFor();
  await audit(page, 'privacy-dialog');
  assert.ok((await page.locator('.modal').innerText()).includes('no advertising trackers'));
  await page.keyboard.press('Escape');
  const links = await page.locator('a').evaluateAll(nodes => nodes.map(n => n.getAttribute('href')));
  assert.ok(links.includes('#contact-form') && links.includes('tel:+972547607213'));assert.ok(!links.some(h=>h.startsWith('mailto:')));
  await page.locator('.contact-method').first().click();assert.equal(await page.locator('[name="name"]').evaluate(el=>el===document.activeElement),true);
  for (const id of links.filter(h => h.startsWith('#'))) assert.equal(await page.locator(id).count(),1);
  await page.close();
  console.log('PASS validation, missing configuration, multilingual HTTP API integration with test provider, delivery failure/rate limit, privacy, all navigation and contact links. Live email NOT tested: no credentials.');
  for(const [device,width,height] of [['desktop',1440,1000],['tablet',768,1024],['mobile',390,844]]){
    const motionContext=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});
    const motionPage=await motionContext.newPage();await motionPage.goto(origin,{waitUntil:'networkidle'});
    await motionPage.locator('.pager').scrollIntoViewIfNeeded();await motionPage.mouse.move(0,0);
    const lcd=motionPage.locator('.pager-screen'),monitor=motionPage.locator('.monitor-map');
    // Capture a dim-to-bright interval; arbitrary equal-phase samples can alias a working pulse.
    // Page clips avoid locator screenshots scrolling a partially cropped mobile monitor.
    async function capture(element,path){const r=await element.boundingBox();const x=Math.max(0,r.x),y=Math.max(0,r.y);await motionPage.screenshot({path,clip:{x,y,width:Math.min(width,r.x+r.width)-x,height:Math.min(height,r.y+r.height)-y}});}
    await motionPage.waitForFunction(()=>Number(getComputedStyle(document.querySelector('.monitor-map')).opacity)<.32);
    await capture(monitor,`.local/${device}-monitor-before.png`);await capture(lcd,`.local/${device}-lcd-before.png`);
    await motionPage.waitForTimeout(1000);
    await capture(monitor,`.local/${device}-monitor-after.png`);await capture(lcd,`.local/${device}-lcd-after.png`);
    const result=execFileSync('python3',['scripts/check-motion.py',device],{encoding:'utf8'});console.log(result.trim());
    await motionPage.locator('.motion-toggle').click();
    for(const selector of ['.marquee>span','.monitor-glow-right','.monitor-map'])assert.equal(await motionPage.locator(selector).evaluate(el=>getComputedStyle(el).animationPlayState),'paused');
    await motionPage.locator('.pager').hover();assert.equal(await motionPage.locator('.marquee>span').evaluate(el=>getComputedStyle(el).animationPlayState),'paused');
    const transform=await motionPage.locator('.marquee>span').evaluate(el=>getComputedStyle(el).transform);await motionPage.waitForTimeout(300);assert.equal(await motionPage.locator('.marquee>span').evaluate(el=>getComputedStyle(el).transform),transform);
    await motionPage.locator('.motion-toggle').click();assert.equal(await motionPage.locator('.marquee>span').evaluate(el=>getComputedStyle(el).animationPlayState),'running');
    await motionContext.close();
  }
  console.log('PASS visible LCD scrolling and monitor blinking on 3 screen sizes, including reduced-motion preference; pause/resume works.');
  assert.deepEqual(errors, [], `Browser/accessibility errors: ${errors.join('\n')}`);
  console.log(`Complete: ${checks} responsive language combinations; no browser errors or WCAG A/AA violations.`);
} finally {
  await browser?.close();
  if(fixture)await new Promise(r=>fixture.close(r));
  if (server?.pid) { try { process.kill(-server.pid, 'SIGTERM'); } catch {} }
}
