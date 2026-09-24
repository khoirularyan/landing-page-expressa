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
              waBtn.href = `https://wa.me/${window.expressaWaNumber || ''}?text=${waText}`;
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

    // 5. Case Studies — render images, client names, industries, titles, descriptions
    if (data.caseStudies && Array.isArray(data.caseStudies)) {
      data.caseStudies.forEach((cs, idx) => {
        const imgEl = document.getElementById(`cs-img-${idx}`);
        const clientEl = document.getElementById(`cs-client-${idx}`);
        const industryEl = document.getElementById(`cs-industry-${idx}`);
        const titleEl = document.getElementById(`cs-title-${idx}`);
        const descEl = document.getElementById(`cs-desc-${idx}`);
        const metricEl = document.getElementById(`cs-metric-${idx}`);

        if (imgEl && cs.imageUrl) imgEl.src = cs.imageUrl;
        if (clientEl && cs.client) clientEl.textContent = cs.client;
        if (industryEl && cs.industry) industryEl.textContent = cs.industry;
        if (titleEl && cs.title) titleEl.textContent = cs.title;
        if (descEl && cs.description) descEl.textContent = cs.description;
        if (metricEl && cs.metric) metricEl.textContent = cs.metric;
      });
    }

    // 6. Team — render nama, jabatan, bio, foto dari CMS
    if (data.team && Array.isArray(data.team)) {
      const teamGrid = document.getElementById('team-grid-cms');
      if (teamGrid) {
        teamGrid.innerHTML = data.team.map((tm) => `
          <div class="group flex flex-col items-center text-center p-5 bg-white dark:bg-[#1E293B] rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-blue-500/40 dark:hover:border-blue-500/40 shadow-sm hover:shadow-lg transition-all duration-300">
            <div class="w-20 h-20 rounded-2xl overflow-hidden mb-3 ring-2 ring-slate-200 dark:ring-slate-700 group-hover:ring-blue-500/50 transition-all">
              <img src="${tm.imageUrl || ''}" alt="${tm.name || tm.role}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
            </div>
            <div class="font-bold text-slate-900 dark:text-white text-sm">${tm.name || ''}</div>
            <div class="text-blue-600 dark:text-blue-400 text-xs font-semibold mt-0.5">${tm.role || ''}</div>
            ${tm.bio ? `<div class="text-slate-500 dark:text-slate-400 text-[11px] mt-2 leading-relaxed line-clamp-2">${tm.bio}</div>` : ''}
          </div>
        `).join('');
        if (window.lucide) window.lucide.createIcons();
      } else {
        // Fallback: update by index (old behavior)
        data.team.forEach((tm, idx) => {
          const imgEl = document.getElementById(`team-img-${idx}`);
          if (imgEl && tm.imageUrl) imgEl.src = tm.imageUrl;
        });
      }
    }

    // 7. Settings — Update semua link WhatsApp, Email, dan Nama Perusahaan
    if (data.settings) {
      if (data.settings.whatsappNumber) {
        const waNum = data.settings.whatsappNumber.replace(/\D/g, '');
        const waDefaultText = encodeURIComponent(data.settings.whatsappText || 'Halo Expressa, saya tertarik untuk konsultasi sistem');
        // Update semua anchor yang menuju wa.me
        document.querySelectorAll('a[href*="wa.me"]').forEach(link => {
          const href = link.getAttribute('href') || '';
          const textPart = href.includes('?text=') ? '?text=' + href.split('?text=')[1] : `?text=${waDefaultText}`;
          link.setAttribute('href', `https://wa.me/${waNum}${textPart}`);
        });
        window.expressaWaNumber = waNum;
        window.expressaWaText = data.settings.whatsappText || 'Halo Expressa, saya tertarik untuk konsultasi sistem';
      }

      if (data.settings.companyEmail) {
        document.querySelectorAll('.company-email-text').forEach(el => el.textContent = data.settings.companyEmail);
        document.querySelectorAll('a[href^="mailto:"]').forEach(link => {
          link.setAttribute('href', `mailto:${data.settings.companyEmail}`);
        });
      }

      if (data.settings.companyName) {
        document.querySelectorAll('.company-name-text').forEach(el => el.textContent = data.settings.companyName);
      }
    }

    // 8. Services — render kartu layanan dari CMS
    if (data.services && Array.isArray(data.services) && data.services.length > 0) {
      const servicesGrid = document.getElementById('services-grid-cms') || document.getElementById('service-cards-container');
      if (servicesGrid) {
        servicesGrid.innerHTML = data.services.map((svc) => `
          <div onclick="if(typeof openConsultationModal === 'function') openConsultationModal('${(svc.title || 'Layanan').replace(/'/g, "\\'")}')" class="service-item clean-card p-6 flex flex-col justify-between cursor-pointer group bg-white dark:bg-[#182238] border border-slate-200/80 dark:border-slate-800 rounded-2xl hover:border-blue-500/50 dark:hover:border-blue-500/50 shadow-sm hover:shadow-lg transition-all">
            <div>
              <div class="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <i data-lucide="${svc.icon || 'layers'}" class="w-5 h-5"></i>
              </div>
              <h3 class="font-bold text-slate-900 dark:text-white text-base group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">${svc.title || ''}</h3>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">${svc.description || ''}</p>
            </div>
            <div class="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 flex items-center justify-between text-xs font-semibold text-blue-600 dark:text-blue-400">
              <span>Konsultasi Solusi</span>
              <i data-lucide="arrow-right" class="w-4 h-4 group-hover:translate-x-1 transition-transform"></i>
            </div>
          </div>
        `).join('');
        if (window.lucide) window.lucide.createIcons();
      }
    }

    // 9. About Us page dynamic content
    if (data.about) {
      const ab = data.about;
      const setEl = (id, val) => { const el = document.getElementById(id); if (el && val) el.textContent = val; };
      setEl('about-hero-title', ab.heroTitle);
      setEl('about-hero-title-highlight', ab.heroTitleHighlight);
      setEl('about-hero-subtitle', ab.heroSubtitle);
      setEl('about-story-title', ab.storyTitle);
      // Story text with newlines
      const storyEl = document.getElementById('about-story-text');
      if (storyEl && ab.storyText) {
        storyEl.innerHTML = ab.storyText.split('\n\n').map(p => `<p class="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">${p}</p>`).join('');
      }
      setEl('about-vision-title', ab.visionTitle);
      setEl('about-vision-text', ab.visionText);
      setEl('about-mission-title', ab.missionTitle);
      // Missions list
      const missionList = document.getElementById('about-missions-list');
      if (missionList && ab.missions && Array.isArray(ab.missions)) {
        missionList.innerHTML = ab.missions.map((m, i) => `
          <div class="flex items-start gap-3">
            <div class="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">${i + 1}</div>
            <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">${m}</p>
          </div>
        `).join('');
      }
      // Core values
      if (ab.coreValues && Array.isArray(ab.coreValues)) {
        const cvGrid = document.getElementById('about-core-values-grid');
        if (cvGrid) {
          cvGrid.innerHTML = ab.coreValues.map(cv => `
            <div class="p-5 bg-slate-50 dark:bg-[#182238] rounded-2xl border border-slate-200/80 dark:border-slate-800">
              <div class="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                <i data-lucide="${cv.icon || 'star'}" class="w-5 h-5"></i>
              </div>
              <h4 class="font-bold text-slate-900 dark:text-white text-sm mb-1">${cv.title || ''}</h4>
              <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">${cv.description || ''}</p>
            </div>
          `).join('');
          if (window.lucide) window.lucide.createIcons();
        }
      }
    }

    // 10. Testimonials — render from CMS
    if (data.testimonials && Array.isArray(data.testimonials) && data.testimonials.length > 0) {
      const badgeColors = [
        'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30',
        'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30',
        'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30',
        'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30'
      ];
      const borderColors = [
        'border-blue-200 dark:border-blue-700',
        'border-emerald-200 dark:border-emerald-700',
        'border-indigo-200 dark:border-indigo-700',
        'border-purple-200 dark:border-purple-700'
      ];
      const quoteColors = [
        'text-blue-300 dark:text-blue-700',
        'text-emerald-300 dark:text-emerald-700',
        'text-indigo-300 dark:text-indigo-700',
        'text-purple-300 dark:text-purple-700'
      ];
      const stars = '<i data-lucide="star" class="w-3.5 h-3.5 text-amber-400 fill-amber-400"></i>'.repeat(5);

      const renderTCard = (t, i, bgClass) => `
        <div class="clean-card ${bgClass} border border-slate-200 dark:border-slate-700/80 rounded-3xl p-6 sm:p-8 flex flex-col gap-4 shadow-sm">
          <div class="flex items-start gap-4">
            <img src="${t.photoUrl || ''}" alt="${t.name || ''}" class="w-16 h-16 rounded-2xl object-cover object-top border-2 border-blue-100 dark:border-blue-900/50 shadow-sm shrink-0">
            <div class="flex-1 min-w-0">
              <span class="inline-block text-[10px] font-bold ${badgeColors[i % 4]} uppercase tracking-wider px-2 py-0.5 rounded mb-1">${t.badge || ''}</span>
              <h4 class="font-bold text-slate-900 dark:text-white text-sm leading-tight">${t.name || ''}</h4>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">${t.title || ''}${t.company ? ' · ' + t.company : ''}</p>
              <div class="flex items-center gap-0.5 mt-1">${stars}</div>
            </div>
          </div>
          <div class="relative pl-4 border-l-2 ${borderColors[i % 4]}">
            <i data-lucide="quote" class="w-5 h-5 ${quoteColors[i % 4]} absolute -top-1 -left-3 bg-white dark:bg-[#1E293B]"></i>
            <p class="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic">"${t.quote || ''}"</p>
          </div>
        </div>
      `;

      const tmGrid = document.getElementById('testimonials-grid');
      if (tmGrid) {
        tmGrid.innerHTML = data.testimonials.map((t, i) => renderTCard(t, i, 'bg-white dark:bg-[#1E293B]')).join('');
        if (window.lucide) window.lucide.createIcons();
      }
    }

    // 11. About Team Photos — render from CMS
    if (data.aboutTeamPhotos && Array.isArray(data.aboutTeamPhotos) && data.aboutTeamPhotos.length > 0) {
      const atpGrid = document.getElementById('about-team-photos-grid');
      if (atpGrid) {
        atpGrid.innerHTML = data.aboutTeamPhotos.map(p => `
          <div class="relative rounded-2xl overflow-hidden aspect-[3/4] bg-slate-100 dark:bg-slate-900 shadow-sm border border-slate-200/80 dark:border-slate-800 group">
            <img src="${p.photoUrl || ''}" alt="${p.caption || 'Tim Expressa'}" class="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500">
            <div class="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
        `).join('');
      }
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

  loadDynamicContent();
});
