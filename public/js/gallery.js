// Galeri Project JavaScript Logic & Lightbox
document.addEventListener('DOMContentLoaded', () => {
  const defaultGallery = [
    {
      id: "gal-1",
      title: "SIT Sistem ERP PT. Fokus Jasa Mitra (FJM)",
      client: "PT. Fokus Jasa Mitra (FJM)",
      category: "ERP & Bisnis",
      imageUrl: "/assets/images/projects/project-3.jpeg",
      description: "Implementasi Sistem Informasi Terpadu (SIT) ERP untuk PT. Fokus Jasa Mitra yang mengintegrasikan proses bisnis procurement, inventory, finance, hingga HR management dalam satu platform terpadu."
    },
    {
      id: "gal-2",
      title: "Assessment Sistem ERP PT. Cobra Dental Indonesia",
      client: "PT. Cobra Dental Indonesia",
      category: "Konsultasi & Analisis",
      imageUrl: "/assets/images/projects/project-4.jpeg",
      description: "Assessment menyeluruh terhadap kebutuhan sistem ERP PT. Cobra Dental Indonesia, mencakup analisis proses bisnis, gap analysis, dan rekomendasi solusi optimalisasi operasional dental nasional."
    },
    {
      id: "gal-3",
      title: "Demo Proyek Sistem ERP PT. Cobra Dental Indonesia",
      client: "PT. Cobra Dental Indonesia",
      category: "ERP & Bisnis",
      imageUrl: "/assets/images/projects/project-5.jpeg",
      description: "Sesi presentasi dan pengujian sistem ERP kustom yang menghubungkan modul persediaan multi-cabang, order purchasing, dan alur otorisasi keuangan secara realtime."
    },
    {
      id: "gal-4",
      title: "Demo Mobile & Customer App PT. Cobra Dental Indonesia",
      client: "PT. Cobra Dental Indonesia",
      category: "Mobile App",
      imageUrl: "/assets/images/projects/project-10.jpeg",
      description: "Demonstrasi aplikasi mobile dan customer portal terintegrasi sistem ERP, memudahkan tim sales lapangan dalam pengecekan stok gudang dan pembuatan pesanan klinis secara cepat."
    },
    {
      id: "gal-5",
      title: "Sistem Pembelajaran Farmasi Politeknik Indonusa",
      client: "Politeknik Indonusa Surakarta",
      category: "Web Platform",
      imageUrl: "/assets/images/projects/project-2.jpeg",
      description: "Demonstrasi sistem pembelajaran farmasi yang dikembangkan khusus untuk dosen Politeknik Indonusa dengan fitur manajemen kurikulum, e-learning, dan sistem evaluasi pembelajaran yang terintegrasi."
    },
    {
      id: "gal-6",
      title: "Assessment Sistem ERP di PT. Gamma Buana Persada",
      client: "PT. Gamma Buana Persada",
      category: "Konsultasi & Analisis",
      imageUrl: "/assets/images/projects/project-6.jpeg",
      description: "Melakukan assessment menyeluruh terhadap alur proses bisnis dan kebutuhan transformasi sistem ERP untuk efisiensi rantai pasok dan operasional perusahaan."
    },
    {
      id: "gal-7",
      title: "Training & Implementasi Sistem ERP SaVa Group",
      client: "SaVa Group",
      category: "ERP & Bisnis",
      imageUrl: "/assets/images/projects/project-7.jpeg",
      description: "Pelatihan dan pendampingan implementasi sistem ERP untuk SaVa Group guna meningkatkan efisiensi operasional dan integrasi sistem antar unit bisnis."
    },
    {
      id: "gal-8",
      title: "Implementasi Sistem Klinik Pratama Kusmahati Dua",
      client: "Klinik Pratama Kusmahati Dua",
      category: "Web Platform",
      imageUrl: "/assets/images/projects/project-1.jpeg",
      description: "Implementasi sistem rekam medis elektronik dan operasional administrasi klinik untuk mempercepat alur pelayanan pasien serta manajemen obat farmasi."
    },
    {
      id: "gal-9",
      title: "Uji Coba Lapangan Aplikasi Mobile Operasional",
      client: "PT. Cobra Dental Indonesia",
      category: "Mobile App",
      imageUrl: "/assets/images/projects/project-8.jpeg",
      description: "Pengujian lapangan aplikasi mobile terhubung ERP secara offline-first untuk koordinasi tim operasional dan tracking pengiriman produk secara presisi."
    },
    {
      id: "gal-10",
      title: "Handover & Evaluasi Sistem ERP Terintegrasi",
      client: "PT. Cobra Dental Indonesia",
      category: "ERP & Bisnis",
      imageUrl: "/assets/images/projects/project-9.jpeg",
      description: "Serah terima final modul ERP, evaluasi performa implementasi, dan pengesahan kesiapan go-live seluruh divisi operasional perusahaan."
    }
  ];

  let galleryItems = [...defaultGallery];
  let activeCategory = 'all';
  let currentLightboxIndex = 0;
  let filteredItems = [];

  const galleryGrid = document.getElementById('gallery-grid');
  const emptyState = document.getElementById('gallery-empty');
  const filterButtons = document.querySelectorAll('.gallery-filter-btn');

  // Lightbox DOM Elements
  const lightbox = document.getElementById('lightbox-modal');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxTitle = document.getElementById('lightbox-title');
  const lightboxCategory = document.getElementById('lightbox-category');
  const lightboxDesc = document.getElementById('lightbox-desc');
  const lightboxClose = document.getElementById('lightbox-close');
  const lightboxPrev = document.getElementById('lightbox-prev');
  const lightboxNext = document.getElementById('lightbox-next');
  const lightboxCounter = document.getElementById('lightbox-counter');

  // 1. Initial Load from LocalStorage or API
  function loadGalleryData() {
    try {
      const cached = localStorage.getItem('expr_saved_content');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.gallery && Array.isArray(parsed.gallery) && parsed.gallery.length > 0) {
          galleryItems = parsed.gallery;
          renderGallery();
        }
      }
    } catch (e) {}

    fetch('/api/content')
      .then(res => res.json())
      .then(json => {
        if (json.success && json.data && json.data.gallery && json.data.gallery.length > 0) {
          galleryItems = json.data.gallery;
          renderGallery();
        }
      })
      .catch(err => {
        console.warn('[Gallery] Using default/cached items:', err.message);
      });
  }

  // 2. Render Gallery Cards
  function renderGallery() {
    if (!galleryGrid) return;
    galleryGrid.innerHTML = '';

    filteredItems = galleryItems.filter(item => {
      if (activeCategory === 'all') return true;
      return (item.category || '').toLowerCase().includes(activeCategory.toLowerCase());
    });

    if (filteredItems.length === 0) {
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    filteredItems.forEach((item, index) => {
      const card = document.createElement('div');
      card.className = 'group clean-card bg-white dark:bg-[#182238] rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-blue-500/40 dark:hover:border-blue-500/40 transition-all duration-300 overflow-hidden flex flex-col justify-between cursor-pointer';
      
      card.innerHTML = `
        <div>
          <!-- Image Showcase with Hover Zoom -->
          <div class="relative w-full aspect-[16/10] bg-slate-100 dark:bg-slate-900 overflow-hidden">
            <img src="${item.imageUrl || '/assets/images/projects/project-3.jpeg'}" 
                 alt="${escapeHtml(item.title || 'Galeri Proyek')}" 
                 loading="lazy" 
                 class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
            
            <div class="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/30 transition-colors duration-300 flex items-center justify-center">
              <span class="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-slate-900 dark:text-white px-3.5 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1.5 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                <i data-lucide="maximize-2" class="w-3.5 h-3.5 text-blue-600 dark:text-blue-400"></i>
                <span>Lihat Foto</span>
              </span>
            </div>
            
            <span class="absolute top-3 left-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-blue-600 dark:text-blue-400 text-[11px] font-bold px-3 py-1 rounded-full shadow-sm border border-slate-200/50 dark:border-slate-700/50">
              ${escapeHtml(item.category || 'Solusi Digital')}
            </span>
          </div>

          <!-- Card Content -->
          <div class="p-5 sm:p-6 space-y-2">
            ${item.client ? `
              <div class="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <i data-lucide="building" class="w-3.5 h-3.5 text-blue-500"></i>
                <span>${escapeHtml(item.client)}</span>
              </div>
            ` : ''}
            <h3 class="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
              ${escapeHtml(item.title || 'Proyek Expressa')}
            </h3>
            <p class="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
              ${escapeHtml(item.description || 'Implementasi arsitektur sistem kustom yang dibangun sesuai kebutuhan proses bisnis klien.')}
            </p>
          </div>
        </div>

        <!-- Footer Card Action -->
        <div class="px-5 sm:px-6 pb-5 pt-1 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-semibold text-blue-600 dark:text-blue-400">
          <span>Pratinjau Layar Penuh</span>
          <i data-lucide="arrow-up-right" class="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"></i>
        </div>
      `;

      card.addEventListener('click', () => {
        openLightbox(index);
      });

      galleryGrid.appendChild(card);
    });

    if (window.lucide) lucide.createIcons();
  }

  // 3. Filter Buttons Handler (if present)
  if (filterButtons && filterButtons.length > 0) {
    filterButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        filterButtons.forEach(b => {
          b.classList.remove('active', 'bg-blue-600', 'text-white', 'shadow-md', 'shadow-blue-600/25');
          b.classList.add('bg-slate-100', 'dark:bg-slate-800/90', 'text-slate-600', 'dark:text-slate-300', 'hover:text-blue-600');
        });

        btn.classList.add('active', 'bg-blue-600', 'text-white', 'shadow-md', 'shadow-blue-600/25');
        btn.classList.remove('bg-slate-100', 'dark:bg-slate-800/90', 'text-slate-600', 'dark:text-slate-300', 'hover:text-blue-600');

        activeCategory = btn.getAttribute('data-category') || 'all';
        renderGallery();
      });
    });
  }

  // 4. Lightbox Functions
  function openLightbox(index) {
    if (!lightbox || !filteredItems[index]) return;
    currentLightboxIndex = index;
    updateLightboxContent();

    lightbox.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Animate in
    requestAnimationFrame(() => {
      const backdrop = lightbox.querySelector('.lightbox-backdrop');
      const dialog = lightbox.querySelector('.lightbox-dialog');
      if (backdrop) backdrop.classList.remove('opacity-0');
      if (dialog) {
        dialog.classList.remove('scale-95', 'opacity-0');
        dialog.classList.add('scale-100', 'opacity-100');
      }
    });

    if (window.lucide) lucide.createIcons();
  }

  function updateLightboxContent() {
    const item = filteredItems[currentLightboxIndex];
    if (!item) return;

    if (lightboxImg) lightboxImg.src = item.imageUrl || '';
    if (lightboxTitle) lightboxTitle.textContent = item.title || 'Dokumentasi Proyek';
    if (lightboxCategory) lightboxCategory.textContent = item.category || 'Sistem Terpadu';
    if (lightboxDesc) lightboxDesc.textContent = item.description || '';
    if (lightboxCounter) {
      lightboxCounter.textContent = `${currentLightboxIndex + 1} / ${filteredItems.length}`;
    }
  }

  function closeLightbox() {
    if (!lightbox) return;
    const backdrop = lightbox.querySelector('.lightbox-backdrop');
    const dialog = lightbox.querySelector('.lightbox-dialog');

    if (backdrop) backdrop.classList.add('opacity-0');
    if (dialog) {
      dialog.classList.add('scale-95', 'opacity-0');
      dialog.classList.remove('scale-100', 'opacity-100');
    }

    setTimeout(() => {
      lightbox.classList.add('hidden');
      document.body.style.overflow = '';
    }, 250);
  }

  function prevLightbox() {
    if (filteredItems.length === 0) return;
    currentLightboxIndex = (currentLightboxIndex - 1 + filteredItems.length) % filteredItems.length;
    updateLightboxContent();
  }

  function nextLightbox() {
    if (filteredItems.length === 0) return;
    currentLightboxIndex = (currentLightboxIndex + 1) % filteredItems.length;
    updateLightboxContent();
  }

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightboxPrev) lightboxPrev.addEventListener('click', (e) => { e.stopPropagation(); prevLightbox(); });
  if (lightboxNext) lightboxNext.addEventListener('click', (e) => { e.stopPropagation(); nextLightbox(); });

  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox || e.target.classList.contains('lightbox-backdrop')) {
        closeLightbox();
      }
    });
  }

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (!lightbox || lightbox.classList.contains('hidden')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') prevLightbox();
    if (e.key === 'ArrowRight') nextLightbox();
  });

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Initialize
  loadGalleryData();
});
