/* ---------------- reveal the sidebar once, the first time the user scrolls down a little ----------------
   `autoRevealed` is separate from the sidebar's actual open/closed state on purpose: it only
   guards this one-time auto-open. If it were the same flag the manual hamburger toggle writes to,
   closing the menu anywhere on the page and then scrolling even slightly would flip it back to
   "not revealed" and immediately pop it open again -- this is a plain threshold check on
   window.scrollY, not tied to any element's position, so it can't misfire once it has fired. */
let autoRevealed = false;
function revealSidebar(){
  autoRevealed = true;
  document.getElementById('sidebar').classList.add('show');
  document.getElementById('heroLeft').classList.add('shift');
  document.getElementById('menuBtn').classList.add('open');
  document.body.classList.add('sidebar-open');
}
/* mobile users open the menu deliberately by tapping the hamburger; auto-popping a drawer
   over content they haven't scrolled to yet is more useful as a discovery hint on PC. */
window.addEventListener('scroll', () => {
  if(!autoRevealed && window.innerWidth > 1024 && window.scrollY > 40) revealSidebar();
}, {passive:true});

/* ---------------- hamburger toggle (manual open/close) ---------------- */
const menuBtn = document.getElementById('menuBtn');
const markEl = document.getElementById('mark');
const sidebarEl = document.getElementById('sidebar');
const heroLeftEl = document.getElementById('heroLeft');
menuBtn.addEventListener('click', () => {
  const isOpen = sidebarEl.classList.toggle('show');
  menuBtn.classList.toggle('open', isOpen);
  heroLeftEl.classList.toggle('shift', isOpen);
  document.body.classList.toggle('sidebar-open', isOpen);
});

/* ---------------- navigation: the whole site is one document now, so every nav action is just a scroll ---------------- */
function scrollToSection(id){
  const el = document.getElementById(id);
  if(el) el.scrollIntoView({ behavior:'smooth', block:'start' });
}

document.querySelectorAll('.nav-group[data-group]').forEach(group => {
  group.querySelector('.head').addEventListener('click', () => {
    const willOpen = !group.classList.contains('open');
    document.querySelectorAll('.nav-group[data-group]').forEach(g => g.classList.remove('open'));
    if(willOpen) group.classList.add('open');
    if(group.dataset.top) scrollToSection(group.dataset.top);
  });
});

document.querySelectorAll('a[data-target]').forEach(a => {
  a.addEventListener('click', (e) => {
    e.preventDefault();
    scrollToSection(a.dataset.target);
  });
});
document.querySelectorAll('.nav-group.contact-row').forEach(row => {
  row.addEventListener('click', () => scrollToSection(row.dataset.target));
});
markEl.addEventListener('click', (e) => {
  if(e.target === markEl || e.target.classList.contains('wordmark')){
    window.scrollTo({ top:0, behavior:'smooth' });
    sidebarEl.classList.remove('show');
    menuBtn.classList.remove('open');
    heroLeftEl.classList.remove('shift');
    document.body.classList.remove('sidebar-open');
  }
});

document.getElementById('backToTop').addEventListener('click', (e) => {
  e.preventDefault();
  window.scrollTo({ top:0, behavior:'smooth' });
});

/* ---------------- magnetic hover on text links ----------------
   only active while the cursor is over one specific small link, so unlike the old
   scroll-driven animations this never touches more than one element at a time. */
document.querySelectorAll('.link').forEach(el => {
  el.addEventListener('mousemove', (e) => {
    const r = el.getBoundingClientRect();
    const relX = e.clientX - (r.left + r.width / 2);
    const relY = e.clientY - (r.top + r.height / 2);
    el.style.transform = `translate(${relX * 0.25}px, ${relY * 0.35}px)`;
  });
  el.addEventListener('mouseleave', () => { el.style.transform = ''; });
});

/* ---------------- selected works marquee: jump to the matching card in the works grid ---------------- */
document.querySelectorAll('.sel-card[data-modal]').forEach(a => {
  a.addEventListener('click', (e) => {
    e.preventDefault();
    a.blur(); /* don't leave focus on the strip */
    const card = document.querySelector('.wcard[data-modal="' + a.dataset.modal + '"]');
    if(!card) return;
    card.scrollIntoView({ behavior:'smooth', block:'center' });
    card.classList.remove('flash');
    void card.offsetWidth;
    card.classList.add('flash');
    setTimeout(() => card.classList.remove('flash'), 2000);
  });
});

/* ---------------- selected works strip: drifts left by itself, scrollable by hand ----------------
   one element, driven through scrollLeft (no transform animation). Three identical groups; it lives in the
   middle one and wraps by exactly one group width, so the loop is invisible. Any wheel/touch/drag/keyboard
   input pauses the drift for a couple of seconds; momentum scrolling is detected by scrollLeft drifting away
   from what the script last wrote. */
