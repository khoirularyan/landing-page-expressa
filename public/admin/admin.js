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

  // DOM Elements
  const toast = document.getElementById('toast');
  const adminUserDisplay = document.getElementById('admin-user-display');
  const btnLogout = document.getElementById('btn-logout');

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
    localStorage.removeItem('expr_admin_token');
    localStorage.removeItem('expr_admin_user');
    window.location.href = '/login';
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
    try {
      const res = await fetch('/api/content');
      const json = await res.json();
      if (json.success && json.data) {
        currentContent = json.data;
        populateHeroForm(currentContent);
        populateImagesTab(currentContent);
      }
    } catch (err) {
      console.error('Failed to load content:', err);
      showToast('Gagal memuat konten dari server', 'error');
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
    }

    // Case Studies Container
    const csContainer = document.getElementById('case-studies-container');
    if (csContainer && data.caseStudies) {
      csContainer.innerHTML = '';
      data.caseStudies.forEach((cs, idx) => {
        const card = document.createElement('div');
        card.className = 'bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3';
        card.innerHTML = `
          <div class="relative aspect-[16/9] rounded-xl overflow-hidden bg-slate-950">
            <img id="cs-img-preview-${idx}" src="${cs.imageUrl}" alt="${cs.client}" class="w-full h-full object-cover">
          </div>
          <div>
            <span class="text-[10px] font-bold text-blue-400 uppercase tracking-wider">${cs.industry}</span>
            <div class="text-xs font-bold text-white mt-0.5">${cs.client}</div>
          </div>
          <div class="space-y-1.5 pt-1">
            <div class="flex items-center gap-2">
              <input type="file" id="cs-file-${idx}" accept="image/*" class="hidden">
              <button type="button" onclick="document.getElementById('cs-file-${idx}').click()" class="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5">
                <i data-lucide="upload" class="w-3.5 h-3.5 text-blue-400"></i>
                <span>Ganti File</span>
              </button>
              <span id="cs-status-${idx}" class="text-[10px] text-slate-400"></span>
            </div>
            <input type="text" id="cs-url-${idx}" value="${cs.imageUrl}" class="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[11px] text-slate-200 font-mono">
          </div>
        `;
        csContainer.appendChild(card);

        // Events
        const fileInput = document.getElementById(`cs-file-${idx}`);
        const urlInput = document.getElementById(`cs-url-${idx}`);
        const imgPreview = document.getElementById(`cs-img-preview-${idx}`);
        const statusSpan = document.getElementById(`cs-status-${idx}`);

        urlInput.addEventListener('input', () => {
          imgPreview.src = urlInput.value;
        });

        fileInput.addEventListener('change', async (e) => {
          const file = e.target.files[0];
          if (!file) return;
          statusSpan.textContent = 'Mengunggah...';
          const uploadedUrl = await uploadImageFile(file);
          if (uploadedUrl) {
            urlInput.value = uploadedUrl;
            imgPreview.src = uploadedUrl;
            statusSpan.textContent = 'Tersimpan!';
          } else {
            statusSpan.textContent = 'Gagal upload.';
          }
        });
      });
    }

    // Team Container
    const teamContainer = document.getElementById('team-container');
    if (teamContainer && data.team) {
      teamContainer.innerHTML = '';
      data.team.forEach((tm, idx) => {
        const item = document.createElement('div');
        item.className = 'bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-center space-y-2';
        item.innerHTML = `
          <div class="relative w-full aspect-square rounded-lg overflow-hidden bg-slate-950">
            <img id="team-img-preview-${idx}" src="${tm.imageUrl}" alt="${tm.role}" class="w-full h-full object-cover">
          </div>
          <div>
            <div class="text-[11px] font-bold text-white truncate">${tm.role}</div>
            <div class="text-[9px] text-slate-400 truncate">${tm.subtitle}</div>
          </div>
          <div class="space-y-1">
            <input type="file" id="team-file-${idx}" accept="image/*" class="hidden">
            <button type="button" onclick="document.getElementById('team-file-${idx}').click()" class="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold py-1 rounded border border-slate-700">
              Upload
            </button>
            <input type="text" id="team-url-${idx}" value="${tm.imageUrl}" class="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-[9px] text-slate-300 font-mono">
          </div>
        `;
        teamContainer.appendChild(item);

        const fileInput = document.getElementById(`team-file-${idx}`);
        const urlInput = document.getElementById(`team-url-${idx}`);
        const imgPreview = document.getElementById(`team-img-preview-${idx}`);

        urlInput.addEventListener('input', () => {
          imgPreview.src = urlInput.value;
        });

        fileInput.addEventListener('change', async (e) => {
          const file = e.target.files[0];
          if (!file) return;
          const uploadedUrl = await uploadImageFile(file);
          if (uploadedUrl) {
            urlInput.value = uploadedUrl;
            imgPreview.src = uploadedUrl;
          }
        });
      });
    }

    if (window.lucide) lucide.createIcons();
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
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Gambar berhasil diunggah!');
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

  // Hero File Upload Listener
  const heroFileInput = document.getElementById('hero-file-input');
  if (heroFileInput) {
    heroFileInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const status = document.getElementById('hero-upload-status');
      status.textContent = 'Mengunggah file...';
      const uploadedUrl = await uploadImageFile(file);
      if (uploadedUrl) {
        document.getElementById('hero-image-url').value = uploadedUrl;
        document.getElementById('hero-img-preview').src = uploadedUrl;
        status.textContent = 'Berhasil diunggah!';
      } else {
        status.textContent = 'Gagal upload.';
      }
    });
  }

  // ==========================================
  // SAVE CONTENT TO SERVER (PUT /api/admin/content)
  // ==========================================
  async function saveContentToServer(updatedData, successMsg = 'Konten berhasil diperbarui!') {
    try {
      const res = await fetch('/api/admin/content', {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify(updatedData)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        currentContent = updatedData;
        showToast(successMsg, 'success');
        return true;
      } else {
        showToast(data.message || 'Gagal menyimpan data', 'error');
        return false;
      }
    } catch (err) {
      console.error(err);
      showToast('Gagal menghubungi server', 'error');
      return false;
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

      // Case Studies
      if (currentContent.caseStudies) {
        currentContent.caseStudies.forEach((cs, idx) => {
          const urlInput = document.getElementById(`cs-url-${idx}`);
          if (urlInput) cs.imageUrl = urlInput.value;
        });
      }

      // Team
      if (currentContent.team) {
        currentContent.team.forEach((tm, idx) => {
          const urlInput = document.getElementById(`team-url-${idx}`);
          if (urlInput) tm.imageUrl = urlInput.value;
        });
      }

      const ok = await saveContentToServer(currentContent, 'Gambar landing page berhasil disimpan!');

      if (ok) {
        // Success state
        btnSaveImages.className = 'bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-600/40 border border-emerald-400/50 transition-all flex items-center gap-2';
        if (btnSaveImagesText) btnSaveImagesText.textContent = '✓ Gambar Berhasil Disimpan!';
        if (btnSaveImagesIcon) {
          btnSaveImagesIcon.setAttribute('data-lucide', 'check-circle-2');
          btnSaveImagesIcon.classList.remove('animate-spin');
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
          btnSaveImages.disabled = false;
          btnSaveImages.className = 'bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-blue-600/30 transition-all flex items-center gap-2';
          if (btnSaveImagesText) btnSaveImagesText.textContent = 'Simpan Perubahan Gambar';
          if (btnSaveImagesIcon) btnSaveImagesIcon.setAttribute('data-lucide', 'save');
          if (saveImagesBadge) {
            saveImagesBadge.classList.add('hidden');
            saveImagesBadge.classList.remove('flex');
          }
          if (window.lucide) lucide.createIcons();
        }, 3500);
      } else {
        btnSaveImages.disabled = false;
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

  // Run initial load
  loadContent();
  loadConsultations();
  if (window.lucide) lucide.createIcons();
});
