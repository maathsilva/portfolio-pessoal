function initMobileMenu() {
  const toggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');
  const menu = document.querySelector<HTMLElement>('[data-menu]');
  if (!toggle || !menu) return;

  const closeMenu = () => {
    toggle.setAttribute('aria-expanded', 'false');
    menu.classList.remove('is-open');
  };

  toggle.addEventListener('click', () => {
    const isOpen = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!isOpen));
    menu.classList.toggle('is-open', !isOpen);
  });

  menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });
}

function initActiveNav() {
  const links = document.querySelectorAll<HTMLAnchorElement>('.nav-link[href^="#"], .nav-link[href^="/#"]');
  const sections = Array.from(links)
    .map((link) => document.getElementById(link.hash.replace('#', '')))
    .filter((el): el is HTMLElement => Boolean(el));

  if (!sections.length || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const link = document.querySelector(`.nav-link[href$="#${entry.target.id}"]`);
        if (!link) return;
        if (entry.isIntersecting) {
          links.forEach((l) => l.removeAttribute('aria-current'));
          link.setAttribute('aria-current', 'true');
        }
      });
    },
    { rootMargin: '-40% 0px -55% 0px' }
  );

  sections.forEach((section) => observer.observe(section));
}

function initTypewriter() {
  const el = document.querySelector<HTMLElement>('[data-typewriter]');
  if (!el) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) return; // keep the static, server-rendered word

  let words: string[] = [];
  try {
    words = JSON.parse(el.dataset.words ?? '[]');
  } catch {
    return;
  }
  if (words.length < 2) return;

  const TYPE_SPEED = 70;
  const DELETE_SPEED = 40;
  const HOLD_TIME = 2000;

  let wordIndex = 0;
  let charIndex = words[0].length;
  let deleting = true; // word 0 is already fully rendered server-side; go straight to deleting it

  function tick() {
    const currentWord = words[wordIndex];

    if (!deleting) {
      charIndex++;
      if (charIndex > currentWord.length) {
        deleting = true;
        setTimeout(tick, HOLD_TIME);
        return;
      }
      el!.textContent = currentWord.slice(0, charIndex);
      setTimeout(tick, TYPE_SPEED);
      return;
    }

    charIndex--;
    el!.textContent = currentWord.slice(0, Math.max(charIndex, 0));
    if (charIndex <= 0) {
      deleting = false;
      wordIndex = (wordIndex + 1) % words.length;
      charIndex = 0;
      setTimeout(tick, 300);
      return;
    }
    setTimeout(tick, DELETE_SPEED);
  }

  setTimeout(tick, HOLD_TIME);
}

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initActiveNav();
  initTypewriter();
});
