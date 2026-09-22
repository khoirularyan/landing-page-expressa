// Expressa Portfolio Page Scripts
document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Filter Buttons Logic
  const filterBtns = document.querySelectorAll('#portfolio-filter-buttons .filter-btn');
  const items = document.querySelectorAll('#portfolio-items-grid .portfolio-item-card');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      // Update active button state
      filterBtns.forEach(b => {
        b.classList.remove('active', 'bg-blue-600', 'text-white', 'shadow-sm');
        b.classList.add('bg-white', 'dark:bg-[#1E293B]', 'border', 'border-slate-300', 'dark:border-slate-700', 'text-slate-600', 'dark:text-slate-300');
      });

      btn.classList.add('active', 'bg-blue-600', 'text-white', 'shadow-sm');
      btn.classList.remove('bg-white', 'dark:bg-[#1E293B]', 'border-slate-300', 'dark:border-slate-700', 'text-slate-600', 'dark:text-slate-300');

      const targetCategory = btn.getAttribute('data-category');

      // Filter cards
      items.forEach(card => {
        const cardCategory = card.getAttribute('data-category');
        if (targetCategory === 'all' || cardCategory === targetCategory) {
          card.style.display = 'flex';
          card.classList.remove('hidden');
          // Smooth fade in
          requestAnimationFrame(() => {
            card.style.opacity = '1';
            card.style.transform = 'scale(1)';
          });
        } else {
          card.style.opacity = '0';
          card.style.transform = 'scale(0.95)';
          setTimeout(() => {
            card.style.display = 'none';
          }, 200);
        }
      });
    });
  });

  // Dynamic CMS Content Hydration for Case Studies
  function applyContentToDOM(data) {
    if (!data || !data.caseStudies || !Array.isArray(data.caseStudies)) return;
    data.caseStudies.forEach((cs, idx) => {
      const imgEl = document.getElementById(`cs-img-${idx}`);
      if (imgEl && cs.imageUrl) {
        imgEl.src = cs.imageUrl;
      }
    });
  }

  async function loadPortfolioContent() {
    // 1. Fast local cache
    try {
      const cached = localStorage.getItem('expr_saved_content');
      if (cached) {
        applyContentToDOM(JSON.parse(cached));
      }
    } catch (e) {}

    // 2. Fetch fresh content from server
    try {
      const res = await fetch('/api/content');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          applyContentToDOM(json.data);
          localStorage.setItem('expr_saved_content', JSON.stringify(json.data));
        }
      }
    } catch (e) {
      console.warn('[Portfolio] Could not load dynamic content:', e.message);
    }
  }

  loadPortfolioContent();
});
