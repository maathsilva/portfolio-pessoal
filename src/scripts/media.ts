// Screenshots: fade-in on load and the full-screen viewer (lightbox).
// Everything degrades to plain images without JS.

/** Images inside a BrowserFrame fade in once loaded; the frame's shimmer stops then. */
function initImageFade() {
  document.querySelectorAll<HTMLElement>('[data-shimmer]').forEach((view) => {
    const img = view.querySelector('img');
    if (!img) return;
    const done = () => {
      img.classList.remove('is-loading');
      view.classList.add('is-loaded');
    };
    if (img.complete && img.naturalWidth > 0) {
      done();
      return;
    }
    img.classList.add('is-loading');
    img.addEventListener('load', done, { once: true });
    img.addEventListener('error', done, { once: true });
  });
}

/** Any [data-lightbox="<group>"][data-full] opens the page's single <dialog>;
 * arrows step through the other images of the same group. */
function initLightbox() {
  const dialog = document.querySelector<HTMLDialogElement>('[data-lightbox-dialog]');
  if (!dialog || typeof dialog.showModal !== 'function') return;

  const img = dialog.querySelector<HTMLImageElement>('[data-lightbox-img]')!;
  const caption = dialog.querySelector<HTMLElement>('[data-lightbox-caption]')!;
  const count = dialog.querySelector<HTMLElement>('[data-lightbox-count]')!;
  const prev = dialog.querySelector<HTMLButtonElement>('[data-lightbox-prev]')!;
  const next = dialog.querySelector<HTMLButtonElement>('[data-lightbox-next]')!;

  let group: HTMLElement[] = [];
  let index = 0;

  const show = (i: number) => {
    index = (i + group.length) % group.length;
    const trigger = group[index];
    const src = trigger.dataset.full ?? '';
    if (img.getAttribute('src') !== src) {
      img.classList.add('is-loading');
      img.onload = () => img.classList.remove('is-loading');
      img.src = src;
    }
    img.alt = trigger.querySelector('img')?.alt ?? '';
    caption.textContent = trigger.dataset.caption ?? '';
    count.textContent = group.length > 1 ? `${index + 1} / ${group.length}` : '';
    prev.hidden = next.hidden = group.length < 2;
  };

  const setOpen = (open: boolean) => {
    document.documentElement.classList.toggle('lightbox-open', open);
    document.dispatchEvent(new CustomEvent('lightbox:toggle', { detail: open }));
  };

  document.addEventListener('click', (e) => {
    const trigger = (e.target as Element | null)?.closest<HTMLElement>('[data-lightbox]');
    if (!trigger || !trigger.dataset.full) return;
    e.preventDefault();
    const name = trigger.dataset.lightbox ?? '';
    // Decorative copies (e.g. the marquee's second pass) live under aria-hidden: skip them,
    // and open the matching original instead.
    group = Array.from(document.querySelectorAll<HTMLElement>(`[data-lightbox="${CSS.escape(name)}"]`)).filter(
      (el) => !el.closest('[aria-hidden="true"]')
    );
    show(Math.max(0, group.findIndex((el) => el.dataset.full === trigger.dataset.full)));
    dialog.showModal();
    setOpen(true);
  });

  dialog.addEventListener('close', () => setOpen(false));
  // A click on the dimmed area around the image (the dialog itself) closes it.
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
  dialog.querySelector('[data-lightbox-close]')?.addEventListener('click', () => dialog.close());
  prev.addEventListener('click', () => show(index - 1));
  next.addEventListener('click', () => show(index + 1));
  dialog.addEventListener('keydown', (e) => {
    if (group.length < 2) return;
    if (e.key === 'ArrowLeft') show(index - 1);
    if (e.key === 'ArrowRight') show(index + 1);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initImageFade();
  initLightbox();
});
