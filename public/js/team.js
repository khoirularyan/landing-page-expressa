// Expressa Team Page Client Script
document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) {
    window.lucide.createIcons();
  }

  function applyTeamContentToDOM(data) {
    if (!data || !data.team || !Array.isArray(data.team)) return;
    data.team.forEach((tm, idx) => {
      const imgEl = document.getElementById(`team-img-${idx}`);
      if (imgEl && tm.imageUrl) {
        imgEl.src = tm.imageUrl;
      }
    });
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
