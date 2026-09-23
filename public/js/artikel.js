// artikel.js — Listing page untuk /artikel.html
(function () {
  'use strict';

  const PAGE_SIZE = 9;

  let allArticles = [];
  let filteredArticles = [];
  let currentPage = 1;
  let activeCategory = 'Semua';
  let searchQuery = '';

  // ──────────────────────────────────────────
  // DOM refs
  // ──────────────────────────────────────────
  const gridEl         = document.getElementById('articles-grid');
  const emptyEl        = document.getElementById('articles-empty');
  const loadingEl      = document.getElementById('articles-loading');
  const loadMoreBtn    = document.getElementById('load-more-btn');
  const loadMoreWrap   = document.getElementById('load-more-wrapper') || (loadMoreBtn ? loadMoreBtn.parentElement : null);
  const filterBar      = document.getElementById('category-filters') || document.getElementById('category-filter');
  const searchInput    = document.getElementById('articles-search');
  const countTextEl    = document.getElementById('articles-count-text');

  const defaultFallbackArticles = [
    {
      id: 'art-1',
      slug: 'membangun-erp-kustom-untuk-efisiensi-bisnis-modern',
      title: 'Membangun ERP Kustom untuk Efisiensi Bisnis Modern',
      excerpt: 'Bagaimana sistem ERP yang dirancang presisi mengikuti alur kerja internal dapat menekan biaya operasional hingga 40% dan mengeliminasi redudansi data bisnis.',
      category: 'Insight',
      coverImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
      publishedAt: '2026-09-20T08:00:00.000Z',
      author: 'Tim Engineering Expressa',
      tags: ['ERP', 'Digitalisasi', 'Manajemen Bisnis', 'Automasi']
    },
    {
      id: 'art-2',
      slug: 'studi-kasus-automasi-multi-gudang-alat-kesehatan',
      title: 'Studi Kasus: Automasi Multi-Gudang pada Distribusi Alat Kesehatan',
      excerpt: 'Kisah sukses implementasi sistem pelacakan stok real-time antar cabang yang memangkas waktu rekonsiliasi bulanan dari 5 hari menjadi hitungan menit.',
      category: 'Studi Kasus',
      coverImage: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80',
      publishedAt: '2026-09-18T10:30:00.000Z',
      author: 'Danu - Lead Solutions Architect',
      tags: ['Studi Kasus', 'Gudang', 'Supply Chain', 'Distribusi']
    },
    {
      id: 'art-3',
      slug: 'mengapa-aplikasi-mobile-operasional-perlu-offline-first',
      title: 'Mengapa Aplikasi Mobile Operasional Perlu Pendekatan Offline-First?',
      excerpt: 'Menghadapi kendala sinyal di lapangan dengan arsitektur database sync agar tim operasional tetap dapat mencatat data tanpa hambatan.',
      category: 'Tutorial',
      coverImage: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1200&q=80',
      publishedAt: '2026-09-15T14:15:00.000Z',
      author: 'Khoirul - Mobile Developer',
      tags: ['Mobile App', 'Offline First', 'Arsitektur', 'IoT']
    },
    {
      id: 'art-4',
      slug: 'expressa-rilis-fitur-integrasi-whatsapp-gateway',
      title: 'Expressa Rilis Fitur Integrasi Notifikasi WhatsApp Gateway Otomatis',
      excerpt: 'Pemberitahuan invoice jatuh tempo, status pesanan, dan verifikasi OTP kini terkirim otomatis ke WhatsApp pelanggan dengan integrasi API resmi.',
      category: 'Update',
      coverImage: 'https://images.unsplash.com/photo-1611746872915-64382b5c76da?auto=format&fit=crop&w=1200&q=80',
      publishedAt: '2026-09-12T09:00:00.000Z',
      author: 'Tim Expressa',
      tags: ['Update', 'WhatsApp API', 'Notifikasi', 'Integrasi']
    },
    {
      id: 'art-5',
      slug: 'memahami-microservices-vs-monolith-untuk-startup',
      title: 'Microservices vs Monolith: Pilihan Arsitektur untuk Startup yang Berkembang',
      excerpt: 'Panduan lengkap memilih arsitektur sistem yang tepat untuk bisnis Anda. Kapan saatnya beralih dari monolith ke microservices?',
      category: 'Insight',
      coverImage: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80',
      publishedAt: '2026-09-10T07:00:00.000Z',
      author: 'Rizky - CTO Expressa',
      tags: ['Arsitektur', 'Microservices', 'Startup', 'Engineering']
    },
    {
      id: 'art-6',
      slug: 'implementasi-real-time-dashboard-dengan-websocket',
      title: 'Implementasi Real-Time Dashboard dengan WebSocket dan Server-Sent Events',
      excerpt: 'Tutorial membangun dashboard monitoring yang update secara real-time tanpa polling, hemat bandwidth dan responsif.',
      category: 'Tutorial',
      coverImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
      publishedAt: '2026-09-08T13:00:00.000Z',
      author: 'Andi - Backend Engineer',
      tags: ['Real-Time', 'WebSocket', 'Dashboard', 'Node.js']
    },
    {
      id: 'art-7',
      slug: 'keamanan-api-dengan-oauth2-dan-jwt',
      title: 'Keamanan API: Implementasi OAuth2 dan JWT untuk Autentikasi Modern',
      excerpt: 'Panduan praktis mengamankan REST API Anda dengan standar industri OAuth2 dan JSON Web Tokens.',
      category: 'Tutorial',
      coverImage: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&w=1200&q=80',
      publishedAt: '2026-09-05T09:30:00.000Z',
      author: 'Budi - Security Engineer',
      tags: ['Security', 'API', 'OAuth2', 'JWT']
    },
    {
      id: 'art-8',
      slug: 'optimasi-query-database-untuk-aplikasi-skala-besar',
      title: 'Optimasi Query Database untuk Aplikasi Skala Besar',
      excerpt: 'Teknik proven untuk mempercepat query database hingga 100x lipat dengan indexing, query optimization, dan caching strategy.',
      category: 'Tutorial',
      coverImage: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=1200&q=80',
      publishedAt: '2026-09-03T11:00:00.000Z',
      author: 'Siti - Database Specialist',
      tags: ['Database', 'Performance', 'Optimization', 'Backend']
    },
    {
      id: 'art-9',
      slug: 'studi-kasus-digitalisasi-umkm-warung-tradisional',
      title: 'Studi Kasus: Digitalisasi UMKM dari Warung Tradisional ke Omnichannel Modern',
      excerpt: 'Perjalanan transformasi digital warung kelontong menjadi bisnis omnichannel dengan sistem inventory terintegrasi dan penjualan online.',
      category: 'Studi Kasus',
      coverImage: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=1200&q=80',
      publishedAt: '2026-09-01T08:00:00.000Z',
      author: 'Dewi - Business Consultant',
      tags: ['UMKM', 'Digitalisasi', 'Studi Kasus', 'Retail']
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
  // Filter & Search
  // ──────────────────────────────────────────
  function applyFilter() {
    const q = searchQuery.toLowerCase().trim();
    const cat = activeCategory.toLowerCase().trim().replace('-', ' ');

    filteredArticles = allArticles.filter(a => {
      // Category match
      let matchCat = true;
      if (cat !== 'semua' && cat !== '') {
        const aCat = (a.category || '').toLowerCase().replace('-', ' ');
        matchCat = aCat === cat;
      }

      // Search match
      let matchSearch = true;
      if (q) {
        const title = (a.title || '').toLowerCase();
        const excerpt = (a.excerpt || '').toLowerCase();
        const author = (a.author || '').toLowerCase();
        const tags = Array.isArray(a.tags) ? a.tags.join(' ').toLowerCase() : '';
        matchSearch = title.includes(q) || excerpt.includes(q) || author.includes(q) || tags.includes(q);
      }

      return matchCat && matchSearch;
    });

    currentPage = 1;
    renderGrid(true);
  }

  // ──────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────
  function renderGrid(reset) {
    if (loadingEl) loadingEl.classList.add('hidden');

    if (countTextEl) {
      countTextEl.textContent = `Menampilkan ${filteredArticles.length} artikel`;
    }

    if (reset && gridEl) {
      gridEl.innerHTML = '';
      gridEl.classList.remove('hidden');
    }

    const start = (currentPage - 1) * PAGE_SIZE;
    const slice = filteredArticles.slice(start, start + PAGE_SIZE);

    if (filteredArticles.length === 0) {
      if (gridEl) gridEl.classList.add('hidden');
      if (emptyEl) emptyEl.classList.remove('hidden');
      if (loadMoreWrap) loadMoreWrap.classList.add('hidden');
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
    if (loadMoreWrap) {
      if (shown < total) {
        loadMoreWrap.classList.remove('hidden');
      } else {
        loadMoreWrap.classList.add('hidden');
      }
    }

    if (window.lucide) window.lucide.createIcons();
  }

  // ──────────────────────────────────────────
  // Card HTML
  // ──────────────────────────────────────────
  function cardHTML(a) {
    const date = a.publishedAt ? formatDate(a.publishedAt) : (a.createdAt ? formatDate(a.createdAt) : '');
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
        <span class="inline-block bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-semibold px-3 py-1 rounded-full mb-3 w-fit">${escHtml(a.category || 'Insight')}</span>
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
  // Setup filters & search
  // ──────────────────────────────────────────
  function setupFilters() {
    if (!filterBar) return;

    filterBar.querySelectorAll('.category-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const cat = btn.dataset.category || btn.dataset.cat || btn.textContent.trim();
        activeCategory = cat;

        filterBar.querySelectorAll('.category-btn').forEach(b => {
          const bCat = b.dataset.category || b.dataset.cat || b.textContent.trim();
          const isSelected = bCat.toLowerCase() === activeCategory.toLowerCase();

          if (isSelected) {
            b.className = 'category-btn bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-full transition-all duration-200 hover:bg-blue-700';
          } else {
            b.className = 'category-btn bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold px-4 py-2 rounded-full transition-all duration-200 hover:bg-slate-200 dark:hover:bg-slate-700';
          }
        });

        applyFilter();
      });
    });

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        applyFilter();
      });
    }

    // Empty state "Tampilkan Semua Artikel" button
    if (emptyEl) {
      const resetBtn = emptyEl.querySelector('button');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          activeCategory = 'Semua';
          searchQuery = '';
          if (searchInput) searchInput.value = '';
          if (filterBar) {
            filterBar.querySelectorAll('.category-btn').forEach((b, i) => {
              if (i === 0) {
                b.className = 'category-btn bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-full transition-all duration-200 hover:bg-blue-700';
              } else {
                b.className = 'category-btn bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold px-4 py-2 rounded-full transition-all duration-200 hover:bg-slate-200 dark:hover:bg-slate-700';
              }
            });
          }
          applyFilter();
        });
      }
    }
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
    setupFilters();

    if (loadMoreBtn) {
      loadMoreBtn.addEventListener('click', () => {
        currentPage++;
        renderGrid(false);
      });
    }

    fetchArticles();
  });
})();
