import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowUpRight, ArrowRight, ArrowDown, ShieldCheck, Layers3, Cpu, Plus, X, Menu, Mail, Phone, Globe2, LockKeyhole, Radio, Check, Copy, ChevronRight, Fingerprint, Activity, Pause, Play, Monitor, FlaskConical } from 'lucide-react';
import { content } from './content';
import { attackSources } from './attacks';
import '@fontsource-variable/dm-sans';
import '@fontsource-variable/manrope';
import '@fontsource-variable/heebo';
import './styles.css';

const icons = [ShieldCheck, Layers3, Cpu];
const sectionIds = ['expertise', 'experience', 'about', 'contact'];
function initialLanguage() {
  const query = new URLSearchParams(window.location.search).get('lang');
  if (content[query]) return query;
  try { const saved = localStorage.getItem('sergey-language'); if (content[saved]) return saved; } catch {}
  return 'en';
}
function App() {
  const [lang, setLang] = useState(initialLanguage);
  const t = content[lang];
  const [menu, setMenu] = useState(false);
  const [modal, setModal] = useState(null);
  const [brief, setBrief] = useState(0);
  const [interest, setInterest] = useState('0');
  const [sendState, setSendState] = useState('idle');
  const [sendCode, setSendCode] = useState('');
  const [motionPaused, setMotionPaused] = useState(false);
  const [lab, setLab] = useState(0);
  const [photoGeometry, setPhotoGeometry] = useState(null);
  const heroRef = useRef(null);
  const heroImageRef = useRef(null);
  const [formError, setFormError] = useState(false);
  const dialogRef = useRef(null);
  const modalTrigger = useRef(null);

  useEffect(() => {
    const image = heroImageRef.current, hero = heroRef.current;
    function alignPhoto() {
      if (!image.naturalWidth) return;
      const imageBox = image.getBoundingClientRect(), heroBox = hero.getBoundingClientRect();
      const scale = Math.max(imageBox.width / image.naturalWidth, imageBox.height / image.naturalHeight);
      const width = image.naturalWidth * scale, height = image.naturalHeight * scale;
      const positions = getComputedStyle(image).objectPosition.split(' ');
      const fraction = value => value === 'center' ? .5 : value === 'left' || value === 'top' ? 0 : value === 'right' || value === 'bottom' ? 1 : parseFloat(value) / 100;
      setPhotoGeometry({ width, height, left: imageBox.left - heroBox.left + (imageBox.width - width) * fraction(positions[0]), top: imageBox.top - heroBox.top + (imageBox.height - height) * fraction(positions[1]), '--photo-scale': scale, '--photo-width': `${width}px`, '--photo-height': `${height}px`, '--scene-photo': `url(${new URL(`${import.meta.env.BASE_URL}operations-room.webp`,document.baseURI).href})` });
    }
    const observer = new ResizeObserver(alignPhoto);
    observer.observe(hero); observer.observe(image);
    image.addEventListener('load', alignPhoto); alignPhoto();
    return () => { observer.disconnect(); image.removeEventListener('load', alignPhoto); };
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'he' ? 'rtl' : 'ltr';
    document.title = t.seo;
    document.querySelector('meta[name="description"]').content = t.intro;
    try { localStorage.setItem('sergey-language', lang); } catch {}
  }, [lang, t]);
  useEffect(() => {
    if (!modal) return;
    const previous = document.activeElement;
    modalTrigger.current = previous;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.querySelector('button')?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') setModal(null);
      if (e.key === 'Tab') {
        const nodes = [...dialogRef.current.querySelectorAll('button, a[href], input, textarea, select')];
        const first = nodes[0], last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; document.removeEventListener('keydown', onKey); previous?.focus(); };
  }, [modal]);

  function contactService(index) {
    setInterest(String(index)); setModal(null);
    requestAnimationFrame(() => document.getElementById('contact').scrollIntoView({ behavior: 'smooth' }));
  }
  async function sendMessage(e) {
    e.preventDefault();
    if (sendState === 'sending') return;
    const form = e.currentTarget, data = new FormData(form);
    const name = data.get('name').trim(), email = data.get('email').trim(), message = data.get('message').trim();
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !message) { setFormError(true); return; }
    setFormError(false); setSendState('sending'); setSendCode('');
    try {
      const configResponse = await fetch(`${import.meta.env.BASE_URL}site-config.json`, { cache:'no-store' });
      const config = configResponse.ok ? await configResponse.json() : null;
      const endpoint = config?.contactEndpoint;
      const target = endpoint ? new URL(endpoint,window.location.href) : null;
      const localDevelopment = ['localhost','127.0.0.1'].includes(window.location.hostname) && ['localhost','127.0.0.1'].includes(target?.hostname);
      if (!target || !(target.protocol==='https:' || localDevelopment)) { setSendCode('MAIL_NOT_CONFIGURED'); setSendState('error'); return; }
      const response = await fetch(endpoint, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({name,email,message,interest:Number(interest),lang,website:data.get('website') || ''}), signal:AbortSignal.timeout(18000) });
      const result = await response.json().catch(()=>null);
      if (!response.ok || result?.ok !== true || result?.code !== 'ACCEPTED') { setSendCode(result?.code || 'DELIVERY_FAILED');setSendState('error');return; }
      setSendState('sent');form.reset();setInterest('0');
    } catch { setSendCode('DELIVERY_FAILED');setSendState('error'); }
  }
  const currentService = modal?.type === 'service' ? t.services[modal.index] : null;
  const ServiceIcon = currentService ? icons[modal.index] : ShieldCheck;
  const currentAttack = modal?.type === 'attack' ? t.attacks[modal.index] : null;

  return <>
    <a className="skip-link" href="#expertise">{t.explore}</a>
    <div className="dark-opening" id="top">
      <header className="header shell">
        <a className="brand" href="#top" aria-label={t.name}><span className="brand-symbol"><ShieldCheck size={28}/></span><span>SERGEY<span className="brand-last">SHLOMOV<span className="brand-dot">.</span></span></span></a>
        <nav className="desktop-nav" aria-label={t.menu}>{t.nav.map((label, i) => <a href={`#${sectionIds[i]}`} key={label}>{label}</a>)}</nav>
        <div className="header-actions"><div className="languages" aria-label="Language">{['en','ru','he'].map(l => <button key={l} className={l === lang ? 'selected' : ''} onClick={() => {setLang(l);setMenu(false);}} aria-pressed={l === lang} aria-label={{en:'English',ru:'Русский',he:'עברית'}[l]}>{l === 'he' ? 'HE' : l.toUpperCase()}</button>)}</div><a className="header-cta" href="#contact">{t.talk}<ArrowUpRight size={16}/></a><button className="menu-toggle" onClick={() => setMenu(!menu)} aria-label={menu ? t.close : t.menu} aria-expanded={menu}>{menu ? <X/> : <Menu/>}</button></div>
      </header>
      {menu && <nav className="mobile-nav shell">{t.nav.map((label,i) => <a href={`#${sectionIds[i]}`} key={label} onClick={() => setMenu(false)}>{label}<ArrowUpRight size={18}/></a>)}</nav>}
    </div>
    <main>
    <div className="dark-opening">
        <section className={`hero ${motionPaused ? 'motion-paused' : ''}`} aria-labelledby="hero-heading" ref={heroRef}>
          <img className="hero-image" src={`${import.meta.env.BASE_URL}operations-room.webp`} alt="" fetchPriority="high" ref={heroImageRef}/>
          <div className="hero-shade"/>
          <div className="hero-grid"/>
          {photoGeometry && <div className="photo-plane" style={photoGeometry}>
            <div className="monitor-map" aria-hidden="true"/>
            <div className="monitor-glow monitor-glow-right" aria-hidden="true"/><div className="monitor-glow monitor-glow-lower" aria-hidden="true"/>
            <button className="pager" onClick={() => setModal({type:'brief'})} aria-label={`${t.pagerHint}. ${t.pager}`}><div className="pager-screen" dir="ltr"><span className="pager-screen-label">SECURITY ALERT</span><div className="marquee"><span>{t.pager} &nbsp; {t.pager} &nbsp;</span></div></div><span className="pager-hint">{t.pagerHint}<ArrowUpRight size={13}/></span></button>
          </div>}
          <div className="shell hero-inner">
            <div className="hero-copy"><div className="eyebrow hero-eyebrow"><span className="signal-dot"/>{t.eyebrow}</div><h1 id="hero-heading">{t.headline.map(line => <span key={line}>{line}</span>)}<span className="hero-accent">{t.accent}</span></h1><p>{t.intro}</p><div className="hero-buttons"><a className="button primary" href="#contact">{t.cta}<ArrowUpRight size={18}/></a><a className="text-link" href="#expertise">{t.explore}<ArrowRight size={17}/></a></div><div className="hero-location"><Globe2 size={13}/>{t.location}</div></div>
            <div className="scene-ui">
              <div className="scene-caption"><span className="scene-cross">+</span>{t.scenario}<span className="scene-note">{t.scenarioNote}</span><button className="motion-toggle" aria-pressed={motionPaused} onClick={()=>setMotionPaused(!motionPaused)} aria-label={motionPaused?t.motionPlay:t.motionPause}>{motionPaused?<Play size={12}/>:<Pause size={12}/>}<span>{motionPaused?t.motionPlay:t.motionPause}</span></button></div>
              <button className="hotspot hotspot-one" onClick={() => setModal({type:'service',index:0})}><span className="hotspot-dot"><Plus size={15}/></span><span><small>01 / SECURITY</small>{t.hotspots[0]}</span></button>
              <button className="hotspot hotspot-two" onClick={() => setModal({type:'service',index:1})}><span className="hotspot-dot"><Plus size={15}/></span><span><small>02 / STRATEGY</small>{t.hotspots[1]}</span></button>
              <button className="hotspot hotspot-three" onClick={() => {setBrief(2);setModal({type:'brief'});}}><span className="hotspot-dot"><Plus size={15}/></span><span><small>03 / RESILIENCE</small>{t.hotspots[2]}</span></button>
            </div>
          </div>
          <div className="attack-rail shell" aria-label={t.attackLabel}><div className="attack-rail-heading"><span>{t.attackLabel}</span><span>{t.attackHint}<ArrowUpRight size={12}/></span></div><div className="attack-objects">{t.attacks.map((attack,i)=><button className="attack-artifact" key={i} onClick={()=>setModal({type:'attack',index:i})} aria-haspopup="dialog"><span className="artifact-visual" aria-hidden="true" style={{backgroundImage:`url(${import.meta.env.BASE_URL}attack-equipment.png)`,backgroundPosition:`${i*25}% 50%`}}/><span className="artifact-label"><small>0{i+1} / THREAT</small>{attack.title}<ArrowUpRight size={12}/></span><span className="artifact-tooltip" aria-hidden="true"><strong>{attack.short}</strong><span>{attack.impact}</span></span></button>)}</div></div>
          <div className="hero-bottom shell"><span><span className="tiny-line"/>CISO ADVISORY <i/> CIO STRATEGY <i/> CTO LEADERSHIP</span><a href="#expertise">{t.scroll}<ArrowDown size={14}/></a></div>
        </section>
        <section className="trust-strip shell" aria-label={t.trust}><p>{t.trust}</p><div className="company-row"><span className="company icl">ICL<span className="icl-mark">◒</span></span><span className="company ministry"><span className="ministry-icon">≋</span>{t.gov}</span><span className="company babylon">babylon<span className="orange-dot"/></span><span className="company bezeq">BEZEQ</span><span className="company military"><ShieldCheck size={21}/>{t.military}</span></div></section>
    </div>

    <section className="expertise section shell" id="expertise"><div className="section-heading"><div><p className="eyebrow section-label">{t.expertiseLabel}</p><h2>{t.expertiseTitle}</h2></div><p className="section-description">{t.expertiseIntro}</p></div><div className="service-grid">{t.services.map((service, i) => { const Icon = icons[i]; return <article className="service-card" key={i}><div className="card-top"><span className="service-icon"><Icon size={26} strokeWidth={1.5}/></span><span className="card-number">0{i+1}</span></div><span className="card-tag">{service.tag}</span><h3>{service.title}</h3><p>{service.desc}</p><ul>{service.bullets.map(b => <li key={b}><span/>{b}</li>)}</ul><button className="card-action" onClick={() => setModal({type:'service',index:i})}>{t.serviceAction}<ArrowUpRight size={18}/></button></article>;})}</div><div className="results-grid">{['20+','25%','40%','03'].map((n,i) => <div key={n}><strong dir="ltr">{n}<span>{i === 0 ? '+' : ''}</span></strong><p>{t.results[i]}</p></div>)}</div><p className="results-note">{t.resultsNote}</p></section>

    <section className="experience section" id="experience"><div className="shell experience-layout"><div className="experience-intro"><p className="eyebrow section-label">{t.expLabel}</p><h2>{t.expTitle}</h2><p>{t.expIntro}</p><div className="experience-stamp"><Fingerprint size={60} strokeWidth={1}/><div>BUILT ON EXPERIENCE.<br/><span>DRIVEN BY RESPONSIBILITY.</span></div></div></div><div className="timeline">{t.jobs.map((job,i) => <article className="timeline-item" key={i}><div className="timeline-date"><span className={i===0?'current-dot':''}/>{job.date}</div><h3>{job.org}</h3><h4>{job.role}</h4><p>{job.desc}</p>{job.metric && <span className="job-metric"><ArrowUpRight size={13}/>{job.metric}</span>}</article>)}</div></div></section>

    <section className="about section shell" id="about"><div className="about-main"><p className="eyebrow section-label">{t.aboutLabel}</p><h2>{t.aboutTitle}</h2><p>{t.aboutText}</p><p>{t.aboutText2}</p><div className="signature">Sergey Shlomov<span>{t.independent}</span></div></div><div className="about-right"><div className="military-card"><ShieldCheck size={28} strokeWidth={1.5}/><div><span className="eyebrow">{t.mamram}</span><h3>MAMRAM / ממר״ם</h3><p>{t.mamramText}</p></div></div><div className="education"><h3>{t.eduTitle}</h3>{t.education.map(([degree,desc]) => <div className="education-row" key={degree}><span dir="ltr">{degree}</span><p>{desc}</p><Check size={16}/></div>)}</div><p className="about-note">{t.aboutDisclaimer}</p></div></section>

    <section className="lab-section section" id="lab"><div className="shell lab-layout"><div className="lab-visual"><img src={`${import.meta.env.BASE_URL}security-lab.webp`} loading="lazy" alt={t.labAlt}/><div className="lab-photo-caption"><FlaskConical size={15}/><span>SECURITY LAB / WORKSTATIONS</span><span>{t.scenarioNote}</span></div></div><div className="lab-content"><p className="eyebrow section-label">{t.labLabel}</p><h2>{t.labTitle}</h2><p className="lab-intro">{t.labIntro}</p><div className="lab-tabs" role="tablist" aria-label={t.labLabel}>{t.labTabs.map((label,i)=><button role="tab" id={`lab-tab-${i}`} key={i} aria-selected={lab===i} aria-controls="lab-panel" tabIndex={lab===i?0:-1} className={lab===i?'active':''} onClick={()=>setLab(i)} onKeyDown={e=>{if(['ArrowRight','ArrowLeft','Home','End'].includes(e.key)){e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?2:(lab+(e.key==='ArrowRight'?1:2))%3;setLab(next);document.getElementById(`lab-tab-${next}`)?.focus();}}}>{i===0?<Monitor size={14}/>:i===1?<Layers3 size={14}/>:<ShieldCheck size={14}/>}<span>{label}</span></button>)}</div><div id="lab-panel" role="tabpanel" aria-labelledby={`lab-tab-${lab}`}><h3>{t.labDetails[lab].heading}</h3><p>{t.labDetails[lab].text}</p><ul>{t.labDetails[lab].checks.map(check=><li key={check}><Check size={14}/>{check}</li>)}</ul></div><button className="lab-cta" onClick={()=>contactService(0)}>{t.labAction}<ArrowUpRight size={16}/></button><p className="lab-note">{t.labNote}</p></div></div></section>

    <section className="threat-section section" id="briefing"><div className="shell threat-layout"><div><p className="eyebrow"><span className="signal-dot"/>{t.briefLabel}</p><h2>{t.briefTitle}</h2><p className="threat-intro">{t.briefText}</p><div className="brief-tabs" role="tablist" aria-label={t.briefLabel}>{t.briefKinds.map((name,i) => <button role="tab" id={`brief-tab-${i}`} aria-selected={brief===i} aria-controls="brief-panel" tabIndex={brief===i?0:-1} key={i} className={brief===i?'active':''} onClick={() => setBrief(i)} onKeyDown={e => {if(['ArrowRight','ArrowLeft','Home','End'].includes(e.key)){e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?2:(brief+(e.key==='ArrowRight'?1:2))%3;setBrief(next);document.getElementById(`brief-tab-${next}`)?.focus();}}}><span>0{i+1}</span>{name}<ChevronRight size={14}/></button>)}</div></div><div className="brief-panel" role="tabpanel" id="brief-panel" aria-labelledby={`brief-tab-${brief}`}><div className="brief-panel-top"><Activity size={20}/><span>THREAT SCENARIO / 0{brief+1}</span><span className="signal-dot"/></div><div className="brief-graphic" aria-hidden="true"><div className="graphic-orbit orbit-one"/><div className="graphic-orbit orbit-two"/><div className="graphic-center"><LockKeyhole size={33} strokeWidth={1.3}/></div><span className="graphic-node node-a"/><span className="graphic-node node-b"/><span className="graphic-node node-c"/><span className="graphic-code">IDENTIFY → PRIORITIZE → PROTECT</span></div><h3>{t.briefDetails[brief].title}</h3><p>{t.briefDetails[brief].text}</p><div className="brief-action"><ShieldCheck size={20}/><span>{t.briefDetails[brief].action}</span></div><p className="brief-note">{t.briefDisclaimer}</p></div></div></section>

    <section className="contact section shell" id="contact"><div className="contact-copy"><p className="eyebrow section-label">{t.contactLabel}</p><h2>{t.contactTitle}</h2><p>{t.contactText}</p><a className="contact-method" href="#contact-form" onClick={()=>{setModal(null);requestAnimationFrame(()=>document.querySelector('[name="name"]')?.focus({preventScroll:true}));}}><span className="contact-icon"><Mail size={21}/></span><span><small>{t.emailMe}</small><b dir="ltr">shlomovs@gmail.com</b></span><ArrowUpRight size={20}/></a><a className="contact-method" href="tel:+972547607213"><span className="contact-icon"><Phone size={21}/></span><span><small>{t.callMe}</small><b dir="ltr">+972 54 760 7213</b></span><ArrowUpRight size={20}/></a><span className="contact-location"><Globe2 size={15}/>{t.location}</span></div><div className="contact-form-wrap"><form id="contact-form" onSubmit={sendMessage} aria-busy={sendState==='sending'}><label className="form-honeypot" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off"/></label><div className="form-row"><label>{t.fullName}<input name="name" autoComplete="name" required placeholder={lang==='he'?'השם המלא':lang==='ru'?'Имя и фамилия':'Your full name'} maxLength={120}/></label><label>{t.email}<input name="email" type="email" autoComplete="email" required placeholder="you@company.com" dir="ltr" maxLength={200}/></label></div><label>{t.interest}<select value={interest} onChange={e => setInterest(e.target.value)}>{t.interests.map((s,i) => <option key={s} value={i}>{s}</option>)}</select></label><label>{t.message}<textarea name="message" required rows={4} maxLength={4000} placeholder={lang==='he'?'ספרו לי קצת על הארגון ועל האתגר…':lang==='ru'?'Расскажите о компании и вашей задаче…':'Tell me a little about your organization and what’s ahead…'}/></label>{formError && <p className="form-error" role="alert">{t.error}</p>}<button className="button primary form-submit" type="submit" disabled={sendState==='sending'}>{sendState==='sending'?t.sending:t.send}<ArrowUpRight size={18}/></button><p className="form-note"><LockKeyhole size={12}/>{t.formNote}</p></form>{sendState==='sent' && <div className="form-feedback sent" role="status"><Check size={18}/>{t.sent}</div>}{sendState==='error' && <p className="form-feedback error" role="alert">{sendCode==='MAIL_NOT_CONFIGURED'?t.mailUnavailable:sendCode==='RATE_LIMITED'?t.rateError:t.sendError}</p>}</div></section>
    </main>
    <footer className="footer"><div className="shell footer-main"><a className="brand" href="#top"><span className="brand-symbol"><ShieldCheck size={26}/></span><span>SERGEY<span className="brand-last">SHLOMOV<span className="brand-dot">.</span></span></span></a><p>{t.independent}</p><a className="back-top" href="#top">{t.backTop}<ArrowUpRight size={17}/></a></div><div className="shell footer-bottom"><span>{t.rights}</span><button onClick={() => setModal({type:'privacy'})}>{t.privacy}</button><span className="footer-location">ISRAEL / WORLDWIDE <span className="signal-dot"/></span></div></footer>

    {modal && <div className="modal-backdrop" onClick={e => {if(e.target===e.currentTarget)setModal(null);}}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="dialog-title" ref={dialogRef}><button className="modal-close" onClick={() => setModal(null)} aria-label={t.close}><X size={22}/></button>{currentService ? <><div className="modal-icon"><ServiceIcon size={30}/></div><p className="eyebrow section-label">{currentService.tag}</p><h2 id="dialog-title">{currentService.title}</h2><p>{currentService.detail}</p><ul className="modal-list">{currentService.bullets.map(b => <li key={b}><Check size={17}/>{b}</li>)}</ul><div className="modal-deliverable"><span className="eyebrow">{t.deliverable}</span><p>{currentService.output}</p></div><button className="button primary" onClick={() => contactService(modal.index)}>{t.discuss}<ArrowUpRight size={18}/></button></> : currentAttack ? <><p className="eyebrow section-label">{t.caseLabel} / 0{modal.index+1}</p><h2 id="dialog-title">{currentAttack.title}</h2><p>{currentAttack.problem}</p><div className="case-impact"><h3>{t.impactLabel}</h3><p>{currentAttack.impact}</p></div><div className="case-response"><h3><ShieldCheck size={19}/>{t.responseLabel}</h3><p>{currentAttack.response}</p></div><a className="case-source" href={attackSources[currentAttack.source].url} target="_blank" rel="noopener noreferrer">{t.sourcesLabel}: {attackSources[currentAttack.source].label}<ArrowUpRight size={13}/></a><button className="button primary" onClick={()=>contactService(0)}>{t.caseAction}<ArrowUpRight size={18}/></button></> : modal.type === 'privacy' ? <><LockKeyhole className="privacy-icon"/><h2 id="dialog-title">{t.privacyTitle}</h2><p>{t.privacyText}</p><a href="#contact-form" onClick={()=>{setModal(null);requestAnimationFrame(()=>document.querySelector('[name="name"]')?.focus({preventScroll:true}));}}>shlomovs@gmail.com</a></> : <><div className="modal-icon"><Radio size={30}/></div><p className="eyebrow section-label">{t.briefLabel}</p><h2 id="dialog-title">{t.briefDetails[brief].title}</h2><p>{t.briefDetails[brief].text}</p><div className="modal-deliverable"><ShieldCheck size={22}/><p>{t.briefDetails[brief].action}</p></div><p className="modal-note">{t.briefDisclaimer}</p><button className="button primary" onClick={() => {setModal(null);requestAnimationFrame(()=>document.getElementById('briefing').scrollIntoView({behavior:'smooth'}));}}>{t.briefLabel}<ArrowRight size={18}/></button></>}</div></div>}
  </>;
}

createRoot(document.getElementById('root')).render(<App/>);
