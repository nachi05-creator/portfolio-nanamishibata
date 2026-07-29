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
