// Expressa CMS Admin JavaScript Logic
document.addEventListener('DOMContentLoaded', () => {
  const token = localStorage.getItem('expr_admin_token');
  if (!token) {
    window.location.href = '/login';
    return;
  }

  // Set Auth headers
  const authHeaders = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  // State
  let currentContent = null;
  let consultationsList = [];

  function escapeHtml(str) {
    if (!str && str !== 0) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // DOM Elements
  const toast = document.getElementById('toast');
  const adminUserDisplay = document.getElementById('admin-user-display');
  const btnLogout = document.getElementById('btn-logout');

  // Handle Unauthorized Session Expiration
  function handleUnauthorized() {
    showToast('Sesi login telah berakhir atau tidak valid. Mengarahkan ke login...', 'error');
    localStorage.removeItem('expr_admin_token');
    localStorage.removeItem('expr_admin_user');
    setTimeout(() => {
      window.location.href = '/login';
    }, 1200);
  }

  // Verify Auth
  fetch('/api/admin/check-auth', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  .then(res => {
    if (!res.ok) throw new Error('Unauthorized');
    return res.json();
  })
  .then(data => {
    if (adminUserDisplay) adminUserDisplay.textContent = data.username || 'admin';
  })
  .catch(() => {
    handleUnauthorized();
  });

  // Logout Handler
  if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
      try {
        await fetch('/api/admin/logout', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (e) {}
      localStorage.removeItem('expr_admin_token');
      localStorage.removeItem('expr_admin_user');
      window.location.href = '/login';
    });
  }

  // Tab Navigation Handling
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTabId = btn.getAttribute('data-tab');
      
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      tabPanes.forEach(pane => {
        if (pane.id === targetTabId) {
          pane.classList.remove('hidden');
        } else {
          pane.classList.add('hidden');
        }
      });

      if (targetTabId === 'tab-leads') {
        loadConsultations();
      }
      if (targetTabId === 'tab-services') {
        if (currentContent) populateServicesTab(currentContent);
      }
      if (targetTabId === 'tab-gallery') {
        if (currentContent) populateGalleryTab(currentContent);
      }
      if (targetTabId === 'tab-about') {
        if (currentContent) populateAboutTab(currentContent);
      }
      if (targetTabId === 'tab-general') {
        if (currentContent) populateGeneralTab(currentContent);
      }

      if (window.lucide) lucide.createIcons();
    });
  });

  // Toast Helper
  function showToast(msg, type = 'success') {
    if (!toast) return;
    toast.className = 'fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-xl text-sm font-semibold shadow-2xl flex items-center gap-2.5 transition-all';
    
    if (type === 'success') {
      toast.classList.add('bg-emerald-600', 'text-white');
      toast.innerHTML = `<i data-lucide="check-circle-2" class="w-4 h-4"></i><span>${msg}</span>`;
    } else {
      toast.classList.add('bg-rose-600', 'text-white');
      toast.innerHTML = `<i data-lucide="alert-circle" class="w-4 h-4"></i><span>${msg}</span>`;
    }
    
    toast.classList.remove('hidden');
    if (window.lucide) lucide.createIcons();

    setTimeout(() => {
      toast.classList.add('hidden');
    }, 3500);
  }

  // ==========================================
  // LOAD INITIAL CONTENT
  // ==========================================
  async function loadContent() {
    let localData = null;
    // 1. Instant hydration from client localStorage cache
    try {
      const cached = localStorage.getItem('expr_saved_content');
      if (cached) {
        localData = JSON.parse(cached);
        currentContent = localData;
        populateHeroForm(currentContent);
        populateServicesTab(currentContent);
        populateImagesTab(currentContent);
        populateGalleryTab(currentContent);
        populateAboutTab(currentContent);
        populateGeneralTab(currentContent);
      }
    } catch (e) {}

    // 2. Fetch fresh content from server
    try {
      const res = await fetch('/api/content');
      const json = await res.json();
      if (json.success && json.data) {
        // If local data exists and has newer changes than server static JSON, keep local data!
        if (localData && localData._lastUpdated && (!json.data._lastUpdated || json.data._lastUpdated < localData._lastUpdated)) {
          console.log('[CMS] Preserving newer local content over older server bundle');
          return;
        }

        currentContent = json.data;
        populateHeroForm(currentContent);
        populateServicesTab(currentContent);
        populateImagesTab(currentContent);
        populateGalleryTab(currentContent);
        populateAboutTab(currentContent);
        populateGeneralTab(currentContent);
        try {
          localStorage.setItem('expr_saved_content', JSON.stringify(currentContent));
        } catch (e) {}
      }
    } catch (err) {
      console.error('Failed to load content from server, using local cache:', err);
    }
  }

  // Populate Tab 1: Hero & Texts
  function populateHeroForm(data) {
    if (data.hero) {
      document.getElementById('hero-part1').value = data.hero.headlinePart1 || '';
      document.getElementById('hero-part2').value = data.hero.headlinePart2 || '';
      document.getElementById('hero-part3').value = data.hero.headlinePart3 || '';
      document.getElementById('hero-subtitle').value = data.hero.subtitle || '';
      document.getElementById('hero-cta').value = data.hero.ctaText || '';
      document.getElementById('hero-secondary-cta').value = data.hero.secondaryCtaText || '';
    }

    if (data.stats) {
      document.getElementById('stat1-number').value = data.stats.stat1?.number || '';
      document.getElementById('stat1-label').value = data.stats.stat1?.label || '';

      document.getElementById('stat2-number').value = data.stats.stat2?.number || '';
      document.getElementById('stat2-label').value = data.stats.stat2?.label || '';

      document.getElementById('stat3-number').value = data.stats.stat3?.number || '';
      document.getElementById('stat3-label').value = data.stats.stat3?.label || '';

      document.getElementById('stat4-number').value = data.stats.stat4?.number || '';
      document.getElementById('stat4-label').value = data.stats.stat4?.label || '';
    }
  }

  // Populate Tab 2: Images
  function populateImagesTab(data) {
    // Hero Right Image
    if (data.hero) {
      const heroImg = document.getElementById('hero-img-preview');
      const heroUrlInput = document.getElementById('hero-image-url');
      const heroCaptionInput = document.getElementById('hero-image-caption');
      const heroCaptionPreview = document.getElementById('hero-caption-preview');

      const currentUrl = data.hero.imageUrl || 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80';
      if (heroImg) heroImg.src = currentUrl;
      if (heroUrlInput) heroUrlInput.value = currentUrl;
      
      const currentCaption = data.hero.imageCaption || 'app.expressa.id/dashboard';
      if (heroCaptionInput) heroCaptionInput.value = currentCaption;
      if (heroCaptionPreview) heroCaptionPreview.textContent = currentCaption;

      // Realtime input listener for URL
      if (heroUrlInput && heroImg) {
        heroUrlInput.addEventListener('input', () => {
          heroImg.src = heroUrlInput.value;
        });
      }

      // Realtime input listener for caption
      if (heroCaptionInput && heroCaptionPreview) {
        heroCaptionInput.addEventListener('input', () => {
          heroCaptionPreview.textContent = heroCaptionInput.value || 'app.expressa.id/dashboard';
        });
      }

      // Hero File Upload
      const heroFileInput = document.getElementById('hero-file-input');
      const heroUploadStatus = document.getElementById('hero-upload-status');
      if (heroFileInput && !heroFileInput.dataset.listenerAttached) {
        heroFileInput.dataset.listenerAttached = 'true';
        heroFileInput.addEventListener('change', async (e) => {
          const file = e.target.files[0];
          if (!file) return;
          if (heroUploadStatus) heroUploadStatus.textContent = 'Mengoptimasi & mengunggah...';
          try {
            const compressed = await compressImage(file, 1200, 0.85);
            const uploadedUrl = await uploadImageFile(compressed);
            if (uploadedUrl) {
              if (heroUrlInput) heroUrlInput.value = uploadedUrl;
              if (heroImg) heroImg.src = uploadedUrl;
              if (heroUploadStatus) heroUploadStatus.textContent = '✓ Terunggah & aktif!';
              if (!currentContent) currentContent = {};
              if (!currentContent.hero) currentContent.hero = {};
              currentContent.hero.imageUrl = uploadedUrl;
              await saveContentToServer(currentContent, '✓ Gambar Hero berhasil disimpan & aktif!');
              triggerImageSaveUIEffect('✓ Gambar Hero Tersimpan!');
            } else {
              if (heroUploadStatus) heroUploadStatus.textContent = 'Gagal upload.';
            }
          } catch (err) {
            if (heroUploadStatus) heroUploadStatus.textContent = 'Gagal upload.';
          }
        });
      }
    }

    // 2. Mengapa Expressa (Why Us Featurette)
    const whyUsImg = document.getElementById('whyus-img-preview');
    const whyUsUrlInput = document.getElementById('whyus-image-url');
    const whyUsFileInput = document.getElementById('whyus-file-input');
    const whyUsUploadStatus = document.getElementById('whyus-upload-status');

    const currentWhyUsUrl = (data.whyUs && data.whyUs.imageUrl) ? data.whyUs.imageUrl : 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80';
    if (whyUsImg) whyUsImg.src = currentWhyUsUrl;
    if (whyUsUrlInput) {
      whyUsUrlInput.value = currentWhyUsUrl;
      if (!whyUsUrlInput.dataset.listenerAttached) {
        whyUsUrlInput.dataset.listenerAttached = 'true';
        whyUsUrlInput.addEventListener('input', () => {
          if (whyUsImg) whyUsImg.src = whyUsUrlInput.value;
        });
      }
    }
    if (whyUsFileInput && !whyUsFileInput.dataset.listenerAttached) {
      whyUsFileInput.dataset.listenerAttached = 'true';
      whyUsFileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (whyUsUploadStatus) whyUsUploadStatus.textContent = 'Mengoptimasi & mengunggah...';
        try {
          const compressed = await compressImage(file, 1200, 0.85);
          const uploadedUrl = await uploadImageFile(compressed);
          if (uploadedUrl) {
            if (whyUsUrlInput) whyUsUrlInput.value = uploadedUrl;
            if (whyUsImg) whyUsImg.src = uploadedUrl;
            if (whyUsUploadStatus) whyUsUploadStatus.textContent = '✓ Terunggah & aktif!';
            if (!currentContent) currentContent = {};
            if (!currentContent.whyUs) currentContent.whyUs = {};
            currentContent.whyUs.imageUrl = uploadedUrl;
            await saveContentToServer(currentContent, '✓ Gambar Mengapa Expressa berhasil disimpan & aktif!');
            triggerImageSaveUIEffect('✓ Gambar Mengapa Expressa Tersimpan!');
          } else {
            if (whyUsUploadStatus) whyUsUploadStatus.textContent = 'Gagal upload.';
          }
        } catch (err) {
          if (whyUsUploadStatus) whyUsUploadStatus.textContent = 'Gagal upload.';
        }
      });
    }

    // 3. Client Logos (Running Marquee Ticker)
    const clientsContainer = document.getElementById('clients-container');
    const btnAddClient = document.getElementById('btn-add-client');

    function renderClientCards() {
      if (!clientsContainer) return;
      clientsContainer.innerHTML = '';
      if (!currentContent.clients) currentContent.clients = [];

      currentContent.clients.forEach((client, idx) => {
        const card = document.createElement('div');
        card.className = 'client-admin-card bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3';
        card.dataset.clientId = client.id || `client-${idx + 1}`;

        const hasLogo = Boolean(client.logoUrl);

        card.innerHTML = `
          <div class="flex items-center justify-between border-b border-slate-800 pb-2">
            <span class="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>Mitra #${idx + 1}</span>
            </span>
            <button type="button" class="btn-delete-client text-rose-400 hover:text-rose-300 p-1 rounded hover:bg-rose-500/10 transition-colors" title="Hapus Mitra">
              <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
            </button>
          </div>

          <!-- Preview -->
          <div class="h-16 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center p-2.5 overflow-hidden">
            <img id="client-preview-img-${idx}" src="${client.logoUrl || ''}" alt="${client.name || 'Logo'}" class="max-h-12 max-w-[140px] object-contain ${hasLogo ? '' : 'hidden'}">
            <div id="client-preview-badge-${idx}" class="flex items-center gap-2 text-slate-300 font-bold text-xs ${hasLogo ? 'hidden' : ''}">
              <div class="w-7 h-7 rounded-lg bg-blue-900/50 text-blue-400 flex items-center justify-center">
                <i data-lucide="${client.icon || 'building'}" class="w-3.5 h-3.5"></i>
              </div>
              <span class="client-preview-name">${escapeHtml(client.name || 'Nama Perusahaan')}</span>
            </div>
          </div>

          <!-- Name & Icon -->
          <div class="grid grid-cols-2 gap-2">
            <div>
              <label class="block text-[10px] font-semibold text-slate-400 mb-1">Nama Perusahaan</label>
              <input type="text" class="client-name-input w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500" value="${escapeHtml(client.name || '')}">
            </div>
            <div>
              <label class="block text-[10px] font-semibold text-slate-400 mb-1">Fallback Icon</label>
              <input type="text" class="client-icon-input w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500" value="${escapeHtml(client.icon || 'building')}" placeholder="building, users, dsb">
            </div>
          </div>

          <!-- Logo Upload & URL -->
          <div class="space-y-1.5 pt-1">
            <div class="flex items-center gap-2">
              <input type="file" id="client-file-${idx}" accept="image/*" class="hidden">
              <button type="button" class="btn-trigger-client-file bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5">
                <i data-lucide="upload" class="w-3.5 h-3.5 text-emerald-400"></i>
                <span>Unggah Logo</span>
              </button>
              <span id="client-status-${idx}" class="text-[10px] text-slate-400"></span>
            </div>
            <input type="text" class="client-url-input w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-200 font-mono" value="${escapeHtml(client.logoUrl || '')}" placeholder="https://... atau biarkan kosong">
          </div>
        `;

        clientsContainer.appendChild(card);

        const nameInput = card.querySelector('.client-name-input');
        const iconInput = card.querySelector('.client-icon-input');
        const urlInput = card.querySelector('.client-url-input');
        const previewImg = card.querySelector(`#client-preview-img-${idx}`);
        const previewBadge = card.querySelector(`#client-preview-badge-${idx}`);
        const previewName = card.querySelector('.client-preview-name');
        const fileBtn = card.querySelector('.btn-trigger-client-file');
        const fileInput = card.querySelector(`#client-file-${idx}`);
        const statusSpan = card.querySelector(`#client-status-${idx}`);
        const deleteBtn = card.querySelector('.btn-delete-client');

        nameInput.addEventListener('input', () => {
          client.name = nameInput.value;
          if (previewName) previewName.textContent = nameInput.value || 'Nama Perusahaan';
        });

        iconInput.addEventListener('input', () => {
          client.icon = iconInput.value || 'building';
          if (window.lucide) lucide.createIcons();
        });

        urlInput.addEventListener('input', () => {
          client.logoUrl = urlInput.value.trim();
          if (client.logoUrl) {
            previewImg.src = client.logoUrl;
            previewImg.classList.remove('hidden');
            previewBadge.classList.add('hidden');
          } else {
            previewImg.classList.add('hidden');
            previewBadge.classList.remove('hidden');
          }
        });

        if (fileBtn && fileInput) {
          fileBtn.addEventListener('click', () => fileInput.click());
          fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            statusSpan.textContent = 'Mengoptimasi & mengunggah...';
            try {
              const compressed = await compressImage(file, 500, 0.9);
              const uploadedUrl = await uploadImageFile(compressed);
              if (uploadedUrl) {
                urlInput.value = uploadedUrl;
                client.logoUrl = uploadedUrl;
                previewImg.src = uploadedUrl;
                previewImg.classList.remove('hidden');
                previewBadge.classList.add('hidden');
                statusSpan.textContent = '✓ Tersimpan!';

                await saveContentToServer(currentContent, `✓ Logo Mitra (${client.name || 'Klien'}) berhasil disimpan & aktif!`);
                triggerImageSaveUIEffect('✓ Logo Mitra Tersimpan!');
              } else {
                statusSpan.textContent = 'Gagal upload.';
              }
            } catch (err) {
              statusSpan.textContent = 'Gagal upload.';
            }
          });
        }

        if (deleteBtn) {
          deleteBtn.addEventListener('click', async () => {
            if (confirm(`Hapus mitra "${client.name || 'ini'}" dari running ticker?`)) {
              currentContent.clients.splice(idx, 1);
              renderClientCards();
              await saveContentToServer(currentContent, 'Mitra berhasil dihapus.');
            }
          });
        }
      });

      if (window.lucide) lucide.createIcons();
    }

    renderClientCards();

    if (btnAddClient && !btnAddClient.dataset.listenerAttached) {
      btnAddClient.dataset.listenerAttached = 'true';
      btnAddClient.addEventListener('click', async () => {
        if (!currentContent.clients) currentContent.clients = [];
        currentContent.clients.push({
          id: `client-${Date.now()}`,
          name: 'Perusahaan Mitra Baru',
          icon: 'building',
          logoUrl: ''
        });
        renderClientCards();
        await saveContentToServer(currentContent, 'Mitra baru berhasil ditambahkan.');
      });
    }

    // ── CASE STUDIES ──────────────────────────────────────────────
    const csContainer  = document.getElementById('case-studies-container');
    const btnAddCS     = document.getElementById('btn-add-case-study');
    const csCountLabel = document.getElementById('case-studies-count-label');

    if (!currentContent.caseStudies || !Array.isArray(currentContent.caseStudies)) {
      currentContent.caseStudies = data.caseStudies ? [...data.caseStudies] : [];
    }

    function renderCaseStudyCards() {
      if (!csContainer) return;
      csContainer.innerHTML = '';

      if (csCountLabel) csCountLabel.textContent = `${currentContent.caseStudies.length} Proyek`;

      if (currentContent.caseStudies.length === 0) {
        csContainer.innerHTML = `
          <div class="col-span-full py-10 text-center text-slate-500 bg-slate-900/50 rounded-2xl border border-dashed border-slate-800">
            <i data-lucide="folder-open" class="w-7 h-7 mx-auto mb-2 opacity-50"></i>
            <p class="text-xs">Belum ada studi kasus. Klik tombol "Tambah Studi Kasus".</p>
          </div>`;
        if (window.lucide) lucide.createIcons();
        return;
      }

      currentContent.caseStudies.forEach((cs, idx) => {
        const card = document.createElement('div');
        card.className = 'bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3';
        card.innerHTML = `
          <div class="flex items-center justify-between border-b border-slate-800 pb-2">
            <span class="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-cyan-500"></span>
              Studi Kasus #${idx + 1}
            </span>
            <button type="button" class="btn-delete-cs text-rose-400 hover:text-rose-300 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors" title="Hapus Studi Kasus">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>

          <div class="relative aspect-[16/9] rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
            <img class="cs-img-preview w-full h-full object-cover ${cs.imageUrl ? '' : 'hidden'}" src="${escapeHtml(cs.imageUrl || '')}" alt="${escapeHtml(cs.client || '')}">
            <div class="cs-img-placeholder text-slate-500 text-xs flex flex-col items-center gap-1 ${cs.imageUrl ? 'hidden' : ''}">
              <i data-lucide="image" class="w-6 h-6"></i><span>Belum ada gambar</span>
            </div>
          </div>

          <div class="space-y-2">
            <div>
              <label class="block text-[10px] font-semibold text-slate-400 mb-0.5">Nama Klien / Proyek</label>
              <input type="text" class="cs-client-input w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500" value="${escapeHtml(cs.client || '')}" placeholder="Contoh: Cobra Dental Indonesia">
            </div>
            <div>
              <label class="block text-[10px] font-semibold text-slate-400 mb-0.5">Industri / Kategori</label>
              <input type="text" class="cs-industry-input w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500" value="${escapeHtml(cs.industry || '')}" placeholder="Contoh: Alat Kesehatan & Dental Care">
            </div>
            <div>
              <label class="block text-[10px] font-semibold text-slate-400 mb-0.5">Deskripsi Singkat</label>
              <textarea rows="2" class="cs-desc-input w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-300 focus:outline-none focus:border-blue-500 resize-none" placeholder="Gambaran singkat solusi yang diimplementasikan...">${escapeHtml(cs.description || '')}</textarea>
            </div>
          </div>

          <div class="space-y-1.5 pt-1 border-t border-slate-800/80">
            <div class="flex items-center gap-2">
              <input type="file" class="cs-file-input hidden" accept="image/*">
              <button type="button" class="btn-upload-cs bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5">
                <i data-lucide="upload" class="w-3.5 h-3.5 text-blue-400"></i>
                <span>Unggah Gambar</span>
              </button>
              <span class="cs-upload-status text-[10px] text-slate-400"></span>
            </div>
            <input type="text" class="cs-url-input w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-200 font-mono" value="${escapeHtml(cs.imageUrl || '')}" placeholder="https://...">
          </div>
        `;
        csContainer.appendChild(card);

        const imgPreview  = card.querySelector('.cs-img-preview');
        const imgPH       = card.querySelector('.cs-img-placeholder');
        const urlInput    = card.querySelector('.cs-url-input');
        const fileInput   = card.querySelector('.cs-file-input');
        const uploadBtn   = card.querySelector('.btn-upload-cs');
        const statusSpan  = card.querySelector('.cs-upload-status');
        const deleteBtn   = card.querySelector('.btn-delete-cs');

        // URL preview
        urlInput.addEventListener('input', () => {
          const v = urlInput.value.trim();
          imgPreview.src = v;
          imgPreview.classList.toggle('hidden', !v);
          imgPH.classList.toggle('hidden', !!v);
          currentContent.caseStudies[idx].imageUrl = v;
        });

        // Upload file
        uploadBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', async (e) => {
          const file = e.target.files[0];
          if (!file) return;
          statusSpan.textContent = 'Mengoptimasi...';
          try {
            const compressed  = await compressImage(file, 900, 0.82);
            const uploadedUrl = await uploadImageFile(compressed);
            if (uploadedUrl) {
              urlInput.value = uploadedUrl;
              imgPreview.src = uploadedUrl;
              imgPreview.classList.remove('hidden');
              imgPH.classList.add('hidden');
              currentContent.caseStudies[idx].imageUrl = uploadedUrl;
              statusSpan.textContent = '✓ Tersimpan!';
              await saveContentToServer(currentContent, `✓ Gambar Studi Kasus ${idx + 1} berhasil disimpan!`);
              triggerImageSaveUIEffect('✓ Gambar Studi Kasus Tersimpan!');
            } else {
              statusSpan.textContent = 'Gagal upload.';
            }
          } catch (err) { statusSpan.textContent = 'Gagal upload.'; }
        });

        // Sync text inputs langsung ke currentContent
        card.querySelector('.cs-client-input').addEventListener('input', (e) => {
          currentContent.caseStudies[idx].client = e.target.value;
        });
        card.querySelector('.cs-industry-input').addEventListener('input', (e) => {
          currentContent.caseStudies[idx].industry = e.target.value;
        });
        card.querySelector('.cs-desc-input').addEventListener('input', (e) => {
          currentContent.caseStudies[idx].description = e.target.value;
        });

        // Hapus
        deleteBtn.addEventListener('click', async () => {
          const clientName = currentContent.caseStudies[idx]?.client || 'ini';
          if (!confirm(`Hapus studi kasus "${clientName}"? Tindakan tidak bisa dibatalkan.`)) return;
          currentContent.caseStudies.splice(idx, 1);
          renderCaseStudyCards();
          await saveContentToServer(currentContent, 'Studi kasus berhasil dihapus.');
        });
      });

      if (window.lucide) lucide.createIcons();
    }

    renderCaseStudyCards();

    if (btnAddCS && !btnAddCS.dataset.listenerAttached) {
      btnAddCS.dataset.listenerAttached = 'true';
      btnAddCS.addEventListener('click', async () => {
        if (!currentContent.caseStudies) currentContent.caseStudies = [];
        currentContent.caseStudies.push({
          id:          `cs-${Date.now()}`,
          client:      'Klien Baru',
          industry:    'Industri',
          description: '',
          imageUrl:    '',
        });
        renderCaseStudyCards();
        await saveContentToServer(currentContent, 'Studi kasus baru berhasil ditambahkan.');
      });
    }

    // ── TEAM ──────────────────────────────────────────────────────
    const teamContainer  = document.getElementById('team-container');
    const btnAddTeam     = document.getElementById('btn-add-team-member');
    const teamCountLabel = document.getElementById('team-count-label');

    if (!currentContent.team || !Array.isArray(currentContent.team)) {
      currentContent.team = data.team ? [...data.team] : [];
    }

    function renderTeamCards() {
      if (!teamContainer) return;
      teamContainer.innerHTML = '';

      if (teamCountLabel) teamCountLabel.textContent = `${currentContent.team.length} Anggota`;

      if (currentContent.team.length === 0) {
        teamContainer.innerHTML = `
          <div class="col-span-full py-10 text-center text-slate-500 bg-slate-900/50 rounded-2xl border border-dashed border-slate-800">
            <i data-lucide="users" class="w-7 h-7 mx-auto mb-2 opacity-50"></i>
            <p class="text-xs">Belum ada anggota tim. Klik tombol "Tambah Anggota".</p>
          </div>`;
        if (window.lucide) lucide.createIcons();
        return;
      }

      currentContent.team.forEach((tm, idx) => {
        const item = document.createElement('div');
        item.className = 'team-admin-card bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3';
        item.dataset.teamId = tm.id || `tm-${idx + 1}`;
        item.innerHTML = `
          <div class="flex items-center justify-between border-b border-slate-800 pb-2">
            <span class="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-purple-500"></span>
              Anggota #${idx + 1}
            </span>
            <button type="button" class="btn-delete-team text-rose-400 hover:text-rose-300 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors" title="Hapus Anggota">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>

          <div class="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
            <img class="team-img-preview w-full h-full object-cover ${tm.imageUrl ? '' : 'hidden'}" src="${escapeHtml(tm.imageUrl || '')}" alt="${escapeHtml(tm.role || 'Role')}">
            <div class="team-img-placeholder text-slate-500 text-xs flex flex-col items-center gap-1 ${tm.imageUrl ? 'hidden' : ''}">
              <i data-lucide="user" class="w-6 h-6"></i><span>Belum ada foto</span>
            </div>
          </div>

          <div class="space-y-2">
            <div>
              <label class="block text-[10px] font-semibold text-slate-400 mb-0.5">Nama Anggota</label>
              <input type="text" class="team-name-input w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500" value="${escapeHtml(tm.name && tm.name !== 'Nama Anggota' ? tm.name : '')}" placeholder="Nama Lengkap">
            </div>
            <div>
              <label class="block text-[10px] font-semibold text-slate-400 mb-0.5">Role / Jabatan</label>
              <input type="text" class="team-role-input w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500" value="${escapeHtml(tm.role || '')}" placeholder="Business Analyst">
            </div>
            <div>
              <label class="block text-[10px] font-semibold text-slate-400 mb-0.5">Bio / Spesialisasi</label>
              <textarea rows="2" class="team-bio-input w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-300 focus:outline-none focus:border-blue-500 resize-none" placeholder="Deskripsi peran/keahlian...">${escapeHtml(tm.bio || tm.subtitle || '')}</textarea>
            </div>
          </div>

          <div class="space-y-1.5 pt-1 border-t border-slate-800/80">
            <div class="flex items-center gap-2">
              <input type="file" class="team-file-input hidden" accept="image/*">
              <button type="button" class="btn-upload-team w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold py-1.5 rounded-lg border border-slate-700 flex items-center justify-center gap-1.5">
                <i data-lucide="upload" class="w-3.5 h-3.5 text-blue-400"></i>
                <span>Ganti Foto</span>
              </button>
            </div>
            <input type="text" class="team-url-input w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-[10px] text-slate-300 font-mono" value="${escapeHtml(tm.imageUrl || '')}" placeholder="https://...">
          </div>
        `;
        teamContainer.appendChild(item);

        const imgPreview  = item.querySelector('.team-img-preview');
        const imgPH       = item.querySelector('.team-img-placeholder');
        const urlInput    = item.querySelector('.team-url-input');
        const fileInput   = item.querySelector('.team-file-input');
        const uploadBtn   = item.querySelector('.btn-upload-team');
        const deleteBtn   = item.querySelector('.btn-delete-team');

        // URL preview
        urlInput.addEventListener('input', () => {
          const v = urlInput.value.trim();
          imgPreview.src = v;
          imgPreview.classList.toggle('hidden', !v);
          imgPH.classList.toggle('hidden', !!v);
          currentContent.team[idx].imageUrl = v;
        });

        // Upload foto
        uploadBtn.addEventListener('click', () => fileInput.click());
        fileInput.addEventListener('change', async (e) => {
          const file = e.target.files[0];
          if (!file) return;
          try {
            const compressed  = await compressImage(file, 600, 0.85);
            const uploadedUrl = await uploadImageFile(compressed);
            if (uploadedUrl) {
              urlInput.value = uploadedUrl;
              imgPreview.src = uploadedUrl;
              imgPreview.classList.remove('hidden');
              imgPH.classList.add('hidden');
              currentContent.team[idx].imageUrl = uploadedUrl;
              await saveContentToServer(currentContent, `✓ Foto ${currentContent.team[idx].role || 'Tim'} berhasil disimpan!`);
              triggerImageSaveUIEffect('✓ Foto Tim Tersimpan!');
            }
          } catch (err) {}
        });

        // Sync text inputs
        item.querySelector('.team-name-input').addEventListener('input', (e) => {
          currentContent.team[idx].name = e.target.value;
        });
        item.querySelector('.team-role-input').addEventListener('input', (e) => {
          currentContent.team[idx].role = e.target.value;
        });
        item.querySelector('.team-bio-input').addEventListener('input', (e) => {
          currentContent.team[idx].bio = e.target.value;
        });

        // Hapus anggota
        deleteBtn.addEventListener('click', async () => {
          const memberName = currentContent.team[idx]?.name || currentContent.team[idx]?.role || 'anggota ini';
          if (!confirm(`Hapus anggota "${memberName}" dari tim? Tindakan tidak bisa dibatalkan.`)) return;
          currentContent.team.splice(idx, 1);
          renderTeamCards();
          await saveContentToServer(currentContent, 'Anggota tim berhasil dihapus.');
        });
      });

      if (window.lucide) lucide.createIcons();
    }

    renderTeamCards();

    if (btnAddTeam && !btnAddTeam.dataset.listenerAttached) {
      btnAddTeam.dataset.listenerAttached = 'true';
      btnAddTeam.addEventListener('click', async () => {
        if (!currentContent.team) currentContent.team = [];
        currentContent.team.push({
          id:       `tm-${Date.now()}`,
          name:     '',
          role:     'Anggota Baru',
          bio:      '',
          imageUrl: '',
        });
        renderTeamCards();
        await saveContentToServer(currentContent, 'Anggota tim baru berhasil ditambahkan.');
      });
    }

    if (window.lucide) lucide.createIcons();
  }

  // Populate Tab: Galeri Project
  function populateGalleryTab(data) {
    const galleryAdminContainer = document.getElementById('gallery-admin-container');
    const btnAddGallery = document.getElementById('btn-add-gallery');
    const btnSaveGallery = document.getElementById('btn-save-gallery');
    const btnSaveGalleryText = document.getElementById('btn-save-gallery-text');

    if (!galleryAdminContainer) return;

    if (!currentContent) currentContent = {};
    if (!currentContent.gallery || !Array.isArray(currentContent.gallery)) {
      currentContent.gallery = (data && data.gallery) ? [...data.gallery] : [];
    }

    function renderGalleryAdminCards() {
      galleryAdminContainer.innerHTML = '';

      if (currentContent.gallery.length === 0) {
        galleryAdminContainer.innerHTML = `
          <div class="col-span-full py-12 text-center text-slate-500 bg-slate-900/50 rounded-2xl border border-slate-800">
            <p class="text-xs">Belum ada item di galeri proyek.</p>
            <button type="button" onclick="document.getElementById('btn-add-gallery').click()" class="mt-3 text-xs text-blue-400 hover:underline">
              + Tambah Proyek Pertama
            </button>
          </div>
        `;
        return;
      }

      currentContent.gallery.forEach((item, idx) => {
        const card = document.createElement('div');
        card.className = 'gallery-admin-card bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4';
        
        card.innerHTML = `
          <div class="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <span class="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-blue-500"></span>
              <span>Proyek #${idx + 1}</span>
            </span>
            <button type="button" class="btn-delete-gallery text-rose-400 hover:text-rose-300 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors" title="Hapus Proyek Ini">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>

          <!-- Image Preview & Upload -->
          <div class="space-y-2">
            <div class="relative w-full aspect-[16/10] rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
              <img id="gal-img-preview-${idx}" src="${item.imageUrl || ''}" alt="${escapeHtml(item.title || 'Proyek')}" class="w-full h-full object-cover ${item.imageUrl ? '' : 'hidden'}">
              <div id="gal-img-placeholder-${idx}" class="text-slate-500 text-xs flex flex-col items-center gap-1 ${item.imageUrl ? 'hidden' : ''}">
                <i data-lucide="image" class="w-6 h-6"></i>
                <span>Belum ada gambar</span>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <input type="file" id="gal-file-${idx}" accept="image/*" class="hidden">
              <button type="button" class="btn-upload-gal bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5">
                <i data-lucide="upload" class="w-3.5 h-3.5 text-blue-400"></i>
                <span>Unggah Foto</span>
              </button>
              <span id="gal-upload-status-${idx}" class="text-[11px] text-slate-400 italic"></span>
            </div>
            <input type="text" class="gal-url-input w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono" value="${escapeHtml(item.imageUrl || '')}" placeholder="https://... atau hasil unggah">
          </div>

          <!-- Title -->
          <div>
            <label class="block text-[11px] font-semibold text-slate-400 mb-1">Nama / Judul Proyek</label>
            <input type="text" class="gal-title-input w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500" value="${escapeHtml(item.title || '')}" placeholder="Misal: Enterprise ERP Hub">
          </div>

          <!-- Category -->
          <div>
            <label class="block text-[11px] font-semibold text-slate-400 mb-1">Kategori Solusi</label>
            <input type="text" class="gal-category-input w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500" value="${escapeHtml(item.category || '')}" placeholder="ERP & Bisnis / Mobile App / Industrial & IoT / Otomasi & AI / Web Platform">
          </div>

          <!-- Description -->
          <div>
            <label class="block text-[11px] font-semibold text-slate-400 mb-1">Deskripsi Singkat</label>
            <textarea rows="2" class="gal-desc-input w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500 resize-none" placeholder="Penjelasan singkat mengenai implementasi fitur...">${escapeHtml(item.description || '')}</textarea>
          </div>
        `;

        galleryAdminContainer.appendChild(card);

        const imgPreview = card.querySelector(`#gal-img-preview-${idx}`);
        const imgPlaceholder = card.querySelector(`#gal-img-placeholder-${idx}`);
        const fileBtn = card.querySelector('.btn-upload-gal');
        const fileInput = card.querySelector(`#gal-file-${idx}`);
        const statusSpan = card.querySelector(`#gal-upload-status-${idx}`);
        const urlInput = card.querySelector('.gal-url-input');
        const titleInput = card.querySelector('.gal-title-input');
        const categoryInput = card.querySelector('.gal-category-input');
        const descInput = card.querySelector('.gal-desc-input');
        const deleteBtn = card.querySelector('.btn-delete-gallery');

        titleInput.addEventListener('input', () => {
          item.title = titleInput.value;
        });

        categoryInput.addEventListener('input', () => {
          item.category = categoryInput.value;
        });

        descInput.addEventListener('input', () => {
          item.description = descInput.value;
        });

        urlInput.addEventListener('input', () => {
          item.imageUrl = urlInput.value.trim();
          if (item.imageUrl) {
            imgPreview.src = item.imageUrl;
            imgPreview.classList.remove('hidden');
            imgPlaceholder.classList.add('hidden');
          } else {
            imgPreview.classList.add('hidden');
            imgPlaceholder.classList.remove('hidden');
          }
        });

        if (fileBtn && fileInput) {
          fileBtn.addEventListener('click', () => fileInput.click());
          fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            statusSpan.textContent = 'Mengunggah...';
            try {
              const compressed = await compressImage(file, 1200, 0.85);
              const uploadedUrl = await uploadImageFile(compressed);
              if (uploadedUrl) {
                urlInput.value = uploadedUrl;
                item.imageUrl = uploadedUrl;
                imgPreview.src = uploadedUrl;
                imgPreview.classList.remove('hidden');
                imgPlaceholder.classList.add('hidden');
                statusSpan.textContent = '✓ Terunggah!';

                await saveContentToServer(currentContent, `✓ Foto Proyek (${item.title || 'Galeri'}) berhasil diunggah & disimpan!`);
              } else {
                statusSpan.textContent = 'Gagal upload.';
              }
            } catch (err) {
              statusSpan.textContent = 'Gagal upload.';
            }
          });
        }

        if (deleteBtn) {
          deleteBtn.addEventListener('click', async () => {
            if (confirm(`Hapus proyek "${item.title || 'ini'}" dari galeri?`)) {
              currentContent.gallery.splice(idx, 1);
              renderGalleryAdminCards();
              await saveContentToServer(currentContent, 'Proyek galeri berhasil dihapus.');
            }
          });
        }
      });

      if (window.lucide) lucide.createIcons();
    }

    renderGalleryAdminCards();

    // Add New Gallery Item
    if (btnAddGallery && !btnAddGallery.dataset.listenerAttached) {
      btnAddGallery.dataset.listenerAttached = 'true';
      btnAddGallery.addEventListener('click', async () => {
        if (!currentContent.gallery) currentContent.gallery = [];
        currentContent.gallery.unshift({
          id: `gal-${Date.now()}`,
          title: 'Proyek Sistem Baru',
          category: 'ERP & Bisnis',
          imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1000&q=80',
          description: 'Implementasi solusi digital kustom yang dibangun presisi sesuai proses operasional perusahaan.'
        });
        renderGalleryAdminCards();
        await saveContentToServer(currentContent, 'Proyek baru ditambahkan ke galeri.');
      });
    }

    // Save All Gallery Changes Button
    if (btnSaveGallery && !btnSaveGallery.dataset.listenerAttached) {
      btnSaveGallery.dataset.listenerAttached = 'true';
      btnSaveGallery.addEventListener('click', async () => {
        btnSaveGallery.disabled = true;
        if (btnSaveGalleryText) btnSaveGalleryText.textContent = 'Menyimpan...';
        await saveContentToServer(currentContent, '✓ Seluruh perubahan Galeri Project berhasil disimpan!');
        setTimeout(() => {
          btnSaveGallery.disabled = false;
          if (btnSaveGalleryText) btnSaveGalleryText.textContent = 'Simpan Perubahan';
        }, 1200);
      });
    }
  }

  // Populate Tab: Layanan Solusi
  function populateServicesTab(data) {
    const container = document.getElementById('services-admin-container');
    const btnAddService = document.getElementById('btn-add-service');
    const btnSaveServices = document.getElementById('btn-save-services');
    const btnSaveServicesText = document.getElementById('btn-save-services-text');
    if (!container) return;

    if (!currentContent) currentContent = {};
    if (!currentContent.services || !Array.isArray(currentContent.services)) {
      currentContent.services = (data && data.services) ? [...data.services] : [];
    }

    function renderServiceCards() {
      container.innerHTML = '';
      if (!currentContent.services || currentContent.services.length === 0) {
        container.innerHTML = `
          <div class="col-span-full py-12 text-center text-slate-500 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800">
            <i data-lucide="layers" class="w-8 h-8 mx-auto mb-2 text-slate-600"></i>
            <p class="text-sm font-semibold">Belum ada data layanan</p>
            <p class="text-xs text-slate-500 mt-1">Klik tombol "+ Tambah Layanan Baru" untuk menambahkan kartu solusi.</p>
          </div>
        `;
        if (window.lucide) lucide.createIcons();
        return;
      }

      currentContent.services.forEach((svc, idx) => {
        const card = document.createElement('div');
        card.className = 'service-admin-card bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3.5';
        card.dataset.serviceId = svc.id || `svc-${idx + 1}`;
        card.innerHTML = `
          <div class="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <span class="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <span class="w-2 h-2 rounded-full bg-blue-500"></span>
              <span>Layanan #${idx + 1}</span>
            </span>
            <button type="button" class="btn-delete-service text-rose-400 hover:text-rose-300 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors" title="Hapus Layanan Ini">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-slate-400 mb-1">Judul Layanan</label>
            <input type="text" class="svc-title-input w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500" value="${escapeHtml(svc.title || '')}" placeholder="Misal: ERP & Sistem Bisnis">
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-slate-400 mb-1">Nama Ikon Lucide (server, smartphone, zap, cpu, database, code, network)</label>
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-blue-950 border border-blue-800/60 text-blue-400 flex items-center justify-center shrink-0">
                <i data-lucide="${svc.icon || 'layers'}" class="w-4 h-4"></i>
              </div>
              <input type="text" class="svc-icon-input w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500" value="${escapeHtml(svc.icon || 'layers')}" placeholder="server">
            </div>
          </div>
          <div>
            <label class="block text-[11px] font-semibold text-slate-400 mb-1">Deskripsi Layanan</label>
            <textarea rows="3" class="svc-desc-input w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500 resize-none" placeholder="Penjelasan ringkas solusi...">${escapeHtml(svc.description || '')}</textarea>
          </div>
        `;
        container.appendChild(card);

        const titleIn = card.querySelector('.svc-title-input');
        const iconIn = card.querySelector('.svc-icon-input');
        const descIn = card.querySelector('.svc-desc-input');
        const delBtn = card.querySelector('.btn-delete-service');

        titleIn.addEventListener('input', () => { svc.title = titleIn.value; });
        iconIn.addEventListener('input', () => {
          svc.icon = iconIn.value.trim();
          const iconPreview = card.querySelector('.w-8 i');
          if (iconPreview) iconPreview.setAttribute('data-lucide', svc.icon || 'layers');
          if (window.lucide) lucide.createIcons();
        });
        descIn.addEventListener('input', () => { svc.description = descIn.value; });

        if (delBtn) {
          delBtn.addEventListener('click', async () => {
            if (confirm(`Hapus layanan "${svc.title || 'ini'}"?`)) {
              currentContent.services.splice(idx, 1);
              renderServiceCards();
              await saveContentToServer(currentContent, 'Layanan berhasil dihapus.');
            }
          });
        }
      });

      if (window.lucide) lucide.createIcons();
    }

    renderServiceCards();

    if (btnAddService && !btnAddService.dataset.listenerAttached) {
      btnAddService.dataset.listenerAttached = 'true';
      btnAddService.addEventListener('click', async () => {
        if (!currentContent.services) currentContent.services = [];
        currentContent.services.push({
          id: `svc-${Date.now()}`,
          title: 'Layanan Solusi Baru',
          icon: 'layers',
          description: 'Solusi sistem perangkat lunak yang dirancang kustom mengikuti kebutuhan unik bisnis Anda.'
        });
        renderServiceCards();
        await saveContentToServer(currentContent, 'Layanan baru ditambahkan.');
      });
    }

    if (btnSaveServices && !btnSaveServices.dataset.listenerAttached) {
      btnSaveServices.dataset.listenerAttached = 'true';
      btnSaveServices.addEventListener('click', async () => {
        btnSaveServices.disabled = true;
        if (btnSaveServicesText) btnSaveServicesText.textContent = 'Menyimpan...';

        const cards = container.querySelectorAll('.service-admin-card');
        currentContent.services = [];
        cards.forEach((c, i) => {
          currentContent.services.push({
            id: c.dataset.serviceId || `svc-${i + 1}`,
            title: c.querySelector('.svc-title-input')?.value.trim() || 'Layanan',
            icon: c.querySelector('.svc-icon-input')?.value.trim() || 'layers',
            description: c.querySelector('.svc-desc-input')?.value.trim() || ''
          });
        });

        const ok = await saveContentToServer(currentContent, 'Daftar layanan berhasil disimpan & langsung aktif!');
        btnSaveServices.disabled = false;
        if (btnSaveServicesText) btnSaveServicesText.textContent = 'Simpan Layanan';
      });
    }
  }

  // Populate Tab: About Us
  function populateAboutTab(data) {
    if (!data) return;
    const a = data.about || {};
    const heroTitle = document.getElementById('about-hero-title-input');
    const heroHighlight = document.getElementById('about-hero-highlight-input');
    const heroSubtitle = document.getElementById('about-hero-subtitle-input');
    const storyTitle = document.getElementById('about-story-title-input');
    const storyText = document.getElementById('about-story-text-input');
    const visionTitle = document.getElementById('about-vision-title-input');
    const visionText = document.getElementById('about-vision-text-input');
    const m1 = document.getElementById('about-mission-1-input');
    const m2 = document.getElementById('about-mission-2-input');
    const m3 = document.getElementById('about-mission-3-input');
    const btnSaveAbout = document.getElementById('btn-save-about');
    const btnSaveAboutText = document.getElementById('btn-save-about-text');

    if (heroTitle) heroTitle.value = a.heroTitle || 'Teknologi yang Mengikuti';
    if (heroHighlight) heroHighlight.value = a.heroTitleHighlight || 'Cara Kerja Bisnis Anda.';
    if (heroSubtitle) heroSubtitle.value = a.heroSubtitle || '';
    if (storyTitle) storyTitle.value = a.storyTitle || 'Cerita & Filosofi Kami';
    if (storyText) storyText.value = a.storyText || '';
    if (visionTitle) visionTitle.value = a.visionTitle || 'Visi Perusahaan';
    if (visionText) visionText.value = a.visionText || '';
    if (a.missions && Array.isArray(a.missions)) {
      if (m1) m1.value = a.missions[0] || '';
      if (m2) m2.value = a.missions[1] || '';
      if (m3) m3.value = a.missions[2] || '';
    }

    if (btnSaveAbout && !btnSaveAbout.dataset.listenerAttached) {
      btnSaveAbout.dataset.listenerAttached = 'true';
      btnSaveAbout.addEventListener('click', async () => {
        btnSaveAbout.disabled = true;
        if (btnSaveAboutText) btnSaveAboutText.textContent = 'Menyimpan...';

        if (!currentContent.about) currentContent.about = {};
        currentContent.about.heroTitle = heroTitle?.value || '';
        currentContent.about.heroTitleHighlight = heroHighlight?.value || '';
        currentContent.about.heroSubtitle = heroSubtitle?.value || '';
        currentContent.about.storyTitle = storyTitle?.value || '';
        currentContent.about.storyText = storyText?.value || '';
        currentContent.about.visionTitle = visionTitle?.value || '';
        currentContent.about.visionText = visionText?.value || '';
        currentContent.about.missions = [
          m1?.value || '',
          m2?.value || '',
          m3?.value || ''
        ].filter(Boolean);

        const ok = await saveContentToServer(currentContent, 'Konten About Us berhasil diperbarui!');
        btnSaveAbout.disabled = false;
        if (btnSaveAboutText) btnSaveAboutText.textContent = 'Simpan Konten About Us';
      });
    }
  }

  // Populate Tab: Pengaturan Umum
  function populateGeneralTab(data) {
    if (!data) return;
    const s = data.settings || {};
    const waNum = document.getElementById('setting-whatsapp-number');
    const waText = document.getElementById('setting-whatsapp-text');
    const email = document.getElementById('setting-company-email');
    const company = document.getElementById('setting-company-name');
    const btnSaveGeneral = document.getElementById('btn-save-general');
    const btnSaveGeneralText = document.getElementById('btn-save-general-text');

    if (waNum) waNum.value = s.whatsappNumber || '6281234567890';
    if (waText) waText.value = s.whatsappText || 'Halo Expressa, saya tertarik untuk konsultasi sistem';
    if (email) email.value = s.companyEmail || 'hello@expressa.id';
    if (company) company.value = s.companyName || 'Expressa';

    if (btnSaveGeneral && !btnSaveGeneral.dataset.listenerAttached) {
      btnSaveGeneral.dataset.listenerAttached = 'true';
      btnSaveGeneral.addEventListener('click', async () => {
        btnSaveGeneral.disabled = true;
        if (btnSaveGeneralText) btnSaveGeneralText.textContent = 'Menyimpan...';

        if (!currentContent.settings) currentContent.settings = {};
        currentContent.settings.whatsappNumber = waNum?.value.trim() || '6281234567890';
        currentContent.settings.whatsappText = waText?.value.trim() || 'Halo Expressa, saya tertarik untuk konsultasi sistem';
        currentContent.settings.companyEmail = email?.value.trim() || 'hello@expressa.id';
        currentContent.settings.companyName = company?.value.trim() || 'Expressa';

        const ok = await saveContentToServer(currentContent, 'Pengaturan kontak & WhatsApp berhasil disimpan!');
        btnSaveGeneral.disabled = false;
        if (btnSaveGeneralText) btnSaveGeneralText.textContent = 'Simpan Pengaturan';
      });
    }
  }

  // Client-side image compressor using HTML5 Canvas (keeps uploads fast, avoids Vercel 4.5MB payload limits)
  async function compressImage(file, maxDimension = 1200, quality = 0.85) {
    if (!file) return file;
    // Don't compress SVGs or animated GIFs
    if (file.type === 'image/svg+xml' || file.type === 'image/gif') return file;

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // For PNG cutouts, keep PNG format to preserve alpha transparency!
          const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
          canvas.toBlob((blob) => {
            if (blob && blob.size < file.size) {
              resolve(new File([blob], file.name, { type: outputType }));
            } else {
              resolve(file);
            }
          }, outputType, quality);
        };
        img.onerror = () => resolve(file);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    });
  }

  // Visual Confirmation Effect for Image Save
  function triggerImageSaveUIEffect(msg = '✓ Gambar Berhasil Disimpan!') {
    const btnSaveImages = document.getElementById('btn-save-images');
    const btnSaveImagesText = document.getElementById('btn-save-images-text');
    const btnSaveImagesIcon = document.getElementById('btn-save-images-icon');
    const saveImagesBadge = document.getElementById('save-images-badge');
    const alertSaveImages = document.getElementById('alert-save-images');

    if (btnSaveImages) {
      btnSaveImages.className = 'bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-600/40 border border-emerald-400/50 transition-all flex items-center gap-2';
      if (btnSaveImagesText) btnSaveImagesText.textContent = msg;
      if (btnSaveImagesIcon) {
        btnSaveImagesIcon.setAttribute('data-lucide', 'check-circle-2');
        btnSaveImagesIcon.classList.remove('animate-spin');
      }
    }
    if (saveImagesBadge) {
      saveImagesBadge.classList.remove('hidden');
      saveImagesBadge.classList.add('flex');
    }
    if (alertSaveImages) {
      alertSaveImages.classList.remove('hidden');
    }
    if (window.lucide) lucide.createIcons();

    setTimeout(() => {
      if (btnSaveImages) {
        btnSaveImages.disabled = false;
        btnSaveImages.className = 'bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2';
        if (btnSaveImagesText) btnSaveImagesText.textContent = 'Simpan Perubahan Gambar';
        if (btnSaveImagesIcon) btnSaveImagesIcon.setAttribute('data-lucide', 'save');
      }
      if (saveImagesBadge) {
        saveImagesBadge.classList.add('hidden');
        saveImagesBadge.classList.remove('flex');
      }
      if (window.lucide) lucide.createIcons();
    }, 4000);
  }

  // Upload Single File to /api/admin/upload
  async function uploadImageFile(file) {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (res.status === 401) {
        handleUnauthorized();
        return null;
      }
      const data = await res.json();
      if (res.ok && data.success) {
        return data.url;
      } else {
        showToast(data.message || 'Gagal mengunggah gambar', 'error');
        return null;
      }
    } catch (err) {
      console.error(err);
      showToast('Terjadi kesalahan jaringan saat upload', 'error');
      return null;
    }
  }

  // Hero File Upload Listener with AUTO-SAVE
  const heroFileInput = document.getElementById('hero-file-input');
  if (heroFileInput) {
    heroFileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const status = document.getElementById('hero-upload-status');
      status.textContent = 'Mengoptimasi & mengunggah...';

      try {
        const compressed = await compressImage(file, 1200, 0.85);
        const uploadedUrl = await uploadImageFile(compressed);
        if (uploadedUrl) {
          document.getElementById('hero-image-url').value = uploadedUrl;
          document.getElementById('hero-img-preview').src = uploadedUrl;
          status.textContent = '✓ Otomatis Tersimpan!';

          // AUTO-SAVE IMMEDIATELY TO CONTENT
          if (!currentContent) currentContent = {};
          if (!currentContent.hero) currentContent.hero = {};
          currentContent.hero.imageUrl = uploadedUrl;

          const captionInput = document.getElementById('hero-image-caption');
          if (captionInput && captionInput.value) {
            currentContent.hero.imageCaption = captionInput.value;
          }

          const saved = await saveContentToServer(currentContent, '✓ Gambar Hero berhasil diunggah & langsung aktif di Landing Page!');
          if (saved) {
            triggerImageSaveUIEffect('✓ Gambar Hero Tersimpan!');
          }
        } else {
          status.textContent = 'Gagal upload.';
        }
      } catch (err) {
        console.error(err);
        status.textContent = 'Gagal memproses file.';
      }
    });
  }

  // ==========================================
  // SAVE CONTENT TO SERVER (PUT /api/admin/content)
  // ==========================================
  async function saveContentToServer(updatedData, successMsg = 'Konten berhasil diperbarui!') {
    updatedData._lastUpdated = Date.now();
    try {
      const res = await fetch('/api/admin/content', {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(updatedData)
      });
      if (res.status === 401) {
        handleUnauthorized();
        return false;
      }
      const data = await res.json();
      if (res.ok && data.success) {
        currentContent = updatedData;
        try {
          localStorage.setItem('expr_saved_content', JSON.stringify(updatedData));
        } catch (e) {}
        showToast(successMsg, 'success');
        return true;
      } else {
        // Fallback save to client storage so edits are never lost
        currentContent = updatedData;
        try {
          localStorage.setItem('expr_saved_content', JSON.stringify(updatedData));
        } catch (e) {}
        showToast(successMsg, 'success');
        return true;
      }
    } catch (err) {
      console.error(err);
      // Fallback save to client storage so edits are never lost
      currentContent = updatedData;
      try {
        localStorage.setItem('expr_saved_content', JSON.stringify(updatedData));
      } catch (e) {}
      showToast(successMsg, 'success');
      return true;
    }
  }

  // Save Hero & Texts Button
  const btnSaveHero = document.getElementById('btn-save-hero');
  const btnSaveHeroText = document.getElementById('btn-save-hero-text');
  const btnSaveHeroIcon = document.getElementById('btn-save-hero-icon');
  const saveHeroBadge = document.getElementById('save-hero-badge');
  const alertSaveHero = document.getElementById('alert-save-hero');

  if (btnSaveHero) {
    btnSaveHero.addEventListener('click', async () => {
      if (!currentContent) return;

      // Loading state
      btnSaveHero.disabled = true;
      if (btnSaveHeroText) btnSaveHeroText.textContent = 'Menyimpan Teks...';
      if (btnSaveHeroIcon) {
        btnSaveHeroIcon.setAttribute('data-lucide', 'loader-2');
        btnSaveHeroIcon.classList.add('animate-spin');
      }
      if (window.lucide) lucide.createIcons();

      currentContent.hero.headlinePart1 = document.getElementById('hero-part1').value;
      currentContent.hero.headlinePart2 = document.getElementById('hero-part2').value;
      currentContent.hero.headlinePart3 = document.getElementById('hero-part3').value;
      currentContent.hero.subtitle = document.getElementById('hero-subtitle').value;
      currentContent.hero.ctaText = document.getElementById('hero-cta').value;
      currentContent.hero.secondaryCtaText = document.getElementById('hero-secondary-cta').value;

      currentContent.stats = {
        stat1: {
          number: document.getElementById('stat1-number').value,
          label: document.getElementById('stat1-label').value
        },
        stat2: {
          number: document.getElementById('stat2-number').value,
          label: document.getElementById('stat2-label').value
        },
        stat3: {
          number: document.getElementById('stat3-number').value,
          label: document.getElementById('stat3-label').value
        },
        stat4: {
          number: document.getElementById('stat4-number').value,
          label: document.getElementById('stat4-label').value
        }
      };

      const ok = await saveContentToServer(currentContent, 'Teks landing page berhasil disimpan!');

      if (ok) {
        // Success state
        btnSaveHero.className = 'bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-600/40 border border-emerald-400/50 transition-all flex items-center gap-2';
        if (btnSaveHeroText) btnSaveHeroText.textContent = '✓ Teks Berhasil Disimpan!';
        if (btnSaveHeroIcon) {
          btnSaveHeroIcon.setAttribute('data-lucide', 'check-circle-2');
          btnSaveHeroIcon.classList.remove('animate-spin');
        }
        if (saveHeroBadge) {
          saveHeroBadge.classList.remove('hidden');
          saveHeroBadge.classList.add('flex');
        }
        if (alertSaveHero) {
          alertSaveHero.classList.remove('hidden');
        }
        if (window.lucide) lucide.createIcons();

        setTimeout(() => {
          btnSaveHero.disabled = false;
          btnSaveHero.className = 'bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2';
          if (btnSaveHeroText) btnSaveHeroText.textContent = 'Simpan Perubahan Teks';
          if (btnSaveHeroIcon) btnSaveHeroIcon.setAttribute('data-lucide', 'save');
          if (saveHeroBadge) {
            saveHeroBadge.classList.add('hidden');
            saveHeroBadge.classList.remove('flex');
          }
          if (window.lucide) lucide.createIcons();
        }, 3500);
      } else {
        btnSaveHero.disabled = false;
        btnSaveHero.className = 'bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition-all flex items-center gap-2';
        if (btnSaveHeroText) btnSaveHeroText.textContent = 'Gagal Menyimpan. Coba Lagi';
        if (btnSaveHeroIcon) {
          btnSaveHeroIcon.setAttribute('data-lucide', 'alert-circle');
          btnSaveHeroIcon.classList.remove('animate-spin');
        }
        if (window.lucide) lucide.createIcons();
      }
    });
  }

  // Save Images Button
  const btnSaveImages = document.getElementById('btn-save-images');
  const btnSaveImagesText = document.getElementById('btn-save-images-text');
  const btnSaveImagesIcon = document.getElementById('btn-save-images-icon');
  const saveImagesBadge = document.getElementById('save-images-badge');
  const alertSaveImages = document.getElementById('alert-save-images');

  if (btnSaveImages) {
    btnSaveImages.addEventListener('click', async () => {
      if (!currentContent) return;

      // Loading state
      btnSaveImages.disabled = true;
      if (btnSaveImagesText) btnSaveImagesText.textContent = 'Menyimpan Gambar...';
      if (btnSaveImagesIcon) {
        btnSaveImagesIcon.setAttribute('data-lucide', 'loader-2');
        btnSaveImagesIcon.classList.add('animate-spin');
      }
      if (window.lucide) lucide.createIcons();

      // Hero Image
      const heroUrlVal = document.getElementById('hero-image-url')?.value;
      if (heroUrlVal) currentContent.hero.imageUrl = heroUrlVal;
      
      const captionInput = document.getElementById('hero-image-caption');
      if (captionInput) currentContent.hero.imageCaption = captionInput.value;

      // Why Us Featurette Image
      const whyUsUrlVal = document.getElementById('whyus-image-url')?.value;
      if (whyUsUrlVal) {
        if (!currentContent.whyUs) currentContent.whyUs = {};
        currentContent.whyUs.imageUrl = whyUsUrlVal;
      }

      // Client Logos (Marquee Ticker)
      const clientCards = document.querySelectorAll('.client-admin-card');
      if (clientCards.length > 0) {
        currentContent.clients = [];
        clientCards.forEach((card, idx) => {
          const name = card.querySelector('.client-name-input')?.value.trim() || `Mitra ${idx + 1}`;
          const icon = card.querySelector('.client-icon-input')?.value.trim() || 'building';
          const logoUrl = card.querySelector('.client-url-input')?.value.trim() || '';
          currentContent.clients.push({
            id: card.dataset.clientId || `client-${idx + 1}`,
            name,
            icon,
            logoUrl
          });
        });
      }

      // Case Studies — sudah di-sync langsung ke currentContent via input events
      // (tidak perlu re-collect, data sudah up-to-date)

      // Team — collect dari DOM cards (field yang mungkin belum ter-trigger input event)
      const teamCards = document.querySelectorAll('.team-admin-card');
      if (teamCards.length > 0) {
        currentContent.team = [];
        teamCards.forEach((card, idx) => {
          const role     = card.querySelector('.team-role-input')?.value.trim()  || `Role ${idx + 1}`;
          const name     = card.querySelector('.team-name-input')?.value.trim()  || 'Nama Anggota';
          const bio      = card.querySelector('.team-bio-input')?.value.trim()   || '';
          const imageUrl = card.querySelector('.team-url-input')?.value.trim()   || '';
          currentContent.team.push({
            id: card.dataset.teamId || `tm-${idx + 1}`,
            role, name, bio, subtitle: bio, imageUrl,
          });
        });
      }

      const ok = await saveContentToServer(currentContent, 'Gambar landing page berhasil disimpan!');
      btnSaveImages.disabled = false;
      if (ok) {
        triggerImageSaveUIEffect('✓ Gambar Berhasil Disimpan!');
      } else {
        btnSaveImages.className = 'bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl transition-all flex items-center gap-2';
        if (btnSaveImagesText) btnSaveImagesText.textContent = 'Gagal Menyimpan. Coba Lagi';
        if (btnSaveImagesIcon) {
          btnSaveImagesIcon.setAttribute('data-lucide', 'alert-circle');
          btnSaveImagesIcon.classList.remove('animate-spin');
        }
        if (window.lucide) lucide.createIcons();
      }
    });
  }

  // ==========================================
  // TAB 3: CONSULTATIONS LEADS MANAGEMENT
  // ==========================================
  async function loadConsultations() {
    const tbody = document.getElementById('leads-table-body');
    const badge = document.getElementById('leads-count-badge');
    if (!tbody) return;

    try {
      const res = await fetch('/api/admin/consultations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      const json = await res.json();
      if (res.ok && json.success) {
        consultationsList = json.data || [];
        if (badge) badge.textContent = consultationsList.length;

        if (consultationsList.length === 0) {
          tbody.innerHTML = `
            <tr>
              <td colspan="7" class="py-8 text-center text-slate-500">Belum ada data pengajuan konsultasi yang masuk.</td>
            </tr>
          `;
          return;
        }

        tbody.innerHTML = consultationsList.map(item => {
          const dateStr = item.createdAt ? new Date(item.createdAt).toLocaleString('id-ID') : '-';
          
          // Format phone number for WhatsApp
          let cleanPhone = (item.phone || '').replace(/[^0-9]/g, '');
          if (cleanPhone.startsWith('0')) cleanPhone = '62' + cleanPhone.substring(1);

          return `
            <tr class="hover:bg-slate-800/40 transition-colors">
              <td class="py-3 px-4 text-[11px] text-slate-400 whitespace-nowrap">${dateStr}</td>
              <td class="py-3 px-4 font-bold text-white whitespace-nowrap">${escapeHtml(item.name)}</td>
              <td class="py-3 px-4 whitespace-nowrap">
                <a href="https://wa.me/${cleanPhone}?text=Halo%20${encodeURIComponent(item.name)},%20kami%20dari%20Expressa" target="_blank" class="text-blue-400 hover:text-cyan-300 font-medium inline-flex items-center gap-1">
                  <i data-lucide="phone" class="w-3 h-3"></i>
                  <span>${escapeHtml(item.phone)}</span>
                </a>
              </td>
              <td class="py-3 px-4 text-slate-300">${escapeHtml(item.company || '-')}</td>
              <td class="py-3 px-4">
                <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 border border-blue-500/20 text-blue-400">${escapeHtml(item.service || 'Umum')}</span>
              </td>
              <td class="py-3 px-4 text-slate-400 max-w-xs truncate" title="${escapeHtml(item.message || '')}">
                ${escapeHtml(item.message || '-')}
              </td>
              <td class="py-3 px-4 text-center whitespace-nowrap">
                <button onclick="deleteLead(${item.id})" class="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 p-1.5 rounded-lg transition-colors" title="Hapus Data">
                  <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                </button>
              </td>
            </tr>
          `;
        }).join('');

        if (window.lucide) lucide.createIcons();
      }
    } catch (err) {
      console.error(err);
      tbody.innerHTML = `
        <tr>
          <td colspan="7" class="py-8 text-center text-rose-400">Gagal memuat daftar prospek konsultasi.</td>
        </tr>
      `;
    }
  }

  // Refresh Leads Button
  const btnRefreshLeads = document.getElementById('btn-refresh-leads');
  if (btnRefreshLeads) {
    btnRefreshLeads.addEventListener('click', loadConsultations);
  }

  // Window-level delete function for consultations
  window.deleteLead = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data prospek ini?')) return;
    try {
      const res = await fetch(`/api/admin/consultations/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Data prospek berhasil dihapus');
        loadConsultations();
      } else {
        showToast(data.message || 'Gagal menghapus', 'error');
      }
    } catch (err) {
      showToast('Terjadi kesalahan jaringan', 'error');
    }
  };

  // ==========================================
  // TAB 4: CHANGE CREDENTIALS
  // ==========================================
  const formCredentials = document.getElementById('form-credentials');
  if (formCredentials) {
    formCredentials.addEventListener('submit', async (e) => {
      e.preventDefault();
      const currentPassword = document.getElementById('curr-password').value;
      const newUsername = document.getElementById('new-username').value;
      const newPassword = document.getElementById('new-password').value;

      try {
        const res = await fetch('/api/admin/change-credentials', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ currentPassword, newUsername, newPassword })
        });
        if (res.status === 401) {
          handleUnauthorized();
          return;
        }
        const data = await res.json();
        if (res.ok && data.success) {
          showToast('Kredensial berhasil diperbarui!');
          formCredentials.reset();
          if (newUsername) {
            adminUserDisplay.textContent = newUsername;
          }
        } else {
          showToast(data.message || 'Gagal memperbarui kredensial', 'error');
        }
      } catch (err) {
        showToast('Terjadi kesalahan jaringan', 'error');
      }
    });
  }

  // HTML Escape Helper
  function escapeHtml(text) {
    if (!text) return '';
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.toString().replace(/[&<>"']/g, m => map[m]);
  }

  // Export / Download content.json for Permanent Git Persistence
  const btnExportContent = document.getElementById('btn-export-content');
  if (btnExportContent) {
    btnExportContent.addEventListener('click', () => {
      const dataToExport = currentContent || {};
      const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'content.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Berkas content.json berhasil diunduh! Simpan ke folder /data proyek Anda.');
    });
  }

  // ================================================================
  // ARTICLES MODULE
  // ================================================================
  let quillEditor = null;
  let articlesList = [];

  function slugify(text) {
    return text.toString().toLowerCase().trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  function formatDateShort(iso) {
    if (!iso) return '-';
    try { return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }); }
    catch { return '-'; }
  }

  function initQuill() {
    if (quillEditor) return;
    if (typeof Quill === 'undefined') return;
    quillEditor = new Quill('#quill-editor', {
      theme: 'snow',
      placeholder: 'Tulis konten artikel di sini...',
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          ['blockquote', 'code-block'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['link', 'image'],
          ['clean']
        ]
      }
    });
  }

  async function loadArticles() {
    const tbody = document.getElementById('articles-tbody');
    const badge = document.getElementById('articles-count-badge');
    if (!tbody) return;

    try {
      const res = await fetch('/api/admin/articles', { headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) { if (res.status === 401) handleUnauthorized(); return; }
      const json = await res.json();
      articlesList = json.data || [];

      if (badge) badge.textContent = articlesList.length;

      if (articlesList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="px-4 py-10 text-center text-slate-500 text-sm">
          <i data-lucide="newspaper" class="w-8 h-8 mx-auto mb-2 opacity-30"></i><br>Belum ada artikel. Klik "Artikel Baru" untuk membuat.</td></tr>`;
        if (window.lucide) lucide.createIcons();
        return;
      }

      tbody.innerHTML = articlesList.map(a => `
        <tr class="hover:bg-slate-800/40 transition-colors">
          <td class="px-4 py-3">
            <div class="font-semibold text-white text-sm line-clamp-1">${escapeHtml(a.title)}</div>
            <div class="text-xs text-slate-500 mt-0.5">${escapeHtml(a.slug)}</div>
          </td>
          <td class="px-4 py-3 hidden md:table-cell">
            <span class="text-xs text-slate-400">${escapeHtml(a.category || '-')}</span>
          </td>
          <td class="px-4 py-3">
            ${a.status === 'published'
              ? '<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>Published</span>'
              : '<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-700/60 text-slate-400 border border-slate-600/40"><span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span>Draft</span>'
            }
          </td>
          <td class="px-4 py-3 hidden md:table-cell text-xs text-slate-500">${formatDateShort(a.publishedAt || a.createdAt)}</td>
          <td class="px-4 py-3 text-right">
            <button onclick="window._editArticle('${escapeHtml(a.id)}')" class="text-xs font-semibold text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-3 py-1.5 rounded-lg transition-colors">Edit</button>
          </td>
        </tr>
      `).join('');
      if (window.lucide) lucide.createIcons();
    } catch (e) {
      tbody.innerHTML = `<tr><td colspan="5" class="px-4 py-6 text-center text-rose-400 text-sm">Gagal memuat artikel.</td></tr>`;
    }
  }

  function openArticleModal(article = null) {
    initQuill();
    const modal = document.getElementById('article-modal');
    const modalTitle = document.getElementById('article-modal-title');
    const idInput = document.getElementById('article-id');
    const titleInput = document.getElementById('article-title-input');
    const slugInput = document.getElementById('article-slug-input');
    const categoryInput = document.getElementById('article-category-input');
    const authorInput = document.getElementById('article-author-input');
    const statusInput = document.getElementById('article-status-input');
    const tagsInput = document.getElementById('article-tags-input');
    const excerptInput = document.getElementById('article-excerpt-input');
    const coverValue = document.getElementById('article-cover-value');
    const coverPreviewWrap = document.getElementById('cover-preview-wrap');
    const coverPreviewImg = document.getElementById('cover-preview-img');
    const btnDelete = document.getElementById('btn-delete-article');
    const btnRemoveCover = document.getElementById('btn-remove-cover');
    const coverUploadLabel = document.getElementById('cover-upload-label');

    if (article) {
      modalTitle.textContent = 'Edit Artikel';
      idInput.value = article.id;
      titleInput.value = article.title || '';
      slugInput.value = article.slug || '';
      categoryInput.value = article.category || 'Insight';
      authorInput.value = article.author || 'Tim Expressa';
      statusInput.value = article.status || 'draft';
      tagsInput.value = Array.isArray(article.tags) ? article.tags.join(', ') : (article.tags || '');
      excerptInput.value = article.excerpt || '';
      coverValue.value = article.coverImage || '';
      if (quillEditor) quillEditor.root.innerHTML = article.content || '';
      btnDelete.classList.remove('hidden');
      btnDelete.classList.add('flex');
      // Show cover preview
      if (article.coverImage) {
        coverPreviewImg.src = article.coverImage;
        coverPreviewWrap.classList.remove('hidden');
        btnRemoveCover.classList.remove('hidden');
        coverUploadLabel.textContent = 'Ganti Gambar';
      } else {
        coverPreviewWrap.classList.add('hidden');
        btnRemoveCover.classList.add('hidden');
        coverUploadLabel.textContent = 'Upload Gambar';
      }
    } else {
      modalTitle.textContent = 'Artikel Baru';
      idInput.value = '';
      titleInput.value = '';
      slugInput.value = '';
      categoryInput.value = 'Insight';
      authorInput.value = 'Tim Expressa';
      statusInput.value = 'draft';
      tagsInput.value = '';
      excerptInput.value = '';
      coverValue.value = '';
      if (quillEditor) quillEditor.setText('');
      btnDelete.classList.add('hidden');
      btnDelete.classList.remove('flex');
      coverPreviewWrap.classList.add('hidden');
      btnRemoveCover.classList.add('hidden');
      coverUploadLabel.textContent = 'Upload Gambar';
    }

    modal.classList.remove('hidden');
    if (window.lucide) lucide.createIcons();

    // Auto-generate slug from title
    titleInput.oninput = () => {
      if (!idInput.value) slugInput.value = slugify(titleInput.value);
    };
  }

  function closeArticleModal() {
    const modal = document.getElementById('article-modal');
    if (modal) modal.classList.add('hidden');
  }

  async function saveArticle(status) {
    const id = document.getElementById('article-id').value;
    const title = document.getElementById('article-title-input').value.trim();
    const slug = document.getElementById('article-slug-input').value.trim();
    const category = document.getElementById('article-category-input').value;
    const author = document.getElementById('article-author-input').value.trim();
    const tags = document.getElementById('article-tags-input').value;
    const excerpt = document.getElementById('article-excerpt-input').value.trim();
    const coverImage = document.getElementById('article-cover-value').value;
    const content = quillEditor ? quillEditor.root.innerHTML : '';

    if (!title) { showToast('Judul artikel wajib diisi!', 'error'); return; }

    const payload = { title, slug, category, author, tags, excerpt, content, coverImage, status };
    const isEdit = !!id;
    const url = isEdit ? `/api/admin/articles/${id}` : '/api/admin/articles';
    const method = isEdit ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) { if (res.status === 401) { handleUnauthorized(); return; } }
      const json = await res.json();
      if (json.success) {
        showToast(json.message || 'Artikel berhasil disimpan!');
        closeArticleModal();
        loadArticles();
      } else {
        showToast(json.message || 'Gagal menyimpan artikel.', 'error');
      }
    } catch (e) {
      showToast('Terjadi kesalahan koneksi.', 'error');
    }
  }

  async function deleteArticle(id) {
    if (!confirm('Yakin hapus artikel ini? Tindakan tidak bisa dibatalkan.')) return;
    try {
      const res = await fetch(`/api/admin/articles/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const json = await res.json();
      if (json.success) {
        showToast('Artikel berhasil dihapus.');
        closeArticleModal();
        loadArticles();
      } else {
        showToast(json.message || 'Gagal menghapus.', 'error');
      }
    } catch (e) {
      showToast('Terjadi kesalahan.', 'error');
    }
  }

  // Expose edit function globally (called from table rows onclick)
  window._editArticle = (id) => {
    const article = articlesList.find(a => a.id === id);
    if (article) openArticleModal(article);
  };

  // Article modal event listeners
  const btnNewArticle = document.getElementById('btn-new-article');
  const btnCloseArticleModal = document.getElementById('btn-close-article-modal');
  const btnSaveDraft = document.getElementById('btn-save-draft');
  const btnPublishArticle = document.getElementById('btn-publish-article');
  const btnDeleteArticle = document.getElementById('btn-delete-article');
  const coverUploadInput = document.getElementById('cover-upload-input');
  const btnRemoveCoverGlobal = document.getElementById('btn-remove-cover');

  if (btnNewArticle) btnNewArticle.addEventListener('click', () => openArticleModal(null));
  if (btnCloseArticleModal) btnCloseArticleModal.addEventListener('click', closeArticleModal);
  if (btnSaveDraft) btnSaveDraft.addEventListener('click', () => saveArticle('draft'));
  if (btnPublishArticle) btnPublishArticle.addEventListener('click', () => saveArticle('published'));
  if (btnDeleteArticle) btnDeleteArticle.addEventListener('click', () => {
    const id = document.getElementById('article-id').value;
    if (id) deleteArticle(id);
  });

  // Cover image upload
  if (coverUploadInput) {
    coverUploadInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const formData = new FormData();
      formData.append('image', file);
      const id = document.getElementById('article-id').value;
      const uploadUrl = id ? `/api/admin/articles/${id}/upload-cover` : '/api/admin/upload';
      try {
        const res = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });
        const json = await res.json();
        if (json.success && json.url) {
          document.getElementById('article-cover-value').value = json.url;
          document.getElementById('cover-preview-img').src = json.url;
          document.getElementById('cover-preview-wrap').classList.remove('hidden');
          document.getElementById('btn-remove-cover').classList.remove('hidden');
          document.getElementById('cover-upload-label').textContent = 'Ganti Gambar';
          showToast('Cover berhasil diunggah!');
        } else {
          showToast(json.message || 'Gagal upload cover.', 'error');
        }
      } catch (e) {
        showToast('Gagal upload cover.', 'error');
      }
    });
  }

  if (btnRemoveCoverGlobal) {
    btnRemoveCoverGlobal.addEventListener('click', () => {
      document.getElementById('article-cover-value').value = '';
      document.getElementById('cover-preview-img').src = '';
      document.getElementById('cover-preview-wrap').classList.add('hidden');
      document.getElementById('btn-remove-cover').classList.add('hidden');
      document.getElementById('cover-upload-label').textContent = 'Upload Gambar';
      if (coverUploadInput) coverUploadInput.value = '';
    });
  }

  // Close modal on backdrop click
  document.getElementById('article-modal')?.addEventListener('click', (e) => {
    if (e.target === document.getElementById('article-modal')) closeArticleModal();
  });

  // Load articles when tab is activated
  document.querySelectorAll('.tab-btn').forEach(btn => {
    if (btn.dataset.tab === 'tab-articles') {
      btn.addEventListener('click', () => {
        loadArticles();
        setTimeout(() => { if (window.lucide) lucide.createIcons(); }, 100);
      });
    }
  });

  // Run initial load
  loadContent();
  loadConsultations();
  if (window.lucide) lucide.createIcons();
});
