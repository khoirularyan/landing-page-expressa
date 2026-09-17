// Expressa Smooth Scroll & Interactive Reveal Engine
document.addEventListener('DOMContentLoaded', () => {
  const sectionIds = [
    'beranda',
    'tentang-kami',
    'tantangan',
    'solusi',
    'transformasi',
    'cara-kerja',
    'project',
    'tim'
  ];
  const slideThemes = [
    'dark',
    'light',
    'dark',
    'light',
    'dark',
    'light',
    'dark',
    'light'
  ];
  
  const dots = document.querySelectorAll('.deck-dot');
  const slideCounter = document.getElementById('slide-counter-display');
  const slideNumberBig = document.getElementById('slide-number-big');
  const navbar = document.getElementById('main-navbar');
  const navLinks = document.querySelectorAll('.nav-anchor');

  let currentSection = 0;

  // Initialize Lucide Icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Smooth scroll to target section by index
  window.goToSlide = function(index) {
    if (index >= 0 && index < sectionIds.length) {
      const target = document.getElementById(sectionIds[index]);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  window.nextSlide = function() {
    if (currentSection < sectionIds.length - 1) {
      window.goToSlide(currentSection + 1);
    }
  };

  window.prevSlide = function() {
    if (currentSection > 0) {
      window.goToSlide(currentSection - 1);
    }
  };

  // Update indicators (active dots, navbar color, nav link highlights)
  function setActiveSection(index) {
    if (index < 0 || index >= sectionIds.length) return;
    currentSection = index;

    // 1. Update dots
    dots.forEach((dot, idx) => {
      if (idx === currentSection) {
        dot.classList.add('active');
      } else {
        dot.classList.remove('active');
      }
    });

    // 2. Update navbar link
    navLinks.forEach(link => {
      const targetIndex = parseInt(link.getAttribute('data-slide-target') || '0', 10);
      if (targetIndex === currentSection) {
        link.classList.add('text-blue-500', 'font-bold');
        link.classList.remove('text-slate-400', 'text-slate-600');
      } else {
        link.classList.remove('text-blue-500', 'font-bold');
        link.classList.add('text-slate-400');
      }
    });

    // 3. Update counter if present
    const formattedNum = String(currentSection + 1).padStart(2, '0');
    const totalNum = String(sectionIds.length).padStart(2, '0');
    if (slideCounter) {
      slideCounter.textContent = `${formattedNum} / ${totalNum}`;
    }
    if (slideNumberBig) {
      slideNumberBig.textContent = formattedNum;
    }

    // 4. Update Navbar styling according to section theme
    const currentTheme = slideThemes[currentSection];
    if (navbar) {
      if (currentTheme === 'light') {
        navbar.classList.remove('nav-dark-mode');
        navbar.classList.add('nav-light-mode');
        navbar.style.background = 'rgba(255, 255, 255, 0.9)';
        navbar.style.borderColor = 'rgba(226, 232, 240, 0.85)';
        navbar.style.boxShadow = '0 10px 30px -10px rgba(0, 0, 0, 0.08)';
      } else {
        navbar.classList.remove('nav-light-mode');
        navbar.classList.add('nav-dark-mode');
        navbar.style.background = 'rgba(10, 15, 29, 0.85)';
        navbar.style.borderColor = 'rgba(255, 255, 255, 0.12)';
        navbar.style.boxShadow = '0 10px 30px -10px rgba(0, 0, 0, 0.5)';
      }
    }
  }

  // ScrollSpy for continuous scrolling
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        const index = sectionIds.indexOf(id);
        if (index !== -1) {
          setActiveSection(index);
        }
      }
    });
  }, {
    threshold: [0.15, 0.4],
    rootMargin: '-20% 0px -30% 0px'
  });

  sectionIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) sectionObserver.observe(el);
  });

  // Scroll Reveal Animations for smooth entry on scroll
  const revealElements = document.querySelectorAll('.reveal-on-scroll, .reveal-scale, .reveal-init');
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

  // Next-slide trigger buttons
  document.querySelectorAll('[data-action="next-slide"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      window.nextSlide();
    });
  });

  // Smooth scroll for internal anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href').substring(1);
      if (targetId && document.getElementById(targetId)) {
        e.preventDefault();
        const targetEl = document.getElementById(targetId);
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Slide 2: Interactive Process Workflow Cards
  const workflowSteps = [
    { title: 'Order', desc: 'Penerimaan pesanan terintegrasi langsung dari web, aplikasi, atau sales lapangan secara instan.' },
    { title: 'Approval', desc: 'Sistem alur otorisasi berjenjang yang fleksibel via notifikasi real-time tanpa penundaan dokumen fisik.' },
    { title: 'Produksi', desc: 'Pemantauan jadwal pabrikasi, bill of materials (BOM), dan kapasitas lini produksi real-time.' },
    { title: 'Warehouse', desc: 'Manajemen inventaris, multi-gudang, pelacakan barcode/QR, dan mutasi barang yang presisi.' },
    { title: 'Finance', desc: 'Pencatatan otomatis faktur, arus kas, rekonsiliasi bank, dan pembukuan tanpa entri berulang.' },
    { title: 'Reporting', desc: 'Laporan eksekutif analitik real-time dan insight prediktif untuk pengambilan keputusan strategis.' }
  ];

  const stepCards = document.querySelectorAll('.workflow-step-card');
  const stepDetailBox = document.getElementById('workflow-detail-box');
  const stepDetailTitle = document.getElementById('workflow-detail-title');
  const stepDetailDesc = document.getElementById('workflow-detail-desc');

  stepCards.forEach((card, idx) => {
    card.addEventListener('click', () => {
      stepCards.forEach(c => c.classList.remove('ring-2', 'ring-blue-500', 'bg-blue-50'));
      card.classList.add('ring-2', 'ring-blue-500', 'bg-blue-50');

      if (stepDetailBox && stepDetailTitle && stepDetailDesc) {
        stepDetailTitle.textContent = `Tahap 0${idx + 1}: ${workflowSteps[idx].title}`;
        stepDetailDesc.textContent = workflowSteps[idx].desc;
        stepDetailBox.classList.remove('opacity-0', 'translate-y-2');
        stepDetailBox.classList.add('opacity-100', 'translate-y-0');
      }
    });
  });

  // Slide 3: Interactive Floating Problem Cards
  const problemCards = document.querySelectorAll('.problem-card');
  problemCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'translateY(-6px) scale(1.03)';
      card.style.borderColor = 'rgba(0, 102, 255, 0.6)';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.borderColor = '';
    });
  });

  // Slide 4: 3D Cube Mouse Interactive Tilt
  const cubeArea = document.getElementById('cube-container');
  const cube = document.getElementById('interactive-cube');

  if (cubeArea && cube) {
    cubeArea.addEventListener('mousemove', (e) => {
      const rect = cubeArea.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      const rotY = 35 + (x / rect.width) * 45;
      const rotX = -20 - (y / rect.height) * 45;
      cube.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
    });

    cubeArea.addEventListener('mouseleave', () => {
      cube.style.transform = `rotateX(-20deg) rotateY(35deg)`;
    });
  }

  // Dynamic CMS Content Hydration
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
      const heroCaption = document.getElementById('hero-image-caption');

      if (h1 && data.hero.headlinePart1) h1.textContent = data.hero.headlinePart1;
      if (h2 && data.hero.headlinePart2) h2.textContent = data.hero.headlinePart2;
      if (h3 && data.hero.headlinePart3) h3.textContent = data.hero.headlinePart3;
      if (sub && data.hero.subtitle) sub.textContent = data.hero.subtitle;
      if (cta1 && data.hero.ctaText) cta1.textContent = data.hero.ctaText;
      if (cta2 && data.hero.secondaryCtaText) cta2.textContent = data.hero.secondaryCtaText;
      if (heroImg && data.hero.imageUrl) heroImg.src = data.hero.imageUrl;
      if (heroCaption && data.hero.imageCaption) heroCaption.textContent = data.hero.imageCaption;
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

    // 3. Case Studies Images
    if (data.caseStudies && Array.isArray(data.caseStudies)) {
      data.caseStudies.forEach((cs, idx) => {
        const imgEl = document.getElementById(`cs-img-${idx}`);
        if (imgEl && cs.imageUrl) imgEl.src = cs.imageUrl;
      });
    }

    // 4. Team Images
    if (data.team && Array.isArray(data.team)) {
      data.team.forEach((tm, idx) => {
        const imgEl = document.getElementById(`team-img-${idx}`);
        if (imgEl && tm.imageUrl) imgEl.src = tm.imageUrl;
      });
    }
  }

  async function loadDynamicContent() {
    let localData = null;
    // 1. Instant hydration from client cache if available (zero flicker)
    try {
      const cached = localStorage.getItem('expr_saved_content');
      if (cached) {
        localData = JSON.parse(cached);
        applyContentToDOM(localData);
      }
    } catch (e) {}

    // 2. Fetch fresh content from server
    try {
      const res = await fetch('/api/content');
      if (!res.ok) return;
      const json = await res.json();
      if (!json.success || !json.data) return;

      // If local cache is newer than server data (e.g. serverless cold container with older static JSON), keep local
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

  // Initial trigger
  setActiveSection(0);
});
