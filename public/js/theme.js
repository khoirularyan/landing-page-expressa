// Expressa Theme Engine (Light & Balanced Dark Mode)
(function initTheme() {
  try {
    const savedTheme = localStorage.getItem('expr_theme');
    // Default to light mode if not specified, or respect saved theme
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark');
    }
  } catch (e) {}
})();

document.addEventListener('DOMContentLoaded', () => {
  const toggleBtn = document.getElementById('theme-toggle-btn');
  const moonIcon = document.getElementById('theme-moon-icon');
  const sunIcon = document.getElementById('theme-sun-icon');
  const navbar = document.getElementById('main-navbar');
  const heroSection = document.getElementById('beranda');

  function updateIcons() {
    const isDark = document.documentElement.classList.contains('dark');
    if (moonIcon && sunIcon) {
      if (isDark) {
        moonIcon.classList.add('hidden');
        sunIcon.classList.remove('hidden');
      } else {
        sunIcon.classList.add('hidden');
        moonIcon.classList.remove('hidden');
      }
    }
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  // Dynamic Navbar Scroll Adaptation
  function updateNavbarScroll() {
    if (!navbar) return;
    const scrollY = window.scrollY || window.pageYOffset || 0;

    // When on homepage with dark hero (#beranda)
    if (heroSection) {
      // Mentok di atas (scrollY <= 25): navbar matches dark navy section underneath
      if (scrollY <= 25) {
        navbar.classList.add('navbar-at-top');
        navbar.classList.remove('navbar-scrolled');
      } else {
        // Scrolled down: in light mode turns crisp white, in dark mode turns deep slate navy
        navbar.classList.remove('navbar-at-top');
        navbar.classList.add('navbar-scrolled');
      }
    } else {
      // Pages without dark hero (portofolio, tim, etc.): already on light/dark content
      navbar.classList.add('navbar-scrolled');
      navbar.classList.remove('navbar-at-top');
    }
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const isDark = document.documentElement.classList.toggle('dark');
      try {
        localStorage.setItem('expr_theme', isDark ? 'dark' : 'light');
      } catch (err) {}
      updateIcons();
      updateNavbarScroll();
    });
  }

  window.addEventListener('scroll', updateNavbarScroll, { passive: true });
  updateIcons();
  updateNavbarScroll();
});
