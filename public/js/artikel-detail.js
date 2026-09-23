// artikel-detail.js — Single article page untuk /artikel-detail.html
(function () {
  'use strict';

  // ──────────────────────────────────────────
  // DOM refs
  // ──────────────────────────────────────────
  const loadingEl   = document.getElementById('article-loading');
  const contentEl   = document.getElementById('article-content');
  const errorEl     = document.getElementById('article-error');
  const coverEl     = document.getElementById('article-cover');
  const coverWrapEl = document.getElementById('article-cover-wrap');
  const categoryEl  = document.getElementById('article-category');
  const titleEl     = document.getElementById('article-title');
  const authorEl    = document.getElementById('article-author');
  const dateEl      = document.getElementById('article-date');
  const readTimeEl  = document.getElementById('article-read-time');
  const bodyEl      = document.getElementById('article-body');
  const tagsEl      = document.getElementById('article-tags');
  const breadcrumbTitleEl = document.getElementById('breadcrumb-title');
  const relatedEl   = document.getElementById('related-articles');
  const relatedGridEl = document.getElementById('related-grid');

  // ──────────────────────────────────────────
  // Get slug from URL
  // ──────────────────────────────────────────
  function getSlug() {
    const params = new URLSearchParams(window.location.search);
    return params.get('slug') || '';
  }

  // ──────────────────────────────────────────
  // Fetch article
  // ──────────────────────────────────────────
  async function fetchArticle(slug) {
    try {
      const res = await fetch(/api/articles/);
      if (!res.ok) throw new Error('not found');
      const json = await res.json();
      return json.data;
    } catch (e) {
      return null;
    }
  }

  // ──────────────────────────────────────────
  // Fetch related articles
  // ──────────────────────────────────────────
  async function fetchRelated(category, excludeSlug) {
    try {
      const res = await fetch(/api/articles?category=&limit=4);
      const json = await res.json();
      return (json.data || []).filter(a => a.slug !== excludeSlug).slice(0, 3);
    } catch (e) {
      return [];
    }
  }

  // ──────────────────────────────────────────
  // Render article
  // ──────────────────────────────────────────
  function renderArticle(article) {
    // Update page title
    document.title = ${article.title} | Expressa;

    // Cover
    if (coverEl && article.coverImage) {
      coverEl.src = article.coverImage;
      coverEl.alt = article.title;
      coverEl.classList.remove('hidden');
    } else if (coverWrapEl && !article.coverImage) {
      if (coverWrapEl) coverWrapEl.classList.add('hidden');
    }

    // Breadcrumb
    if (breadcrumbTitleEl) breadcrumbTitleEl.textContent = article.title;

    // Category
    if (categoryEl) {
      categoryEl.textContent = article.category || 'Insight';
    }

    // Title
    if (titleEl) titleEl.textContent = article.title;

    // Author
    if (authorEl) authorEl.textContent = article.author || 'Tim Expressa';

    // Date
    if (dateEl) dateEl.textContent = formatDate(article.publishedAt || article.createdAt);

    // Read time (estimate: 200 words/min)
    if (readTimeEl) {
      const wordCount = (article.content || '').replace(/<[^>]+>/g, '').split(/\s+/).length;
      const mins = Math.max(1, Math.round(wordCount / 200));
      readTimeEl.textContent = ${mins} menit baca;
    }

    // Body HTML
    if (bodyEl) bodyEl.innerHTML = article.content || '<p>Konten belum tersedia.</p>';

    // Tags
    if (tagsEl && article.tags && article.tags.length > 0) {
      tagsEl.innerHTML = article.tags.map(tag =>
        <span class="inline-block bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs px-3 py-1 rounded-full"></span>
      ).join('');
      tagsEl.classList.remove('hidden');
    }

    // Show content, hide loading
    if (loadingEl) loadingEl.classList.add('hidden');
    if (contentEl) contentEl.classList.remove('hidden');

    if (window.lucide) window.lucide.createIcons();
  }

  // ──────────────────────────────────────────
  // Render related articles
  // ──────────────────────────────────────────
  function renderRelated(articles) {
    if (!relatedGridEl || articles.length === 0) {
      if (relatedEl) relatedEl.classList.add('hidden');
      return;
    }

    relatedGridEl.innerHTML = articles.map(a => {
      const date = formatDate(a.publishedAt || a.createdAt);
      const coverSrc = a.coverImage || '';
      const coverImg = coverSrc
        ? <img src="" alt="" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy">
        : <div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20"><i data-lucide="file-text" class="w-10 h-10 text-blue-300 dark:text-blue-600"></i></div>;

      return 
      <article class="group bg-white dark:bg-slate-800 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
        <a href="/artikel-detail?slug=" class="block h-36 bg-slate-100 dark:bg-slate-700 overflow-hidden">
          
        </a>
        <div class="p-4">
          <span class="inline-block bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-semibold px-2.5 py-0.5 rounded-full mb-2"></span>
          <h4 class="text-sm font-bold text-slate-900 dark:text-white mb-1 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            <a href="/artikel-detail?slug="></a>
          </h4>
          <span class="text-xs text-slate-400"></span>
        </div>
      </article>;
    }).join('');

    if (relatedEl) relatedEl.classList.remove('hidden');
    if (window.lucide) window.lucide.createIcons();
  }

  // ──────────────────────────────────────────
  // Show error
  // ──────────────────────────────────────────
  function showError() {
    if (loadingEl) loadingEl.classList.add('hidden');
    if (errorEl) errorEl.classList.remove('hidden');
  }

  // ──────────────────────────────────────────
  // Helpers
  // ──────────────────────────────────────────
  function formatDate(iso) {
    try {
      return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch { return ''; }
  }

  function escHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ──────────────────────────────────────────
  // Init
  // ──────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', async () => {
    const slug = getSlug();
    if (!slug) { showError(); return; }

    const article = await fetchArticle(slug);
    if (!article) { showError(); return; }

    renderArticle(article);

    // Load related articles async
    const related = await fetchRelated(article.category, article.slug);
    renderRelated(related);
  });
})();
