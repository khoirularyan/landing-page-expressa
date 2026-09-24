// Expressa Consultation Form & Modal Logic
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('consultation-modal');
  const modalBackdrop = document.getElementById('modal-backdrop');
  const modalContent = document.getElementById('modal-content');
  const closeModalBtn = document.getElementById('close-modal-btn');
  const form = document.getElementById('consultation-form');
  const formSuccess = document.getElementById('form-success');
  const serviceInput = document.getElementById('consultation-service');
  const submitBtn = document.getElementById('submit-consultation-btn');
  const submitSpinner = document.getElementById('submit-spinner');
  const submitBtnText = document.getElementById('submit-btn-text');

  // Open Modal Function
  window.openConsultationModal = function(preselectedService = '') {
    if (!modal) return;
    
    // Reset form states
    if (form) {
      form.reset();
      form.classList.remove('hidden');
    }
    if (formSuccess) {
      formSuccess.classList.add('hidden');
    }
    if (submitBtn) {
      submitBtn.disabled = false;
    }
    if (submitSpinner) submitSpinner.classList.add('hidden');
    if (submitBtnText) submitBtnText.textContent = 'Kirim Pengajuan Konsultasi';

    if (serviceInput && preselectedService) {
      serviceInput.value = preselectedService;
    }

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';

    if (window.lucide) {
      window.lucide.createIcons();
    }

    // Animate entrance
    requestAnimationFrame(() => {
      if (modalBackdrop) modalBackdrop.classList.remove('opacity-0');
      if (modalContent) {
        modalContent.classList.remove('opacity-0', 'scale-95', 'translate-y-4');
        modalContent.classList.add('opacity-100', 'scale-100', 'translate-y-0');
      }
    });
  };

  // Close Modal Function
  window.closeConsultationModal = function() {
    if (!modal) return;
    if (modalBackdrop) modalBackdrop.classList.add('opacity-0');
    if (modalContent) {
      modalContent.classList.remove('opacity-100', 'scale-100', 'translate-y-0');
      modalContent.classList.add('opacity-0', 'scale-95', 'translate-y-4');
    }

    setTimeout(() => {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
      document.body.style.overflow = '';
    }, 300);
  };

  // Attach event listeners to all consultation trigger buttons
  document.querySelectorAll('[data-action="open-consultation"]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const service = btn.getAttribute('data-service') || '';
      window.openConsultationModal(service);
    });
  });

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', window.closeConsultationModal);
  }

  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', window.closeConsultationModal);
  }

  // Escape key to close modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
      window.closeConsultationModal();
    }
  });

  // Handle Form Submission
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('consultation-name')?.value.trim();
      const phone = document.getElementById('consultation-phone')?.value.trim();
      const email = document.getElementById('consultation-email')?.value.trim();
      const company = document.getElementById('consultation-company')?.value.trim();
      const service = document.getElementById('consultation-service')?.value;
      const message = document.getElementById('consultation-message')?.value.trim();

      if (!name || !phone) {
        alert('Mohon isi nama lengkap dan nomor WhatsApp Anda.');
        return;
      }

      // Show loading
      if (submitBtn) submitBtn.disabled = true;
      if (submitSpinner) submitSpinner.classList.remove('hidden');
      if (submitBtnText) submitBtnText.textContent = 'Memproses...';

      try {
        const response = await fetch('/api/consultation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name,
            phone,
            email,
            company,
            service,
            message
          })
        });

        const data = await response.json();

        if (response.ok && data.success) {
          // Success State
          form.classList.add('hidden');
          if (formSuccess) {
            formSuccess.classList.remove('hidden');
            const clientNameElem = document.getElementById('success-client-name');
            if (clientNameElem) clientNameElem.textContent = name;

            // Direct WhatsApp link
            const waBtn = document.getElementById('wa-direct-btn');
            if (waBtn) {
              const waText = encodeURIComponent(`Halo Tim Expressa, saya ${name} dari ${company || '-'}. Saya tertarik untuk berdiskusi mengenai ${service || 'layanan Expressa'}.`);
              waBtn.href = `https://api.whatsapp.com/send/?phone=${window.expressaWaNumber || '6282326743025'}&text=${waText}&type=phone_number&app_absent=0`;
            }

            if (window.lucide) {
              window.lucide.createIcons();
            }
          }
        } else {
          alert(data.message || 'Terjadi kesalahan saat mengirim pengajuan. Silakan coba lagi.');
        }
      } catch (err) {
        console.error('Submission error:', err);
        alert('Tidak dapat terhubung ke server. Pastikan koneksi aktif.');
      } finally {
        if (submitBtn) submitBtn.disabled = false;
        if (submitSpinner) submitSpinner.classList.add('hidden');
        if (submitBtnText) submitBtnText.textContent = 'Kirim Pengajuan Konsultasi';
      }
    });
  }

  // ==========================================
  // FLOATING WHATSAPP POP-UP WIDGET
  // ==========================================
  function initFloatingWhatsApp() {
    if (document.getElementById('floating-whatsapp-widget')) return;

    const defaultNumber = '6282326743025';
    const waUrl = `https://api.whatsapp.com/send/?phone=${defaultNumber}&text&type=phone_number&app_absent=0`;

    const widget = document.createElement('div');
    widget.id = 'floating-whatsapp-widget';
    widget.className = 'fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-50 flex items-end gap-3 pointer-events-none select-none';

    widget.innerHTML = `
      <!-- Speech Bubble Pop-up -->
      <div id="wa-chat-bubble" class="pointer-events-auto flex items-center gap-2.5 bg-white dark:bg-[#182238] text-slate-800 dark:text-slate-100 py-2.5 px-4 rounded-2xl shadow-2xl shadow-slate-900/15 dark:shadow-black/60 border border-slate-200/90 dark:border-slate-700/80 text-xs font-semibold transition-all duration-300 transform origin-bottom-right hover:border-emerald-500/50">
        <a id="wa-bubble-link" href="${waUrl}" target="_blank" rel="noopener noreferrer" class="flex items-center gap-2 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
          <span class="relative flex h-2.5 w-2.5 shrink-0">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span>Butuh bantuan? Chat kami via WhatsApp</span>
        </a>
        <button type="button" id="wa-bubble-close" aria-label="Tutup pesan" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ml-1 p-0.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <!-- WhatsApp Floating Action Button -->
      <a id="floating-wa-btn" href="${waUrl}" target="_blank" rel="noopener noreferrer" aria-label="Chat WhatsApp Sekarang" class="pointer-events-auto relative w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#25D366] hover:bg-[#20BD5A] text-white flex items-center justify-center shadow-2xl shadow-emerald-600/40 hover:shadow-emerald-600/60 hover:scale-110 active:scale-95 transition-all duration-300 shrink-0">
        <!-- Pulsing Ring -->
        <span class="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-30 pointer-events-none"></span>
        <!-- WhatsApp Icon SVG -->
        <svg class="w-6 h-6 sm:w-7 sm:h-7 fill-current relative z-10" viewBox="0 0 24 24">
          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.592 2.654-.696c1.001.574 1.769.845 2.806.846h.005c3.179 0 5.766-2.587 5.767-5.766.001-3.182-2.585-5.769-5.772-5.769zm10.155 5.766c-.002 5.623-4.575 10.194-10.198 10.194-1.785 0-3.487-.464-4.98-1.282l-5.617 1.472 1.5-5.467c-.902-1.572-1.378-3.364-1.379-5.201.002-5.623 4.575-10.195 10.201-10.195 2.724.001 5.284 1.062 7.208 2.987 1.925 1.926 2.984 4.487 2.982 7.217zm-12.029 7.026c1.026.001 2.032-.276 2.912-.8l.209-.124 2.164.567-.577-2.109.136-.217c.576-.917.88-1.979.88-3.067 0-3.14-2.556-5.695-5.7-5.695-1.522 0-2.952.593-4.029 1.67-1.077 1.077-1.67 2.507-1.67 4.028 0 3.141 2.556 5.697 5.675 5.747zm3.392-4.225c-.186-.093-1.102-.544-1.273-.606-.171-.062-.295-.093-.419.093-.124.186-.481.606-.59.73-.109.124-.217.14-.403.047-.186-.093-.787-.29-1.5-.926-.554-.496-.928-1.108-1.037-1.294-.109-.186-.012-.287.081-.38.084-.083.186-.217.279-.326.093-.109.124-.186.186-.31.062-.124.031-.233-.016-.326-.047-.093-.419-1.009-.574-1.382-.151-.363-.304-.314-.419-.32l-.357-.006c-.124 0-.326.047-.496.233-.171.186-.652.637-.652 1.554 0 .917.667 1.803.76 1.927.093.124 1.312 2.004 3.178 2.81.444.192.791.307 1.061.393.446.142.852.122 1.173.074.358-.053 1.102-.45 1.258-.885.155-.434.155-.807.109-.885-.047-.078-.171-.124-.357-.217z"/>
        </svg>
        <!-- Online Dot -->
        <span class="absolute top-0 right-0 w-3.5 h-3.5 bg-emerald-400 border-2 border-white dark:border-[#131B2E] rounded-full"></span>
      </a>
    `;

    document.body.appendChild(widget);

    // Dismiss bubble handler
    const bubble = document.getElementById('wa-chat-bubble');
    const bubbleClose = document.getElementById('wa-bubble-close');
    if (bubbleClose && bubble) {
      bubbleClose.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        bubble.classList.add('opacity-0', 'scale-75');
        setTimeout(() => bubble.remove(), 250);
      });
    }

    // Try to update with live settings from API or localStorage
    try {
      const cached = localStorage.getItem('expressa_content_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.settings && parsed.settings.whatsappNumber) {
          updateWaLinks(parsed.settings.whatsappNumber);
        }
      }
      fetch('/api/content')
        .then(res => res.json())
        .then(data => {
          const content = data.data || data;
          if (content && content.settings && content.settings.whatsappNumber) {
            updateWaLinks(content.settings.whatsappNumber);
          }
        })
        .catch(() => {});
    } catch (e) {}

    function updateWaLinks(num) {
      const liveUrl = `https://api.whatsapp.com/send/?phone=${num}&text&type=phone_number&app_absent=0`;
      const btn = document.getElementById('floating-wa-btn');
      const bubbleLink = document.getElementById('wa-bubble-link');
      if (btn) btn.href = liveUrl;
      if (bubbleLink) bubbleLink.href = liveUrl;
      window.expressaWaNumber = num;
    }
  }

  initFloatingWhatsApp();
});