(function(){
  const mq = document.querySelector('.marquee');
  if(!mq) return;
  const groups = mq.querySelectorAll('.marquee-group');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DRIFT_SECONDS = 64;   /* time to travel one group width */
  const IDLE_MS = 2500;       /* resume drifting this long after the last interaction */
  let S = 0, pos = 0, lastWritten = 0, lastInput = 0, last = 0;
  let visible = false, dragging = false, moved = false, startX = 0, startLeft = 0;

  const touch = () => { lastInput = performance.now(); };
  function measure(){
    const w = groups[0].getBoundingClientRect().width;
    if(!w) return;
    const first = !S;
    const frac = S ? ((mq.scrollLeft % S) / S) : 0;
    S = w;
    mq.scrollLeft = S + (first ? 0 : frac * S);
    pos = lastWritten = mq.scrollLeft;
  }
  function normalize(){
    if(!S) return;
    if(mq.scrollLeft >= 2 * S) mq.scrollLeft -= S;
    else if(mq.scrollLeft < 1) mq.scrollLeft += S;
    pos = lastWritten = mq.scrollLeft;
  }
  function tick(ts){
    requestAnimationFrame(tick);
    const dt = Math.min(ts - last, 100) / 1000; last = ts;
    if(!visible || !S) return;
    const now = performance.now();
    if(Math.abs(mq.scrollLeft - lastWritten) > 1.5){ lastInput = now; pos = lastWritten = mq.scrollLeft; }
    if(dragging || now - lastInput < IDLE_MS){
      if(!dragging && now - lastInput > 600) normalize();
      pos = lastWritten = mq.scrollLeft;
      return;
    }
    if(reduce) return;
    pos += (S / DRIFT_SECONDS) * dt;
    if(pos >= 2 * S) pos -= S;
    mq.scrollLeft = pos;
    lastWritten = mq.scrollLeft;
  }

  new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(mq);
  window.addEventListener('resize', measure);
  window.addEventListener('load', measure);
  mq.addEventListener('wheel', e => { if(Math.abs(e.deltaX) > Math.abs(e.deltaY)) touch(); }, {passive:true});
  mq.addEventListener('touchstart', touch, {passive:true});
  mq.addEventListener('keydown', touch);
  mq.addEventListener('dragstart', e => e.preventDefault());

  /* mouse drag (touch and trackpads scroll natively) */
  mq.addEventListener('mousedown', e => {
    if(e.button !== 0) return;
    dragging = true; moved = false; startX = e.clientX; startLeft = mq.scrollLeft;
    mq.classList.add('dragging');
  });
  window.addEventListener('mousemove', e => {
    if(!dragging) return;
    const dx = e.clientX - startX;
    if(Math.abs(dx) > 5) moved = true;
    mq.scrollLeft = startLeft - dx;
  });
  window.addEventListener('mouseup', () => {
    if(!dragging) return;
    dragging = false; mq.classList.remove('dragging'); touch();
  });
  /* a drag must not count as a click on the card underneath */
  mq.addEventListener('click', e => { if(moved){ e.preventDefault(); e.stopPropagation(); moved = false; } }, true);

  measure();
  requestAnimationFrame(tick);
})();

/* ---------------- grid thumbnail preview videos ----------------
   each wcard-thumb video is a short 3s muted loop clip. Only the ones currently on screen
   play (IntersectionObserver), and all of them pause whenever a modal is open -- so at most
   one video decodes at a time: either the visible thumbs, or the modal's own video, never both. */
const wcardVideos = document.querySelectorAll('.wcard-vid');
let modalIsOpen = false;
const wcardVideoObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if(modalIsOpen) return;
    if(entry.isIntersecting) entry.target.play().catch(() => {});
    else entry.target.pause();
  });
}, { rootMargin: '100px 0px' });
wcardVideos.forEach(v => wcardVideoObserver.observe(v));

/* ---------------- work / project detail modals ---------------- */
function openModal(id){
  const m = document.getElementById(id);
  if(!m) return;
  modalIsOpen = true;
  wcardVideos.forEach(v => v.pause());
  m.classList.add('active');
  /* modal images carry data-src so nothing in a closed modal is ever requested/decoded */
  m.querySelectorAll('img[data-src]').forEach(img => { img.src = img.dataset.src; img.removeAttribute('data-src'); });
  m.querySelectorAll('video').forEach(v => {
    v.muted = false;
    v.currentTime = 0;
    v.play().catch(() => {});
  });
}
function closeModal(){
  document.querySelectorAll('.modal-overlay.active').forEach(m => {
    m.classList.remove('active');
    m.querySelectorAll('video').forEach(v => { v.pause(); v.muted = true; });
  });
  modalIsOpen = false;
  wcardVideos.forEach(v => {
    const r = v.getBoundingClientRect();
    if(r.top < window.innerHeight && r.bottom > 0) v.play().catch(() => {});
  });
}
document.querySelectorAll('.wcard[data-modal]').forEach(card => {
  card.addEventListener('click', () => openModal(card.dataset.modal));
});
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', (e) => { if(e.target === overlay) closeModal(); });
  overlay.querySelector('[data-modal-close]').addEventListener('click', closeModal);
});

/* ---------------- scroll-spy: highlight current works/projects category in sidebar ---------------- */
function setupScrollSpy(sectionSelector, pageKey){
  const sections = document.querySelectorAll(sectionSelector);
  if(!sections.length) return;
  const links = document.querySelectorAll(`.sidebar a[data-page="${pageKey}"]`);
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        links.forEach(l => l.classList.toggle('current', l.dataset.target === entry.target.id));
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
  sections.forEach(s => observer.observe(s));
}
setupScrollSpy('.grid-section', 'stage-works');
setupScrollSpy('.wcard[id^="grid-"]', 'stage-projects');
setupScrollSpy('.profile-section', 'profile');
