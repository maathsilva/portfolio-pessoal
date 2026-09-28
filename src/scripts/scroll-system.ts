import { mountDataNetwork, type DataNetworkHandle } from './data-network';

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function initNavbarScroll() {
  const header = document.querySelector<HTMLElement>('[data-header]');
  if (!header) return;
  let ticking = false;
  const update = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 24);
    ticking = false;
  };
  update();
  window.addEventListener(
    'scroll',
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    },
    { passive: true }
  );
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

function initTypewriter() {
  const el = document.querySelector<HTMLElement>('[data-typewriter]');
  if (!el) return;
  if (reducedMotion()) return; // keep the static, server-rendered word

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

/** Arms the reveal system (see global.css) and staggers each group's children,
 * then fades elements in as they cross into view. No-op under reduced motion,
 * where the CSS default (fully visible) is left alone entirely. */
function initReveal() {
  if (reducedMotion() || !('IntersectionObserver' in window)) return;
  document.documentElement.classList.add('reveal-armed');

  document.querySelectorAll<HTMLElement>('[data-reveal-group]').forEach((group) => {
    Array.from(group.children).forEach((child, i) => {
      (child as HTMLElement).style.setProperty('--reveal-i', String(i));
      child.setAttribute('data-reveal', '');
    });
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.14, rootMargin: '0px 0px -8% 0px' }
  );
  document.querySelectorAll('[data-reveal]').forEach((el) => observer.observe(el));
}

/** Hero's ambient data network — always mounted when the canvas exists. */
function initHeroNetwork() {
  const canvas = document.querySelector<HTMLCanvasElement>('[data-hero-network]');
  if (!canvas) return;
  mountDataNetwork(canvas, { interactive: true, areaPerParticle: 8000, maxParticles: 110, baseSpeed: 0.1 });
}

/** The "entering the system" transition: as the section scrolls through the
 * viewport, its canvas intensifies and a radial vignette brightens, then both
 * hand off to the next section. Everything here is derived from one scroll
 * progress number, recomputed only while the section is near the viewport. */
function initSystemTransition() {
  const section = document.querySelector<HTMLElement>('[data-system-transition]');
  const canvas = section?.querySelector<HTMLCanvasElement>('[data-transition-network]');
  if (!section || !canvas) return;

  let network: DataNetworkHandle | null = null;
  let ticking = false;

  const progressFor = () => {
    const rect = section.getBoundingClientRect();
    const total = rect.height - window.innerHeight;
    if (total <= 0) return 1;
    const raw = -rect.top / total;
    return Math.max(0, Math.min(1, raw));
  };

  const update = () => {
    const p = progressFor();
    // Peaks near the middle of the section, easing back down at the very end
    // so it can hand off cleanly to the section that follows.
    const curve = p < 0.7 ? p / 0.7 : 1 - (p - 0.7) / 0.3;
    section.style.setProperty('--progress', curve.toFixed(3));
    network?.setIntensity(curve);
    ticking = false;
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  };

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries[0]?.isIntersecting;
        if (visible) {
          if (!network && !reducedMotion()) {
            network = mountDataNetwork(canvas, {
              interactive: false,
              areaPerParticle: 6000,
              maxParticles: 140,
              linkDistance: 170,
              baseSpeed: 0.22,
            });
          }
          window.addEventListener('scroll', onScroll, { passive: true });
          update();
        } else {
          window.removeEventListener('scroll', onScroll);
        }
      },
      { rootMargin: '15% 0px 15% 0px' }
    );
    io.observe(section);
  }

  if (reducedMotion()) {
    section.style.setProperty('--progress', '1');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initActiveNav();
  initTypewriter();
  initNavbarScroll();
  initReveal();
  initHeroNetwork();
  initSystemTransition();
});
