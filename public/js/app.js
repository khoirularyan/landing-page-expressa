// Expressa Main Application Scripts - Clean Modern Engine & CMS Hydration
document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Lucide Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // 2. Smooth Scroll for Internal Anchor Links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href').substring(1);
      if (targetId) {
        const targetEl = document.getElementById(targetId);
        if (targetEl) {
          e.preventDefault();
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });

  // 3. Scroll Reveal Animations
  const revealElements = document.querySelectorAll('.reveal-on-scroll, .reveal-scale, .reveal-init');
  if ('IntersectionObserver' in window && revealElements.length > 0) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, {
      threshold: 0.08,
      rootMargin: '0px 0px -40px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));
  } else {
    revealElements.forEach(el => el.classList.add('is-visible'));
  }

  // 4. Navbar active link highlight on scroll
  const sectionIds = ['beranda', 'framework', 'layanan'];
  const navLinks = document.querySelectorAll('.nav-anchor');

  if ('IntersectionObserver' in window) {
    const navObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const currentId = entry.target.id;
          navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === `#${currentId}`) {
              link.classList.add('active', 'text-blue-600', 'font-bold');
              link.classList.remove('text-slate-600');
            } else if (href && href.startsWith('#')) {
              link.classList.remove('active', 'text-blue-600', 'font-bold');
              link.classList.add('text-slate-600');
            }
          });
        }
      });
    }, {
      threshold: 0.2,
      rootMargin: '-20% 0px -30% 0px'
    });

    sectionIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) navObserver.observe(el);
    });
  }

  // 5. Layanan Tab Filtering Switcher
  const serviceTabBtns = document.querySelectorAll('[data-service-tab]');
  const serviceItems = document.querySelectorAll('.service-item');

  serviceTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.getAttribute('data-service-tab');
      
      // Update active state on buttons
      serviceTabBtns.forEach(b => {
        b.classList.remove('active', 'bg-blue-600', 'text-white');
        b.classList.add('text-slate-600', 'dark:text-slate-300');
      });
      btn.classList.add('active', 'bg-blue-600', 'text-white');
      btn.classList.remove('text-slate-600', 'dark:text-slate-300');

      // Filter cards
      serviceItems.forEach(item => {
        const cat = item.getAttribute('data-category');
        if (tab === 'all' || cat === tab) {
          item.classList.remove('hidden');
          item.style.display = '';
        } else {
          item.classList.add('hidden');
          item.style.display = 'none';
        }
      });
    });
  });

  // 6. Quick Consultation Form Handler
  const quickForm = document.getElementById('quick-consultation-form');
  if (quickForm) {
    quickForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('quick-name')?.value.trim();
      const phone = document.getElementById('quick-phone')?.value.trim();
      const service = document.getElementById('quick-service')?.value;
      const btnText = document.getElementById('quick-btn-text');
      const submitBtn = document.getElementById('quick-submit-btn');

      if (!name || !phone) {
        alert('Mohon isi nama lengkap dan nomor WhatsApp Anda.');
        return;
      }

      if (submitBtn) submitBtn.disabled = true;
      if (btnText) btnText.textContent = 'Mengirim...';

      try {
        const res = await fetch('/api/consultation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name,
            phone,
            service,
            company: '-',
            email: '',
            message: `Pengajuan konsultasi cepat untuk solusi: ${service}`
          })
        });
        const result = await res.json();
        if (res.ok && result.success) {
          // Open main consultation modal with success screen
          if (typeof window.openConsultationModal === 'function') {
            window.openConsultationModal(service);
            const mainForm = document.getElementById('consultation-form');
            const formSuccess = document.getElementById('form-success');
            const successName = document.getElementById('success-client-name');
            const waBtn = document.getElementById('wa-direct-btn');

            if (mainForm) mainForm.classList.add('hidden');
            if (formSuccess) formSuccess.classList.remove('hidden');
            if (successName) successName.textContent = name;
            if (waBtn) {
              const waText = encodeURIComponent(`Halo Tim Expressa, saya ${name}. Saya tertarik konsultasi mengenai solusi ${service}.`);
              waBtn.href = `https://wa.me/6281234567890?text=${waText}`;
            }
          } else {
            alert(`Terima kasih, ${name}! Pengajuan konsultasi Anda berhasil kami terima.`);
          }
          quickForm.reset();
        } else {
          alert(result.message || 'Terjadi kesalahan. Silakan hubungi via WhatsApp.');
        }
      } catch (err) {
        console.error('Quick consultation error:', err);
        alert('Gagal mengirim formulir. Pastikan koneksi internet Anda aktif.');
      } finally {
        if (submitBtn) submitBtn.disabled = false;
        if (btnText) btnText.textContent = 'Dapatkan Rekomendasi Solusi';
      }
    });
  }

  // 7. Dynamic CMS Content Hydration
  function applyContentToDOM(data) {
    if (!data) return;

    // 1. Hero Text & Image
    if (data.hero) {
      const h1 = document.getElementById('hero-headline-1');
      const h2 = document.getElementById('hero-headline-2');
      const h3 = document.getElementById('hero-headline-3');
      const sub = document.getElementById('hero-subtitle');
      const cta1 = document.getElementById('hero-cta-text');
      const cta2 = document.getElementById('hero-secondary-cta-text');
      const heroImg = document.getElementById('hero-preview-img');

      if (h1 && data.hero.headlinePart1) h1.textContent = data.hero.headlinePart1;
      if (h2 && data.hero.headlinePart2) h2.textContent = data.hero.headlinePart2;
      if (h3 && data.hero.headlinePart3) h3.textContent = data.hero.headlinePart3;
      if (sub && data.hero.subtitle) sub.textContent = data.hero.subtitle;
      if (cta1 && data.hero.ctaText) cta1.textContent = data.hero.ctaText;
      if (cta2 && data.hero.secondaryCtaText) cta2.textContent = data.hero.secondaryCtaText;
      if (heroImg && data.hero.imageUrl) heroImg.src = data.hero.imageUrl;
    }

    // 2. Stats
    if (data.stats) {
      ['stat1', 'stat2', 'stat3', 'stat4'].forEach(key => {
        const item = data.stats[key];
        if (item) {
          const numEl = document.getElementById(`${key}-number`);
          const labelEl = document.getElementById(`${key}-label`);
          if (numEl && item.number) numEl.textContent = item.number;
          if (labelEl && item.label) labelEl.textContent = item.label;
        }
      });
    }

    // 3. Why Us Image
    if (data.whyUs && data.whyUs.imageUrl) {
      const whyUsImg = document.getElementById('whyus-preview-img');
      if (whyUsImg) whyUsImg.src = data.whyUs.imageUrl;
    }

    // 4. Client Logos (Marquee Ticker)
    if (data.clients && Array.isArray(data.clients) && data.clients.length > 0) {
      const marquee1 = document.getElementById('client-marquee-1');
      const marquee2 = document.getElementById('client-marquee-2');

      const renderClientItem = (c) => {
        if (c.logoUrl) {
          return `
            <div class="flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 shadow-sm shrink-0 hover:scale-105 transition-transform">
              <img src="${c.logoUrl}" alt="${c.name || 'Client'}" class="h-6 sm:h-7 max-w-[130px] object-contain">
              <span class="text-xs font-bold text-slate-800 dark:text-slate-200">${c.name || ''}</span>
            </div>
          `;
        }
        return `
          <div class="flex items-center gap-2.5 text-slate-700 dark:text-slate-300 font-bold text-sm tracking-wide shrink-0">
            <div class="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <i data-lucide="${c.icon || 'building'}" class="w-4 h-4"></i>
            </div>
            <span>${c.name}</span>
          </div>
        `;
      };

      const html = data.clients.map(renderClientItem).join('');
      if (marquee1) marquee1.innerHTML = html;
      if (marquee2) marquee2.innerHTML = html;
      if (window.lucide) window.lucide.createIcons();
    }

    // 5. Case Studies Images
    if (data.caseStudies && Array.isArray(data.caseStudies)) {
      data.caseStudies.forEach((cs, idx) => {
        const imgEl = document.getElementById(`cs-img-${idx}`);
        if (imgEl && cs.imageUrl) imgEl.src = cs.imageUrl;
      });
    }

    // 6. Team Images
    if (data.team && Array.isArray(data.team)) {
      data.team.forEach((tm, idx) => {
        const imgEl = document.getElementById(`team-img-${idx}`);
        if (imgEl && tm.imageUrl) imgEl.src = tm.imageUrl;
      });
    }
  }

  async function loadDynamicContent() {
    let localData = null;
    try {
      const cached = localStorage.getItem('expr_saved_content');
      if (cached) {
        localData = JSON.parse(cached);
        applyContentToDOM(localData);
      }
    } catch (e) {}

    try {
      const res = await fetch('/api/content');
      if (!res.ok) return;
      const json = await res.json();
      if (!json.success || !json.data) return;

      if (localData && localData._lastUpdated && (!json.data._lastUpdated || json.data._lastUpdated < localData._lastUpdated)) {
        console.log('[CMS Loader] Local changes are newer than server, preserving local content.');
        return;
      }

      applyContentToDOM(json.data);
      localStorage.setItem('expr_saved_content', JSON.stringify(json.data));
    } catch (err) {
      console.warn('[CMS Loader] Fallback to cache/static HTML:', err.message);
    }
  }

  // 8. Framework Connected Pipeline Controller
  const frameworkTrack = document.getElementById('framework-track');
  const stepWrappers = document.querySelectorAll('.step-wrapper');
  const frameworkPrevBtn = document.getElementById('framework-prev-btn');
  const frameworkNextBtn = document.getElementById('framework-next-btn');

  let currentFrameworkStep = 0;
  let isDraggingTrack = false;

  function setActiveStep(index, scrollToView = true) {
    if (index < 0 || index >= stepWrappers.length) return;
    currentFrameworkStep = index;

    stepWrappers.forEach((wrapper, idx) => {
      if (idx === index) {
        wrapper.classList.add('active');
        if (scrollToView && frameworkTrack) {
          wrapper.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
        }
      } else {
        wrapper.classList.remove('active');
      }
    });
  }

  if (stepWrappers.length > 0) {
    stepWrappers.forEach((wrapper, idx) => {
      wrapper.addEventListener('click', () => {
        if (isDraggingTrack) return;
        setActiveStep(idx, true);
      });
    });
  }

  if (frameworkPrevBtn && frameworkTrack) {
    frameworkPrevBtn.addEventListener('click', () => {
      frameworkTrack.scrollBy({ left: -260, behavior: 'smooth' });
    });
  }

  if (frameworkNextBtn && frameworkTrack) {
    frameworkNextBtn.addEventListener('click', () => {
      frameworkTrack.scrollBy({ left: 260, behavior: 'smooth' });
    });
  }

  // Mouse Drag to Scroll for Desktop on Track
  if (frameworkTrack) {
    let isDown = false;
    let startX = 0;
    let scrollLeft = 0;

    frameworkTrack.addEventListener('mousedown', (e) => {
      isDown = true;
      isDraggingTrack = false;
      startX = e.pageX - frameworkTrack.offsetLeft;
      scrollLeft = frameworkTrack.scrollLeft;
    });

    frameworkTrack.addEventListener('mouseleave', () => {
      isDown = false;
      setTimeout(() => { isDraggingTrack = false; }, 50);
    });

    frameworkTrack.addEventListener('mouseup', () => {
      isDown = false;
      setTimeout(() => { isDraggingTrack = false; }, 50);
    });

    frameworkTrack.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      const x = e.pageX - frameworkTrack.offsetLeft;
      const walk = (x - startX) * 1.5;
      if (Math.abs(walk) > 5) {
        isDraggingTrack = true;
      }
      e.preventDefault();
      frameworkTrack.scrollLeft = scrollLeft - walk;
    });
  }

  loadDynamicContent();
});
