// artikel.js — Listing page untuk /artikel.html
(function () {
  'use strict';

  const CATEGORIES = ['Semua', 'Insight', 'Tutorial', 'Studi Kasus', 'Berita', 'Update'];
  const PAGE_SIZE = 9;

  let allArticles = [];
  let filteredArticles = [];
  let currentPage = 1;
  let activeCategory = 'Semua';

  // ──────────────────────────────────────────
  // DOM refs
  // ──────────────────────────────────────────
  const gridEl      = document.getElementById('articles-grid');
  const emptyEl     = document.getElementById('articles-empty');
  const loadingEl   = document.getElementById('articles-loading');
  const loadMoreBtn = document.getElementById('load-more-btn');
  const filterBar   = document.getElementById('category-filter');

  const defaultFallbackArticles = [
    {
      slug: 'membangun-erp-kustom-untuk-efisiensi-bisnis-modern',
      title: 'Membangun ERP Kustom untuk Efisiensi Bisnis Modern',
      excerpt: 'Bagaimana sistem ERP yang dirancang presisi mengikuti alur kerja internal dapat menekan biaya operasional hingga 40% dan mengeliminasi redudansi data bisnis.',
      category: 'Insight',
      coverImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
      publishedAt: '2026-09-20T08:00:00.000Z',
      author: 'Tim Engineering Expressa',
      tags: ['ERP', 'Digitalisasi', 'Bisnis']
    },
    {
      slug: 'studi-kasus-automasi-multi-gudang-alat-kesehatan',
      title: 'Studi Kasus: Automasi Multi-Gudang pada Distribusi Alat Kesehatan',
      excerpt: 'Kisah sukses implementasi sistem pelacakan stok real-time antar cabang yang memangkas waktu rekonsiliasi bulanan dari 5 hari menjadi hitungan menit.',
      category: 'Studi Kasus',
      coverImage: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80',
      publishedAt: '2026-09-18T10:30:00.000Z',
      author: 'Danu - Lead Solutions Architect',
      tags: ['Studi Kasus', 'Gudang', 'Distribusi']
    },
    {
      slug: 'mengapa-aplikasi-mobile-operasional-perlu-offline-first',
      title: 'Mengapa Aplikasi Mobile Operasional Perlu Pendekatan Offline-First?',
      excerpt: 'Menghadapi kendala sinyal di lapangan dengan arsitektur database sync agar tim operasional tetap dapat mencatat data tanpa hambatan.',
      category: 'Tutorial',
      coverImage: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1200&q=80',
      publishedAt: '2026-09-15T14:15:00.000Z',
      author: 'Khoirul - Mobile Developer',
      tags: ['Mobile App', 'Offline First']
    },
    {
      slug: 'expressa-rilis-fitur-integrasi-whatsapp-gateway',
      title: 'Expressa Rilis Fitur Integrasi Notifikasi WhatsApp Gateway Otomatis',
      excerpt: 'Pemberitahuan invoice jatuh tempo, status pesanan, dan verifikasi OTP kini terkirim otomatis ke WhatsApp pelanggan dengan integrasi API resmi.',
      category: 'Update',
      coverImage: 'https://images.unsplash.com/photo-1611746872915-64382b5c76da?auto=format&fit=crop&w=1200&q=80',
      publishedAt: '2026-09-12T09:00:00.000Z',
      author: 'Tim Expressa',
      tags: ['Update', 'WhatsApp API']
    }
  ];

  // ──────────────────────────────────────────
  // Fetch articles
  // ──────────────────────────────────────────
  async function fetchArticles() {
    try {
      const res = await fetch('/api/articles');
      if (res.ok) {
        const json = await res.json();
        if (json.data && Array.isArray(json.data) && json.data.length > 0) {
          allArticles = json.data;
        } else {
          allArticles = defaultFallbackArticles;
        }
      } else {
        allArticles = defaultFallbackArticles;
      }
    } catch (e) {
      allArticles = defaultFallbackArticles;
    }
    applyFilter();
  }

  // ──────────────────────────────────────────
  // Filter
  // ──────────────────────────────────────────
  function applyFilter() {
    filteredArticles = activeCategory === 'Semua'
      ? allArticles
      : allArticles.filter(a => a.category === activeCategory);
    currentPage = 1;
    renderGrid(true);
  }

  // ──────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────
  function renderGrid(reset) {
    if (loadingEl) loadingEl.classList.add('hidden');

    if (reset && gridEl) {
      gridEl.innerHTML = '';
      gridEl.classList.remove('hidden');
    }

    const start = (currentPage - 1) * PAGE_SIZE;
    const slice = filteredArticles.slice(start, start + PAGE_SIZE);

    if (filteredArticles.length === 0) {
      if (gridEl) gridEl.classList.add('hidden');
      if (emptyEl) emptyEl.classList.remove('hidden');
      if (loadMoreBtn) loadMoreBtn.parentElement.classList.add('hidden');
      return;
    }

    if (emptyEl) emptyEl.classList.add('hidden');
    if (gridEl) gridEl.classList.remove('hidden');

    slice.forEach(article => {
      if (gridEl) gridEl.insertAdjacentHTML('beforeend', cardHTML(article));
    });

    // Load more button
    const total = filteredArticles.length;
    const shown = start + slice.length;
    if (loadMoreBtn && loadMoreBtn.parentElement) {
      if (shown < total) {
        loadMoreBtn.parentElement.classList.remove('hidden');
      } else {
        loadMoreBtn.parentElement.classList.add('hidden');
      }
    }

    if (window.lucide) window.lucide.createIcons();
  }

  // ──────────────────────────────────────────
  // Card HTML
  // ──────────────────────────────────────────
  function cardHTML(a) {
    const date = a.publishedAt ? formatDate(a.publishedAt) : formatDate(a.createdAt);
    const coverSrc = a.coverImage || '';
    const coverImg = coverSrc
      ? `<img src="${escHtml(coverSrc)}" alt="${escHtml(a.title)}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20\\'><i data-lucide=\\'file-text\\' class=\\'w-12 h-12 text-blue-300 dark:text-blue-600\\'></i></div>'; if(window.lucide)window.lucide.createIcons();">`
      : `<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20"><i data-lucide="file-text" class="w-12 h-12 text-blue-300 dark:text-blue-600"></i></div>`;

    return `
    <article class="group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
      <a href="/artikel-detail?slug=${escHtml(a.slug)}" class="block h-48 bg-slate-100 dark:bg-slate-700 overflow-hidden flex-shrink-0">
        ${coverImg}
      </a>
      <div class="p-5 flex flex-col flex-1">
        <span class="inline-block bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-semibold px-3 py-1 rounded-full mb-3 w-fit">${escHtml(a.category)}</span>
        <h3 class="text-base font-bold text-slate-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
          <a href="/artikel-detail?slug=${escHtml(a.slug)}">${escHtml(a.title)}</a>
        </h3>
        <p class="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 mb-4 flex-1">${escHtml(a.excerpt)}</p>
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

  // ──────────────────────────────────────────
  // Category filter buttons
  // ──────────────────────────────────────────
  function renderFilterBar() {
    if (!filterBar) return;
    filterBar.innerHTML = CATEGORIES.map(cat => {
      const isActive = cat === activeCategory;
      const activeClass = isActive 
        ? 'bg-blue-600 text-white' 
        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700';
      return `<button
        data-cat="${escHtml(cat)}"
        class="category-btn px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${activeClass}"
      >${escHtml(cat)}</button>`;
    }).join('');

    filterBar.querySelectorAll('.category-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        activeCategory = btn.dataset.cat;
        filterBar.querySelectorAll('.category-btn').forEach(b => {
          const isActive = b.dataset.cat === activeCategory;
          b.className = `category-btn px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
            isActive 
              ? 'bg-blue-600 text-white' 
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`;
        });
        applyFilter();
      });
    });
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
  document.addEventListener('DOMContentLoaded', () => {
    renderFilterBar();

    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', () => {
        currentPage++;
        renderGrid(false);
      });
    }

    fetchArticles();
  });
})();
