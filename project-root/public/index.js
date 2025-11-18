document.addEventListener('DOMContentLoaded', () => {
  const explore = document.getElementById('explore');
  const toggle = explore?.querySelector('.explore-toggle');
  const navLinks = document.getElementById('nav-links');
  const hamburger = document.getElementById('nav-toggle');

  // Explore dropdown toggle
  function setOpen(isOpen) {
    explore?.classList.toggle('open', isOpen);
    toggle?.setAttribute('aria-expanded', String(isOpen));
  }

  toggle?.addEventListener('click', (e) => {
    e.stopPropagation();
    setOpen(!explore.classList.contains('open'));
  });

  document.addEventListener('click', (e) => {
    if (!explore?.contains(e.target)) setOpen(false);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      setOpen(false);
      toggle?.focus();
    }
  });

  navLinks?.addEventListener('click', (e) => {
    if (e.target.closest('a')) setOpen(false);
  });

  // Mobile hamburger toggle
  hamburger?.addEventListener('click', () => {
    navLinks?.classList.toggle('open');
    hamburger.setAttribute(
      'aria-expanded',
      String(navLinks?.classList.contains('open'))
    );
  });
});