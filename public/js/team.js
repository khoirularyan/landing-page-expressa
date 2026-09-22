// Expressa Team Page Client Script
document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) {
    window.lucide.createIcons();
  }

  function applyTeamContentToDOM(data) {
    if (!data || !data.team || !Array.isArray(data.team)) return;

    const grid = document.getElementById('team-members-grid');
    if (grid && data.team.length > 0) {
      grid.innerHTML = data.team.map((tm, idx) => {
        const isLastWide = idx === data.team.length - 1 && data.team.length % 4 === 3;
        return `
          <div class="clean-card bg-white dark:bg-[#182238] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between group ${isLastWide ? 'sm:col-span-2 lg:col-span-2 xl:col-span-2' : ''}">
            <div>
              <div class="w-full h-44 rounded-xl overflow-hidden mb-4 relative bg-slate-100 dark:bg-slate-900">
                <img id="team-img-${idx}" src="${tm.imageUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80'}" alt="${tm.name || tm.role}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                <div class="absolute bottom-2 left-2 bg-white/95 dark:bg-[#1E293B]/95 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-bold text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700">
                  ${tm.role || 'Tim'}
                </div>
              </div>
              <h3 class="font-bold text-slate-900 dark:text-white text-base">${tm.name && tm.name !== 'Nama Anggota' ? tm.name : tm.role}</h3>
              ${tm.name && tm.name !== 'Nama Anggota' ? `<div class="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-0.5">${tm.role}</div>` : ''}
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                ${tm.bio || tm.subtitle || 'Spesialis dalam perancangan dan implementasi solusi digital terintegrasi.'}
              </p>
            </div>
            <div class="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 text-[11px] font-medium text-slate-400 flex items-center justify-between">
              <span>Expressa Team</span>
              <span class="text-blue-600 dark:text-blue-400 font-semibold">• Terverifikasi</span>
            </div>
          </div>
        `;
      }).join('');
      if (window.lucide) window.lucide.createIcons();
    } else {
      data.team.forEach((tm, idx) => {
        const imgEl = document.getElementById(`team-img-${idx}`);
        if (imgEl && tm.imageUrl) {
          imgEl.src = tm.imageUrl;
        }
      });
    }
  }

  async function loadTeamContent() {
    try {
      const cached = localStorage.getItem('expr_saved_content');
      if (cached) {
        applyTeamContentToDOM(JSON.parse(cached));
      }
    } catch (e) {}

    try {
      const res = await fetch('/api/content');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          applyTeamContentToDOM(json.data);
          localStorage.setItem('expr_saved_content', JSON.stringify(json.data));
        }
      }
    } catch (err) {
      console.warn('[Team] CMS load error:', err.message);
    }
  }

  loadTeamContent();
});
