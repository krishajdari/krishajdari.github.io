// Site behaviour: menu, plus the scroll and load animations.
// Sections: 1. Menu  2. Letter reveal  3. Card fade-in
//           4. Hero parallax  5. Hide nav on scroll  6. Page transitions
// Animations are skipped for visitors who prefer reduced motion.

const root = document.documentElement;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (!reduceMotion) root.classList.add('js-motion');


/* 1. Menu ----------------------------------------------------------------
   The menu button opens the menu and, turned into an X, closes it again. */

const menu = document.querySelector('.menu');
const menuButtons = document.querySelectorAll('[data-menu-open]');

function setMenu(open) {
  menu.classList.toggle('is-open', open);
  menu.setAttribute('aria-hidden', String(!open));
  root.classList.toggle('menu-open', open);
  if (open) root.classList.remove('nav-hidden');
  menuButtons.forEach((button) => {
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
}

menuButtons.forEach((button) => {
  button.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
});
document.querySelectorAll('[data-menu-close]').forEach((el) => {
  el.addEventListener('click', () => setMenu(false));
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') setMenu(false);
});
menu.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => setMenu(false));
});


/* 2. Letter-by-letter reveal ----------------------------------------------
   Splits text into letters (words stay together so lines never break
   mid-word) and fades the letters in one after another, once. */

const REVEAL_SELECTOR = [
  '.page-title',
  '.statement h2',
  '.service__text h2',
  '.service__text p',
  '.work__head h2',
  '.card__body h2',
  '.card__body h3',
  '.card__body p',
].join(',');

function splitIntoLetters(el) {
  const text = el.textContent.trim();
  el.setAttribute('aria-label', text);
  el.textContent = '';
  let i = 0;
  text.split(/\s+/).forEach((word, w) => {
    if (w > 0) el.append(' ');
    const wordEl = document.createElement('span');
    wordEl.className = 'word';
    wordEl.setAttribute('aria-hidden', 'true');
    for (const letter of word) {
      const charEl = document.createElement('span');
      charEl.className = 'char';
      charEl.style.setProperty('--i', i++);
      charEl.textContent = letter;
      wordEl.append(charEl);
    }
    el.append(wordEl);
  });
  el.classList.add('split');
}

// Calls `callback` once for each element the first time it scrolls into view
function onFirstView(elements, callback, options = {}) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      callback(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', ...options });
  elements.forEach((el) => observer.observe(el));
}

if (!reduceMotion) {
  const revealed = document.querySelectorAll(REVEAL_SELECTOR);
  revealed.forEach(splitIntoLetters);
  onFirstView(revealed, (el) => el.classList.add('is-revealed'));
}


/* 3. Project cards fade in ---------------------------------------------------
   Image first, then its title and description (timing lives in the CSS). */

if (!reduceMotion) {
  onFirstView(document.querySelectorAll('.card'), (card) => {
    card.classList.add('is-revealed');
  }, { rootMargin: '0px 0px -15% 0px' });
}


/* 4. Hero image parallax ----------------------------------------------------
   The photo drifts down at 40% of the scroll distance while the hero shows. */

const hero = document.querySelector('.hero');
const heroImage = document.querySelector('.hero__image');


/* 5. Hide the navigation while scrolling down ------------------------------ */

let lastScrollY = window.scrollY;
let ticking = false;

function onScrollFrame() {
  ticking = false;
  const y = window.scrollY;

  if (heroImage && y < hero.offsetTop + hero.offsetHeight) {
    heroImage.style.transform = `translateY(${y * 0.4}px)`;
  }

  if (!root.classList.contains('menu-open') && Math.abs(y - lastScrollY) > 4) {
    root.classList.toggle('nav-hidden', y > lastScrollY && y > 80);
    lastScrollY = y;
  }
}

if (!reduceMotion) {
  window.addEventListener('scroll', () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScrollFrame);
    }
  }, { passive: true });
}


/* 6. Page transitions -------------------------------------------------------
   Links to other pages of this site fade the page out before leaving
   (the new page fades in through CSS). Email, phone, external sites,
   new-tab links and jumps within the same page are left alone. */

const FADE_OUT_MS = 350;

function isPageChange(link, event) {
  if (event.defaultPrevented || event.button !== 0) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
  if (link.target === '_blank' || link.hasAttribute('download')) return false;
  const url = new URL(link.href, location.href);
  if (!/^https?:|^file:/.test(url.protocol)) return false;   // mailto:, tel:
  if (url.origin !== location.origin) return false;          // other websites
  if (url.pathname === location.pathname && url.hash) return false; // same-page jump
  return true;
}

if (!reduceMotion) {
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (!link || !isPageChange(link, event)) return;
    event.preventDefault();
    root.classList.add('is-leaving');
    setTimeout(() => { window.location.href = link.href; }, FADE_OUT_MS);
  });

  // Coming back with the browser's Back button can restore the faded-out page; show it again
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) root.classList.remove('is-leaving');
  });
}
