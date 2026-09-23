// artikel-preview.js — render 3 artikel terbaru di homepage
(function () {
  'use strict';

  function escHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function formatDate(iso) {
    try {
      return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return ''; }
  }

  function cardHTML(a) {
    const date = formatDate(a.publishedAt || a.createdAt);
    const coverSrc = a.coverImage || '';
    const coverImg = coverSrc
      ? `<img src="${escHtml(coverSrc)}" alt="${escHtml(a.title)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20\\'><i data-lucide=\\'file-text\\' class=\\'w-12 h-12 text-blue-300 dark:text-blue-600\\'></i></div>'; if(window.lucide)window.lucide.createIcons();">`
      : `<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20"><i data-lucide="file-text" class="w-12 h-12 text-blue-300 dark:text-blue-600"></i></div>`;

    return `
    <article class="group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
      <a href="/artikel-detail?slug=${escHtml(a.slug)}" class="block h-44 bg-slate-100 dark:bg-slate-700 overflow-hidden flex-shrink-0">
        ${coverImg}
      </a>
      <div class="p-5 flex flex-col flex-1">
        <span class="inline-block bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-semibold px-3 py-1 rounded-full mb-3 w-fit">${escHtml(a.category)}</span>
        <h3 class="text-base font-bold text-slate-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          <a href="/artikel-detail?slug=${escHtml(a.slug)}">${escHtml(a.title)}</a>
        </h3>
        <p class="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-4 flex-1">${escHtml(a.excerpt)}</p>
        <div class="flex items-center justify-between mt-auto pt-3 border-t border-slate-100 dark:border-slate-700">
          <span class="text-xs text-slate-400 flex items-center gap-1">
            <i data-lucide="calendar" class="w-3 h-3"></i>
            ${date}
          </span>
          <a href="/artikel-detail?slug=${escHtml(a.slug)}" class="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:gap-2 transition-all duration-200">
            Baca <i data-lucide="arrow-right" class="w-3 h-3"></i>
          </a>
        </div>
      </div>
    </article>`;
  }

  async function loadArtikelPreview() {
    const grid = document.getElementById('artikel-preview-grid');
    if (!grid) return;

    try {
      const res = await fetch('/api/articles?limit=3');
      if (!res.ok) return;
      const json = await res.json();
      const articles = json.data || [];

      // If articles are available from CMS, dynamically replace the fallback cards
      if (articles.length > 0) {
        grid.innerHTML = '';
        articles.forEach(a => {
          grid.insertAdjacentHTML('beforeend', cardHTML(a));
        });
        if (window.lucide) window.lucide.createIcons();
      }
    } catch (e) {
      // Fallback articles remain visible if offline or API error
      console.warn('[Articles Preview] Keeping fallback cards:', e.message);
    }
  }

  document.addEventListener('DOMContentLoaded', loadArtikelPreview);
})();
