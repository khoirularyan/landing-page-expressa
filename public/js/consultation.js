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
              waBtn.href = `https://wa.me/${window.expressaWaNumber || '6281234567890'}?text=${waText}`;
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
});
