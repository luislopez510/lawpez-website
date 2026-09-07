/* LAWPEZ: funciones del sitio. El contenido funciona antes de cargar las animaciones. */
(() => {
 'use strict';
 const $ = (s,root=document) => root.querySelector(s);
 const $$ = (s,root=document) => [...root.querySelectorAll(s)];
 const readPreference = key => {try{return localStorage.getItem(key);}catch{return null;}};
 const savePreference = (key,value) => {try{localStorage.setItem(key,value);}catch{/* Navegación privada: funciona sin almacenamiento. */}};
 const reduced = matchMedia('(prefers-reduced-motion: reduce)');
 const spanish = {};
 $$('[data-t]').forEach(el => {spanish[el.dataset.t]=el.innerHTML;});
 $$('[data-alt]').forEach(el => {spanish[el.dataset.alt]=el.alt;});
 spanish.metaDescription=$('meta[name="description"]').content;
 spanish.closeMenu='Cerrar';spanish.resumeMotion='Reanudar movimiento';
 const copy={es:spanish,...(window.LAWPEZ_TRANSLATIONS || {})};
 let lang='es',activeProfile=0,paused=readPreference('lawpez-motion')==='paused';
 let mm=null,lenis=null,vendorReady=false,videoObserver=null;
 const counted=new Set();
 const t=key => copy[lang]?.[key] ?? spanish[key] ?? '';

 /* Idiomas: solo cambian las cadenas aprobadas del sitio. El aviso literal queda intacto. */
 function setLanguage(next) {
  if(!copy[next])return;
  lang=next;document.documentElement.lang=lang;
  $$('[data-t]').forEach(el => {if(t(el.dataset.t))el.innerHTML=t(el.dataset.t);});
  $$('[data-alt]').forEach(el => {el.alt=t(el.dataset.alt);});
  $$('[data-lang]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.lang===lang)));
  $('meta[name="description"]').content=t('metaDescription');
  $('#active-profile').textContent=t('profile'+activeProfile);
  const translated=$('#legal-translation');translated.hidden=lang==='es';translated.lang=lang;translated.textContent=lang==='es'?'':t('legalTranslation');
  $('#mobile-nav').setAttribute('aria-label',{es:'Navegación móvil',en:'Mobile navigation',fr:'Navigation mobile'}[lang]);
  $('.site-header .identity').setAttribute('aria-label',{es:'Lawpez, inicio',en:'Lawpez, home',fr:'Lawpez, accueil'}[lang]);
  $('nav.desktop-nav').setAttribute('aria-label',{es:'Principal',en:'Main navigation',fr:'Navigation principale'}[lang]);
  $('.profiles').setAttribute('aria-label',{es:'Perfiles de clientes',en:'Client profiles',fr:'Profils des clients'}[lang]);
  $('.marquee').setAttribute('aria-label',t('sixAreas'));
  $('.menu-toggle').setAttribute('aria-label',t($('.menu-toggle').getAttribute('aria-expanded')==='true'?'closeMenu':'menu'));
  updateMotionControls();updateStatLabels();savePreference('lawpez-language',lang);
  if(vendorReady)requestAnimationFrame(()=>configureMotion());
 }
 $$('[data-lang]').forEach(b=>b.addEventListener('click',()=>setLanguage(b.dataset.lang)));

 /* Menú móvil: cierra con Escape, con un enlace o al volver al tamaño de escritorio. */
 const menuButton=$('.menu-toggle'),mobileNav=$('#mobile-nav');
 function setMenu(open,restoreFocus=false) {
  menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',t(open?'closeMenu':'menu'));mobileNav.hidden=!open;
  document.body.classList.toggle('menu-open',open);
  $('#main').inert=open;$('footer').inert=open;
  if(open){lenis?.stop();$('a',mobileNav)?.focus();}else if(!paused)lenis?.start();
  if(restoreFocus)menuButton.focus();
 }
 menuButton.addEventListener('click',()=>setMenu(menuButton.getAttribute('aria-expanded')!=='true'));
 document.addEventListener('keydown',e=>{
  if(mobileNav.hidden)return;
  if(e.key==='Escape'){setMenu(false,true);return;}
  if(e.key==='Tab'){
   const focusable=$$('a,button',$('.site-header')).filter(el=>el.getClientRects().length&&!el.disabled);
   const first=focusable[0],last=focusable.at(-1);
   if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
   else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  }
 });
 $$('a',mobileNav).forEach(a=>a.addEventListener('click',()=>setMenu(false)));
 matchMedia('(min-width:961px)').addEventListener('change',e=>{if(e.matches)setMenu(false);});

 /* Acordeones nativos: Enter y Espacio funcionan incluso sin JavaScript. */
 const services=$$('.service');
 services.forEach(detail=>detail.addEventListener('toggle',()=>{
  if(detail.open){
   services.forEach(other=>{if(other!==detail)other.open=false;});
   $('#service-number').textContent=detail.dataset.num;
  }
  window.ScrollTrigger?.refresh();lenis?.resize();
 }));
 function selectProfile(index){
  activeProfile=index;
  $$('[data-profile]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.profile)===index)));
  $('#active-profile').textContent=t('profile'+index);
 }
 $$('[data-profile]').forEach(b=>b.addEventListener('click',()=>selectProfile(Number(b.dataset.profile))));
 $('#profile-service').addEventListener('click',event=>{
  event.preventDefault();
  const selected=$('[data-profile="'+activeProfile+'"]');
  const detail=$('.service[data-num="'+selected.dataset.service+'"]');detail.open=true;
  requestAnimationFrame(()=>{const summary=$('summary',detail);summary.focus({preventScroll:true});if(lenis)lenis.scrollTo(detail);else detail.scrollIntoView({behavior:reduced.matches||paused?'instant':'smooth',block:'start'});});
 });

 /* Les valeurs restent exactes sans animation et ne sont pas annoncées à chaque image. */
 function updateStatLabels(){
  const labels=['statCases','statExperience','statResponse'];
  $$('[data-count]').forEach((el,i)=>{
   el.setAttribute('aria-hidden','true');
   el.parentElement.setAttribute('aria-label',(i===2?'≤':'+')+el.dataset.count+(i===1?' '+t('years'):i===2?' h':'')+'. '+t(labels[i]));
  });
 }
 function updateMotionControls(){
  document.body.classList.toggle('motion-paused',paused||reduced.matches);
  $$('.motion-toggle').forEach(b=>{
   b.hidden=reduced.matches;b.setAttribute('aria-pressed',String(paused));
   const label=$('[data-t]',b);if(label)label.textContent=t(paused?'resumeMotion':'pauseMotion');
   const symbol=$('.pause-symbol',b);if(symbol)symbol.textContent=paused?'▷':'Ⅱ';
  });
 }
 $$('.motion-toggle').forEach(b=>b.addEventListener('click',()=>{
  paused=!paused;savePreference('lawpez-motion',paused?'paused':'playing');updateMotionControls();configureMotion();syncVideos();
 }));
 reduced.addEventListener('change',()=>{updateMotionControls();configureMotion();syncVideos();});

 /* Video: se descarga únicamente al entrar en pantalla, tras cargar el póster.
    Se pausa fuera de pantalla, en pestañas ocultas y cuando se solicita reducir movimiento. */
 function videoAllowed(){return !paused&&!reduced.matches&&!document.hidden&&!navigator.connection?.saveData;}
 function syncVideo(video){
  if(video.dataset.failed==='true'||!videoAllowed()||video.dataset.visible!=='true'){video.pause();return;} // Conserva el último fotograma: nunca vuelve al póster al salir.
  if(!video.getAttribute('src')){
   const small=matchMedia('(max-width:650px)').matches||['slow-2g','2g','3g'].includes(navigator.connection?.effectiveType);
   video.src=small&&video.dataset.srcMobile?video.dataset.srcMobile:video.dataset.src;video.load();
  }
  video.play().then(()=>{if(videoAllowed()&&video.dataset.visible==='true')video.classList.add('playing');else video.pause();}).catch(()=>video.classList.remove('playing'));
 }
 function syncVideos(){$$('video.cinema').forEach(syncVideo);}
 document.addEventListener('visibilitychange',syncVideos);
 const poster=$('.hero-film .poster');
 Promise.resolve(poster.decode?.()).catch(()=>{}).finally(()=>{
  if(!('IntersectionObserver' in window))return;
  videoObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
   entry.target.dataset.visible=String(entry.isIntersecting);syncVideo(entry.target);
  }),{threshold:.08});
  $$('video.cinema').forEach(v=>{v.addEventListener('error',()=>{v.classList.remove('playing');v.dataset.failed='true';});videoObserver.observe(v);});
 });

 /* Progressive enhancement: GSAP y ScrollTrigger desde cdnjs, con copia local de respaldo.
    Una caída del CDN nunca bloquea traducciones, menú, enlaces o contenido. */
 function loadVendor(url,backup,globalName){
  return new Promise((resolve,reject)=>{
   if(window[globalName]){resolve();return;}
   let script=document.createElement('script'),timer;
   const start=src=>{
    script.src=src;script.async=true;
    script.onload=()=>{clearTimeout(timer);window[globalName]?resolve():reject(new Error(globalName));};
    script.onerror=()=>{clearTimeout(timer);script.remove();if(backup){const local=backup;backup=null;script=document.createElement('script');start(local);}else reject(new Error(globalName));};
    timer=setTimeout(()=>script.onerror(),6500);document.head.append(script);
   };start(url);
  });
 }
 function configureMotion(){
  mm?.revert();mm=null;
  if(!vendorReady||paused||reduced.matches){document.documentElement.classList.remove('motion-ready');return;}
  const {gsap,ScrollTrigger}=window;
  mm=gsap.matchMedia();
  mm.add({desktop:'(min-width:961px)',fine:'(pointer:fine)',motion:'(prefers-reduced-motion:no-preference)'},ctx=>{
   if(!ctx.conditions.motion)return;
   const {desktop,fine}=ctx.conditions;
   let ticker;const numberTweens=[];
   if(desktop&&fine&&window.Lenis){
    lenis=new window.Lenis({lerp:.1,smoothWheel:true,syncTouch:false,anchors:true});
    lenis.on('scroll',ScrollTrigger.update);ticker=time=>lenis.raf(time*1000);gsap.ticker.add(ticker);gsap.ticker.lagSmoothing(0);
   }
   // Una secuencia dominante: la película pasa de ventana editorial a plano completo.
   // Todas las máscaras se revierten al pausar o activar movimiento reducido.
   if(desktop){
    document.documentElement.classList.add('motion-ready');
    gsap.fromTo('.hero-film',{scale:.58,transformOrigin:'right top'},
     {scale:1,ease:'none',scrollTrigger:{trigger:'.hero-stage',start:'top 48%',end:'bottom bottom',scrub:true,invalidateOnRefresh:true}});
    gsap.to('.hero-stage-note',{opacity:0,y:-30,ease:'none',scrollTrigger:{trigger:'.hero-stage',start:'top 30%',end:'top top-=80',scrub:true}});
    gsap.to('.hero-wordmark',{yPercent:-20,ease:'none',scrollTrigger:{trigger:'.hero-brand',start:'top top',end:'bottom top',scrub:true}});
    // Texte lisible en contour, puis rempli au rythme de la lecture. Reconstruit après traduction.
    $$('.approach-title [data-t],#services-title [data-t],#team-title [data-t]').forEach(el=>{
     if(!el.querySelector('.read-word')){
      const text=el.textContent;el.textContent='';
      text.split(/(\s+)/).forEach(word=>{if(/\S/.test(word)){const span=document.createElement('span');span.className='read-word';span.textContent=word;el.append(span);}else el.append(document.createTextNode(word));});
     }
     gsap.fromTo($$('.read-word',el),{'--fill':'0%'},{'--fill':'100%',stagger:.16,ease:'none',scrollTrigger:{trigger:el,start:'top 85%',end:'top 38%',scrub:true}});
    });
    gsap.from('.approach-title',{scale:.68,transformOrigin:'left center',ease:'none',scrollTrigger:{trigger:'.approach-title',start:'top 95%',end:'top 32%',scrub:true}});
    gsap.fromTo('.media-cube',{'--turn':'0deg'},{'--turn':'-90deg',ease:'none',scrollTrigger:{trigger:'.approach-grid',start:'top 75%',end:'bottom 35%',scrub:true}});
    gsap.from('#services-title',{scale:.76,transformOrigin:'left center',ease:'none',scrollTrigger:{trigger:'#services-title',start:'top 90%',end:'top 30%',scrub:true}});
    gsap.from('.interlude-copy',{yPercent:100,ease:'none',scrollTrigger:{trigger:'.interlude',start:'top 45%',end:'bottom bottom',scrub:true}});
    gsap.from('.person:first-child .person-photo',{clipPath:'inset(0% 14% 0% 14%)',ease:'none',scrollTrigger:{trigger:'.person:first-child',start:'top 90%',end:'top 25%',scrub:true}});
    gsap.from('.contact h2',{xPercent:-4,ease:'none',scrollTrigger:{trigger:'.contact',start:'top 90%',end:'top 35%',scrub:true}});
   }
   $$('[data-count]').forEach(el=>{
    if(counted.has(el))return;
    ScrollTrigger.create({trigger:el,start:'top 90%',once:true,onEnter:()=>{
     counted.add(el);const value={n:0};const end=Number(el.dataset.count);
     numberTweens.push(gsap.to(value,{n:end,duration:1.25,ease:'power2.out',onUpdate:()=>el.textContent=String(Math.round(value.n)),onComplete:()=>el.textContent=String(end)}));
    }});
   });
   return ()=>{numberTweens.forEach(tween=>tween.kill());document.documentElement.classList.remove('motion-ready');if(ticker)gsap.ticker.remove(ticker);lenis?.destroy();lenis=null;$$('[data-count]').forEach(el=>el.textContent=el.dataset.count);};
  });
  document.fonts?.ready.then(()=>ScrollTrigger.refresh());
 }
 /* Marquage de la section active, indépendant des bibliothèques d'animation. */
 if('IntersectionObserver'in window){
  const sectionsObserver=new IntersectionObserver(entries=>{
   const visible=entries.filter(e=>e.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];if(!visible)return;
   $$('.desktop-nav a').forEach(a=>{if(a.hash==='#'+visible.target.id)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});
  },{rootMargin:'-15% 0px -55% 0px',threshold:0});
  $$('main section[id]').forEach(s=>sectionsObserver.observe(s));
 }
 setLanguage(readPreference('lawpez-language')||'es');
 loadVendor('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/gsap.min.js','/assets/vendor/gsap.min.js','gsap')
 .then(()=>loadVendor('https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/ScrollTrigger.min.js','/assets/vendor/ScrollTrigger.min.js','ScrollTrigger'))
 .then(()=>loadVendor('https://unpkg.com/lenis@1.3.26/dist/lenis.min.js','/assets/vendor/lenis.min.js','Lenis').catch(()=>{}))
 .then(()=>{vendorReady=true;window.gsap.registerPlugin(window.ScrollTrigger);configureMotion();})
 .catch(()=>{document.documentElement.classList.remove('motion-ready');});
})();
