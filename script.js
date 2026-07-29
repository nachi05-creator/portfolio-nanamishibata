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
window.addEventListener('scroll', () => {
  if(!autoRevealed && window.scrollY > 40) revealSidebar();
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

/* ---------------- wcard thumb videos: only decode/play the one on screen ----------------
   there are 25 of these on one long page. A 200px rootMargin meant several could be decoding
   at once on a fast scroll, and mobile Safari has a hard cap on simultaneous hardware video
   decoders -- blowing past it is a likely contributor to the tab crashing on real devices.
   0px margin plus pausing (not just not-playing) everything off-screen keeps at most a
   small handful of decoders alive at any moment. */
const thumbVideoObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    const v = entry.target;
    if(entry.isIntersecting && !document.querySelector('.modal-overlay.active')){
      v.play().catch(() => {});
    } else {
      v.pause();
      if(v.readyState > 0){ /* actually had decoded data -- release it, don't just pause */
        v.removeAttribute('src');
        v.load();
        v.src = v.dataset.src;
      }
    }
  });
}, { rootMargin: '0px' });
document.querySelectorAll('.wcard-thumb video').forEach(v => {
  v.dataset.src = v.currentSrc || v.src;
  thumbVideoObserver.observe(v);
});

/* ---------------- work / project detail modals ---------------- */
function openModal(id){
  const m = document.getElementById(id);
  if(!m) return;
  m.classList.add('active');
  document.querySelectorAll('.wcard-thumb video').forEach(v => v.pause());
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
  document.querySelectorAll('.wcard-thumb video').forEach(v => {
    const r = v.getBoundingClientRect();
    if(r.top < window.innerHeight + 200 && r.bottom > -200){ v.play().catch(() => {}); }
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
