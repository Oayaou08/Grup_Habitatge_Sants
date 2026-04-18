// ============================================================
// render.js — GHAS Web · Módulo de renderizado
// ============================================================

// ── Formatos ─────────────────────────────────────────────────

export function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + 'T00:00:00'); // Forzar zona local
    return d.toLocaleDateString('ca-ES', {
      weekday: 'long',
      day:     'numeric',
      month:   'long',
      year:    'numeric',
    }).toUpperCase();
  } catch {
    return dateStr;
  }
}

export function formatDateShort(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('ca-ES', { day: '2-digit', month: 'short' }).toUpperCase();
  } catch {
    return dateStr;
  }
}

function isUpcoming(dateStr) {
  if (!dateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(dateStr) >= today;
}

function daysUntil(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = new Date(dateStr) - today;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

// ── Skeleton loader ───────────────────────────────────────────

export function renderSkeleton(containerId, count = 3) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = Array.from({ length: count }, () => `
    <div class="skeleton-card" aria-hidden="true">
      <div class="skeleton-line skeleton-line--title"></div>
      <div class="skeleton-line skeleton-line--meta"></div>
      <div class="skeleton-line skeleton-line--body"></div>
    </div>
  `).join('');
}

// ── Hero status bar ───────────────────────────────────────────

export function renderHeroStatus(events) {
  const statusEl = document.getElementById('hero-status');
  if (!statusEl) return;

  const next = events.find(e => isUpcoming(e.date));

  if (!next) {
    statusEl.innerHTML = `
      <span class="status-dot status-dot--gray"></span>
      <span>No hi ha accions programades pròximament</span>
    `;
    return;
  }

  const days = daysUntil(next.date);
  let urgencyClass = 'status-dot--green';
  let urgencyText  = `en ${days} dies`;

  if (days === 0) { urgencyClass = 'status-dot--red'; urgencyText = 'AVUI'; }
  else if (days <= 3) { urgencyClass = 'status-dot--red'; urgencyText = `en ${days} dies — URGENT`; }
  else if (days <= 7) { urgencyClass = 'status-dot--yellow'; }

  statusEl.innerHTML = `
    <span class="status-dot ${urgencyClass}"></span>
    <span>PRÒXIMA ACCIÓ: <strong>${next.title.toUpperCase()}</strong></span>
    <span class="status-sep">·</span>
    <span>${formatDateShort(next.date)}</span>
    <span class="status-sep">·</span>
    <span class="status-urgency">${urgencyText.toUpperCase()}</span>
  `;
}

// ── Alerta ticker (próximos 3 eventos) ────────────────────────

export function renderAlertTicker(events) {
  const el = document.getElementById('alert-ticker');
  if (!el) return;

  const upcoming = events.filter(e => isUpcoming(e.date)).slice(0, 5);
  if (!upcoming.length) { el.closest('.alert-bar')?.style.setProperty('display', 'none'); return; }

  const items = upcoming.map(e =>
    `<span class="ticker-item"><strong>${e.title.toUpperCase()}</strong> — ${formatDateShort(e.date)} — ${(e.location || '').toUpperCase()}</span>`
  ).join('<span class="ticker-sep">◆</span>');

  // Duplicar para loop continuo
  el.innerHTML = `<div class="ticker-track">${items}<span class="ticker-sep">◆</span>${items}</div>`;
}

// ── Events ────────────────────────────────────────────────────

export function renderEvents(events, containerId = 'events-grid') {
  const el = document.getElementById(containerId);
  if (!el) return;

  if (!events.length) {
    el.innerHTML = `<p class="empty-state">No hi ha esdeveniments registrats.</p>`;
    return;
  }

  el.innerHTML = events.map((evt, i) => {
    const upcoming = isUpcoming(evt.date);
    const days     = upcoming ? daysUntil(evt.date) : null;
    const isToday  = days === 0;
    const isUrgent = days !== null && days <= 3;

    return `
      <article
        class="event-card ${upcoming ? 'event-card--upcoming' : 'event-card--past'} ${isUrgent ? 'event-card--urgent' : ''}"
        data-index="${i}"
        aria-label="${evt.title}"
      >
        <div class="event-card__header">
          <div class="event-card__date">${formatDateShort(evt.date)}</div>
          <div class="event-card__status ${upcoming ? 'badge--active' : 'badge--past'}">
            ${isToday ? '⚡ AVUI' : upcoming ? '▶ ACTIU' : '✓ PASSAT'}
          </div>
        </div>

        <h3 class="event-card__title">${escapeHtml(evt.title)}</h3>

        ${evt.location ? `
          <div class="event-card__location">
            <span class="event-card__location-icon">◎</span>
            ${escapeHtml(evt.location)}
          </div>
        ` : ''}

        ${evt.description ? `
          <p class="event-card__desc">${escapeHtml(evt.description)}</p>
        ` : ''}

        <div class="event-card__full-date">${formatDate(evt.date)}</div>

        ${upcoming && isUrgent ? `
          <div class="event-card__urgency">
            ${isToday ? 'AVUI MATEIX' : `QUEDEN ${days} DIA${days === 1 ? '' : 'S'}`}
          </div>
        ` : ''}
      </article>
    `;
  }).join('');

  // Observar para animación de entrada
  observeElements('.event-card');
}

// ── News ──────────────────────────────────────────────────────

export function renderNews(news, containerId = 'news-grid', filter = 'all') {
  const el = document.getElementById(containerId);
  if (!el) return;

  const filtered = filter === 'all' ? news : news.filter(n => n.type === filter);

  if (!filtered.length) {
    el.innerHTML = `<p class="empty-state">No hi ha notícies${filter !== 'all' ? ` de tipus "${filter}"` : ''}.</p>`;
    return;
  }

  el.innerHTML = filtered.map((item, i) => `
    <article class="news-card" data-index="${i}" data-type="${escapeHtml(item.type || '')}">
      <div class="news-card__meta">
        <time class="news-card__date" datetime="${item.date}">${formatDate(item.date)}</time>
        ${item.type ? `<span class="news-card__type">${escapeHtml(item.type.toUpperCase())}</span>` : ''}
      </div>
      <h3 class="news-card__title">${escapeHtml(item.title)}</h3>
      ${item.content ? `<p class="news-card__content">${escapeHtml(item.content)}</p>` : ''}
    </article>
  `).join('');

  observeElements('.news-card');
}

// ── Filtros de noticias ───────────────────────────────────────

export function renderNewsFilters(news, onFilter) {
  const el = document.getElementById('news-filters');
  if (!el) return;

  const types = [...new Set(news.map(n => n.type).filter(Boolean))];
  if (!types.length) { el.style.display = 'none'; return; }

  el.innerHTML = `
    <button class="filter-btn filter-btn--active" data-filter="all">TOTES</button>
    ${types.map(t => `
      <button class="filter-btn" data-filter="${escapeHtml(t)}">${escapeHtml(t.toUpperCase())}</button>
    `).join('')}
  `;

  el.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      el.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('filter-btn--active'));
      btn.classList.add('filter-btn--active');
      onFilter(btn.dataset.filter);
    });
  });
}

// ── Error state ───────────────────────────────────────────────

export function renderError(containerId, message) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = `
    <div class="error-state">
      <div class="error-state__icon">✕</div>
      <p class="error-state__msg">${escapeHtml(message)}</p>
      <button class="error-state__retry btn-primary" onclick="window.GHAS.reload()">
        REINTENTAR
      </button>
    </div>
  `;
}

// ── Intersection Observer (animació entrada) ──────────────────

function observeElements(selector) {
  if (!('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
  );

  document.querySelectorAll(selector).forEach(el => observer.observe(el));
}

// ── Utils ─────────────────────────────────────────────────────

function escapeHtml(str) {
  if (typeof str !== 'string') return String(str ?? '');
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function updateLastUpdated() {
  const el = document.getElementById('last-updated');
  if (el) {
    const now = new Date();
    el.textContent = `Actualitzat: ${now.toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' })}`;
  }
}
