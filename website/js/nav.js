(function () {
  const toggle = document.querySelector('[data-nav-toggle]');
  const panel = document.querySelector('[data-mobile-nav]');

  if (!toggle || !panel) return;

  function closeMenu() {
    toggle.setAttribute('aria-expanded', 'false');
    panel.hidden = true;
  }

  function openMenu() {
    toggle.setAttribute('aria-expanded', 'true');
    panel.hidden = false;
  }

  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') === 'true';
    if (open) closeMenu();
    else openMenu();
  });

  panel.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', closeMenu);
  });

  window.addEventListener('resize', () => {
    if (window.matchMedia('(min-width: 768px)').matches) {
      closeMenu();
    }
  });
})();
