// main.js — GHAS Web · Orquestrador principal

import { fetchNews, fetchEvents, clearCache } from './api.js';
import {
  renderHeroStatus,
  renderAlertTicker,
  renderEvents,
  renderNews,
  renderNewsFilters,
  renderSkeleton,
  renderError,
  updateLastUpdated,
} from './render.js';

// Mode fosc
const button = document.getElementById('theme-toggle');

// 1. Cargar preferencia guardada
const savedTheme = localStorage.getItem('theme');

if (savedTheme) {
  document.body.classList.toggle('light', savedTheme === 'light');
} else {
  // 2. Detectar preferencia del sistema
  const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
  document.body.classList.toggle('light', prefersLight);
}

// 3. Botón para cambiar
button.addEventListener('click', () => {
  document.body.classList.toggle('light');

  // Guardar preferencia
  if (document.body.classList.contains('light')) {
    localStorage.setItem('theme', 'light');
  } else {
    localStorage.setItem('theme', 'dark');
  }
});


// Estado global

const state = {
  news:    [],
  events:  [],
  loading: false,
  error:   null,
};

// Exponer recarga global (usado por botón "Reintentar")
window.GHAS = { reload };

// Bootstrap 

document.addEventListener('DOMContentLoaded', init);

async function init() {
  setupNav();
  setupMobileMenu();
  showSkeletons();
  await loadData();
  setupAutoRefresh();
}

// Carga de datos 

async function loadData() {
  if (state.loading) return;
  state.loading = true;
  state.error   = null;

  try {
    const [news, events] = await Promise.all([fetchNews(), fetchEvents()]);

    state.news   = news;
    state.events = events;

    // Renderizar todo
    renderHeroStatus(events);
    renderAlertTicker(events);

    renderEvents(events);
    renderNews(news);
    renderNewsFilters(news, (filter) => {
      renderNews(news, 'news-grid', filter);
    });

    updateLastUpdated();
    updateEventsCount(events);

  } catch (err) {
    console.error('[GHAS] Error cargando datos:', err);
    state.error = err.message;
    renderError('events-grid', 'No s\'han pogut carregar els esdeveniments. ' + err.message);
    renderError('news-grid',   'No s\'han pogut carregar les notícies. ' + err.message);
    showConnectionWarning();
  } finally {
    state.loading = false;
  }
}

// Limpia cachés y recarga
export async function reload() {
  clearCache();
  showSkeletons();
  await loadData();
}

// Skeletons 

function showSkeletons() {
  renderSkeleton('events-grid', 3);
  renderSkeleton('news-grid',   4);
}

//Auto-refresh 

function setupAutoRefresh() {
  // Refrescar cada 10 minutos
  const INTERVAL = 10 * 60 * 1000;
  setInterval(() => {
    clearCache();
    loadData();
  }, INTERVAL);

  // Refrescar al volver a la pestaña
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      loadData();
    }
  });
}

//Nav activa en scroll 

function setupNav() {
  const sections = document.querySelectorAll('section[id]');
  const links    = document.querySelectorAll('.nav__link');

  if (!sections.length || !links.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          links.forEach(l => l.classList.remove('nav__link--active'));
          const active = document.querySelector(`.nav__link[href="#${entry.target.id}"]`);
          active?.classList.add('nav__link--active');
        }
      });
    },
    { threshold: 0.4 }
  );

  sections.forEach(s => observer.observe(s));
}

//Menú móvil 

function setupMobileMenu() {
  const toggle = document.getElementById('menu-toggle');
  const nav    = document.getElementById('main-nav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('nav--open');
    toggle.setAttribute('aria-expanded', open);
    toggle.textContent = open ? '✕' : '☰';
  });

  // Cerrar al hacer click en un enlace
  nav.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      nav.classList.remove('nav--open');
      toggle.setAttribute('aria-expanded', false);
      toggle.textContent = '☰';
    });
  });
}

//  Utils UI 

function updateEventsCount(events) {
  const today   = new Date(); today.setHours(0, 0, 0, 0);
  const upcoming = events.filter(e => new Date(e.date) >= today).length;
  const badge   = document.getElementById('events-count');
  if (badge) badge.textContent = upcoming || '';
}

function showConnectionWarning() {
  const el = document.getElementById('connection-warning');
  if (el) {
    el.style.display = 'flex';
    el.innerHTML = `
      <span>⚠ No s'ha pogut connectar a Google Sheets.</span>
      <button onclick="window.GHAS.reload(); this.closest('#connection-warning').style.display='none'">
        REINTENTAR
      </button>
    `;
  }
}
