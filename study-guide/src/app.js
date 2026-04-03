/* ============================================================
   Claude Code Study Guide — State Management Foundation
   ============================================================ */

// Safe JSON.parse helper
function safeParse(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) || fallback; }
  catch { return fallback; }
}

// State management
const State = {
  lang: localStorage.getItem('lang') || 'en',
  theme: localStorage.getItem('theme') || (matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light'),
  currentPart: localStorage.getItem('currentPart') || 'part1',
  progress: safeParse('progress', {}),
  collapsed: safeParse('collapsed', {}),
  quizScores: safeParse('quizScores', {}),
  save(key) {
    if (key === 'lang' || key === 'theme' || key === 'currentPart') {
      localStorage.setItem(key, this[key]);
    } else {
      localStorage.setItem(key, JSON.stringify(this[key]));
    }
  }
};

// Data stores
const I18N = {};
const PARTS = {};
const QUIZZES = {};
const SEARCH_INDEX = [];

// Part metadata
const PART_ORDER = ['part1', 'part2', 'part3', 'part4', 'part5', 'part6', 'part7', 'glossary'];
const PART_META = {
  part1: { chapters: 'Ch 1\u20132', titleKey: 'parts.part1.title' },
  part2: { chapters: 'Ch 3\u20134', titleKey: 'parts.part2.title' },
  part3: { chapters: 'Ch 5', titleKey: 'parts.part3.title' },
  part4: { chapters: 'Ch 6', titleKey: 'parts.part4.title' },
  part5: { chapters: 'Ch 7\u20138', titleKey: 'parts.part5.title' },
  part6: { chapters: 'Ch 9\u201310', titleKey: 'parts.part6.title' },
  part7: { chapters: 'Ch 11\u201312', titleKey: 'parts.part7.title' },
  glossary: { chapters: 'Appendix', titleKey: 'parts.glossary.title' }
};

/* ============================================================
   Data Loading
   ============================================================ */

async function loadI18N(lang) {
  if (I18N[lang]) return I18N[lang];
  if (typeof INLINED !== 'undefined' && INLINED_I18N && INLINED_I18N[lang]) {
    I18N[lang] = INLINED_I18N[lang];
    return I18N[lang];
  }
  try {
    const res = await fetch(`i18n/${lang}.json`);
    if (!res.ok) throw new Error(res.status);
    I18N[lang] = await res.json();
    return I18N[lang];
  } catch {
    if (lang !== 'en') return loadI18N('en');
    return null;
  }
}

async function loadPart(partId) {
  if (PARTS[partId]) return PARTS[partId];
  if (typeof INLINED !== 'undefined') {
    const tpl = document.getElementById('tpl-' + partId);
    if (tpl) { PARTS[partId] = tpl.innerHTML; return PARTS[partId]; }
  }
  try {
    const res = await fetch(`parts/${partId}.html`);
    if (!res.ok) throw new Error(res.status);
    PARTS[partId] = await res.text();
    return PARTS[partId];
  } catch {
    return '<p>Content not available.</p>';
  }
}

async function loadQuiz(partId) {
  if (QUIZZES[partId]) return QUIZZES[partId];
  if (typeof INLINED !== 'undefined' && INLINED_QUIZZES && INLINED_QUIZZES[partId]) {
    QUIZZES[partId] = INLINED_QUIZZES[partId];
    return QUIZZES[partId];
  }
  try {
    const res = await fetch(`quizzes/${partId}-quiz.json`);
    if (!res.ok) throw new Error(res.status);
    QUIZZES[partId] = await res.json();
    return QUIZZES[partId];
  } catch {
    return [];
  }
}

/* ============================================================
   i18n — translation helper & DOM updater
   ============================================================ */

function t(key) {
  const data = I18N[State.lang] || I18N['en'] || {};
  return key.split('.').reduce((o, k) => o && o[k], data) || key;
}

function applyI18N() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const val = t(el.dataset.i18nHtml);
    if (val && val !== el.dataset.i18nHtml) {
      el.innerHTML = val;
    }
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  const langCurrent = document.getElementById('lang-current');
  if (langCurrent) langCurrent.textContent = State.lang.toUpperCase();
}

/* ============================================================
   Theme Toggle
   ============================================================ */

function applyTheme() {
  document.documentElement.classList.toggle('dark', State.theme === 'dark');
  const icon = document.getElementById('theme-icon');
  if (icon) icon.textContent = State.theme === 'dark' ? '\u2600\uFE0F' : '\uD83C\uDF19';
}

document.getElementById('theme-toggle')?.addEventListener('click', () => {
  State.theme = State.theme === 'dark' ? 'light' : 'dark';
  State.save('theme');
  applyTheme();
});

/* ============================================================
   Language Switcher
   ============================================================ */

const langToggle = document.getElementById('lang-trigger');
const langMenu = document.getElementById('lang-menu');

langToggle?.addEventListener('click', () => {
  const isOpen = langMenu.classList.contains('open');
  langMenu.classList.toggle('open', !isOpen);
  langToggle.setAttribute('aria-expanded', !isOpen);
});

langMenu?.addEventListener('click', async (e) => {
  const li = e.target.closest('[data-lang]');
  if (!li) return;
  State.lang = li.dataset.lang;
  State.save('lang');
  await loadI18N(State.lang);
  applyI18N();
  updateLangMenuActive();
  renderSidebar();
  renderTabBar();

  // Re-render quiz with translated questions if available
  const quizQuestions = await loadQuiz(State.currentPart);
  const langData = I18N[State.lang];
  const translatedQuiz = (langData && langData.quizzes && langData.quizzes[State.currentPart])
    ? langData.quizzes[State.currentPart]
    : quizQuestions;
  renderQuiz(translatedQuiz, State.currentPart);

  langMenu.classList.remove('open');
  langToggle?.setAttribute('aria-expanded', 'false');
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('.lang-dropdown')) {
    langMenu?.classList.remove('open');
    langToggle?.setAttribute('aria-expanded', 'false');
  }
});

function updateLangMenuActive() {
  langMenu?.querySelectorAll('[data-lang]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === State.lang);
  });
}

/* ============================================================
   Sidebar Rendering
   ============================================================ */

function renderSidebar() {
  const nav = document.getElementById('nav-list');
  if (!nav) return;

  nav.innerHTML = PART_ORDER.map(id => {
    const title = t(PART_META[id].titleKey);
    const chapters = PART_META[id].chapters;
    const isActive = id === State.currentPart;
    return `
      <li class="nav-item ${isActive ? 'active' : ''}" data-part="${id}">
        <span>${title}</span>
        <span class="nav-item-chapters">${chapters}</span>
      </li>
    `;
  }).join('');

  updateProgressDisplay();
}

function updateProgressDisplay() {
  // Count all section checkboxes across all loaded parts to get accurate total
  const allCheckboxIds = new Set();
  for (const partId of PART_ORDER) {
    const html = PARTS[partId];
    if (!html) continue;
    const matches = html.matchAll(/data-section-id="([^"]+)"/g);
    for (const m of matches) allCheckboxIds.add(m[1]);
  }
  // Also include any keys already in State.progress
  for (const key of Object.keys(State.progress)) allCheckboxIds.add(key);

  const total = allCheckboxIds.size || 1;
  const completed = Object.values(State.progress).filter(Boolean).length;
  const pct = Math.round((completed / Math.max(total, 1)) * 100);

  const fill = document.getElementById('progress-fill');
  if (fill) fill.style.width = `${pct}%`;

  const label = document.getElementById('progress-label');
  if (label) label.textContent = `${pct}% complete`;
}

document.getElementById('nav-list')?.addEventListener('click', async (e) => {
  const navItem = e.target.closest('.nav-item');
  if (navItem) {
    await navigateTo(navItem.dataset.part);
  }
});

/* ============================================================
   Accordion Collapse/Expand
   ============================================================ */

function applyCollapsedState() {
  const article = document.getElementById('article-area');
  if (!article) return;

  article.querySelectorAll('.accordion').forEach(acc => {
    const sectionId = acc.dataset.section;
    if (!sectionId) return;
    const key = `${State.currentPart}.${sectionId}`;
    const isCollapsed = State.collapsed[key];

    if (isCollapsed) {
      acc.classList.remove('open');
    } else {
      // Default to open if no saved state
      acc.classList.add('open');
    }

    // Update icon
    const icon = acc.querySelector('.accordion-icon');
    if (icon) icon.textContent = acc.classList.contains('open') ? '\u25BE' : '\u25B8';
  });
}

// Event delegation for accordion header clicks
document.getElementById('article-area')?.addEventListener('click', (e) => {
  // Don't toggle when clicking the section checkbox
  if (e.target.closest('.section-checkbox') || e.target.closest('.section-check')) return;

  const header = e.target.closest('.accordion-header');
  if (!header) return;

  const accordion = header.closest('.accordion');
  if (!accordion) return;

  accordion.classList.toggle('open');

  const sectionId = accordion.dataset.section;
  if (sectionId) {
    const key = `${State.currentPart}.${sectionId}`;
    State.collapsed[key] = !accordion.classList.contains('open');
    State.save('collapsed');
  }

  // Update icon
  const icon = accordion.querySelector('.accordion-icon');
  if (icon) icon.textContent = accordion.classList.contains('open') ? '\u25BE' : '\u25B8';
});

// Expand All / Collapse All button handler
document.getElementById('article-area')?.addEventListener('click', (e) => {
  const btn = e.target.closest('.expand-all-btn');
  if (!btn) return;

  const article = document.getElementById('article-area');
  if (!article) return;

  const accordions = article.querySelectorAll('.accordion');
  const allOpen = Array.from(accordions).every(a => a.classList.contains('open'));
  const shouldOpen = !allOpen;

  accordions.forEach(acc => {
    acc.classList.toggle('open', shouldOpen);
    const sectionId = acc.dataset.section;
    if (sectionId) {
      const key = `${State.currentPart}.${sectionId}`;
      State.collapsed[key] = !shouldOpen;
    }
    const icon = acc.querySelector('.accordion-icon');
    if (icon) icon.textContent = shouldOpen ? '\u25BE' : '\u25B8';
  });

  State.save('collapsed');

  // Update button text
  btn.textContent = shouldOpen ? (t('ui.collapse_all') !== 'ui.collapse_all' ? t('ui.collapse_all') : 'Collapse All')
    : (t('ui.expand_all') !== 'ui.expand_all' ? t('ui.expand_all') : 'Expand All');
});

/* ============================================================
   Progress Tracking
   ============================================================ */

function applyProgressCheckboxes() {
  const article = document.getElementById('article-area');
  if (!article) return;

  article.querySelectorAll('.section-checkbox').forEach(cb => {
    const id = cb.dataset.sectionId;
    if (id) cb.checked = !!State.progress[id];
  });
}

// Event delegation for checkbox changes
document.getElementById('article-area')?.addEventListener('change', (e) => {
  if (!e.target.classList.contains('section-checkbox')) return;

  const id = e.target.dataset.sectionId;
  if (!id) return;

  State.progress[id] = e.target.checked;
  State.save('progress');
  renderSidebar();
});

/* ============================================================
   Quiz Rendering and Scoring
   ============================================================ */

function renderQuiz(questions, partId) {
  const section = document.getElementById('quiz-section');
  if (!section) return;

  if (!questions || questions.length === 0) {
    section.classList.remove('active');
    section.innerHTML = '';
    return;
  }

  // Don't auto-show quiz — user clicks "Take Quiz" button to reveal
  section.classList.remove('active');

  let answered = 0;
  let correct = 0;
  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];

  const scoreId = `quiz-score-${partId}`;
  const retryId = `quiz-retry-${partId}`;

  section.innerHTML = `
    <h3 class="quiz-title">${t('ui.quiz_title')}: ${t(PART_META[partId]?.titleKey) || partId}</h3>
    <div class="quiz-score" id="${scoreId}" style="display:none;">
      <span class="quiz-score-text"></span>
      <button class="quiz-retry-btn" id="${retryId}">${t('ui.retry')}</button>
    </div>
    ${questions.map((q, qi) => `
      <div class="quiz-card" data-question="${qi}">
        <div class="quiz-card-number">${qi + 1} / ${questions.length}</div>
        <div class="quiz-card-question">${q.question}</div>
        <div class="quiz-options">
          ${q.options.map((opt, oi) => `
            <button class="quiz-option" data-question-idx="${qi}" data-option-idx="${oi}">
              <span class="quiz-option-letter">${letters[oi] || oi}</span>
              <span>${opt}</span>
            </button>
          `).join('')}
        </div>
        <div class="quiz-explanation" id="quiz-expl-${partId}-${qi}">${q.explanation}</div>
      </div>
    `).join('')}
  `;

  // Event delegation for quiz option clicks
  section.onclick = (e) => {
    const optionBtn = e.target.closest('.quiz-option');

    // Handle retry button
    const retryBtn = e.target.closest('.quiz-retry-btn');
    if (retryBtn) {
      renderQuiz(questions, partId);
      return;
    }

    if (!optionBtn) return;

    const qi = parseInt(optionBtn.dataset.questionIdx, 10);
    const oi = parseInt(optionBtn.dataset.optionIdx, 10);
    const card = optionBtn.closest('.quiz-card');
    if (!card) return;

    // If already answered this question, ignore
    if (card.classList.contains('answered')) return;
    card.classList.add('answered');

    const q = questions[qi];
    const isCorrect = oi === q.answer;

    // Mark the selected option
    optionBtn.classList.add(isCorrect ? 'correct' : 'incorrect');

    // Always highlight the correct answer
    const allOptions = card.querySelectorAll('.quiz-option');
    allOptions.forEach((btn, idx) => {
      btn.disabled = true;
      if (idx === q.answer) btn.classList.add('correct');
    });

    // Show explanation
    const expl = document.getElementById(`quiz-expl-${partId}-${qi}`);
    if (expl) expl.classList.add('visible');

    // Track score
    answered++;
    if (isCorrect) correct++;

    // Check if all questions answered
    if (answered === questions.length) {
      State.quizScores[partId] = { correct, total: questions.length };
      State.save('quizScores');

      const scoreEl = document.getElementById(scoreId);
      if (scoreEl) {
        scoreEl.style.display = 'flex';
        const text = scoreEl.querySelector('.quiz-score-text');
        if (text) text.textContent = `${correct}/${questions.length} correct`;
      }
    }
  };
}

/* ============================================================
   Client-Side Search
   ============================================================ */

function buildSearchIndex() {
  SEARCH_INDEX.length = 0;

  for (const partId of PART_ORDER) {
    const html = PARTS[partId];
    if (!html) continue;

    // Parse HTML to extract accordion sections
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const accordions = doc.querySelectorAll('.accordion');

    accordions.forEach(acc => {
      const sectionId = acc.dataset.section || '';
      const header = acc.querySelector('.accordion-header');
      const body = acc.querySelector('.accordion-body');

      // Get heading text from header (exclude checkbox label text)
      const headingSpans = header?.querySelectorAll('span:not(.accordion-icon)');
      let heading = '';
      headingSpans?.forEach(s => {
        if (!s.closest('.section-check')) heading += s.textContent.trim() + ' ';
      });
      heading = heading.trim();

      const bodyText = body?.textContent?.trim() || '';
      const raw = bodyText.substring(0, 200);

      SEARCH_INDEX.push({
        partId,
        section: sectionId,
        heading,
        text: (heading + ' ' + bodyText).toLowerCase(),
        raw
      });
    });
  }
}

let searchDebounceTimer = null;

function openSearch() {
  const overlay = document.getElementById('search-overlay');
  if (!overlay) return;
  overlay.classList.add('open');
  const input = document.getElementById('search-input');
  if (input) {
    input.value = '';
    input.focus();
  }
  renderSearchResults('');
}

function closeSearch() {
  const overlay = document.getElementById('search-overlay');
  if (!overlay) return;
  overlay.classList.remove('open');
}

function renderSearchResults(query) {
  const container = document.getElementById('search-results');
  if (!container) return;

  if (!query || query.length < 2) {
    container.innerHTML = '<div class="search-empty">Type to search across all parts and topics.</div>';
    return;
  }

  const lowerQuery = query.toLowerCase();
  const matches = SEARCH_INDEX.filter(entry => entry.text.includes(lowerQuery));

  if (matches.length === 0) {
    container.innerHTML = '<div class="search-empty">No results found.</div>';
    return;
  }

  container.innerHTML = matches.map(m => {
    const partTitle = t(PART_META[m.partId]?.titleKey) || m.partId;
    // Create snippet with <mark> highlighting
    let snippet = m.raw;
    const idx = snippet.toLowerCase().indexOf(lowerQuery);
    if (idx !== -1) {
      const before = snippet.substring(0, idx);
      const match = snippet.substring(idx, idx + query.length);
      const after = snippet.substring(idx + query.length);
      snippet = `${escapeHtml(before)}<mark>${escapeHtml(match)}</mark>${escapeHtml(after)}`;
    } else {
      snippet = escapeHtml(snippet);
    }

    return `
      <div class="search-result" data-part="${m.partId}" data-section="${m.section}">
        <div class="search-result-title">${escapeHtml(partTitle)} &rsaquo; ${escapeHtml(m.heading)}</div>
        <div class="search-result-preview">${snippet}</div>
      </div>
    `;
  }).join('');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Search trigger click
document.getElementById('search-trigger')?.addEventListener('click', openSearch);

// Keyboard shortcut: / to open search
document.addEventListener('keydown', (e) => {
  if (e.key === '/' && !e.target.closest('input, textarea, [contenteditable]')) {
    e.preventDefault();
    openSearch();
  }
  if (e.key === 'Escape') {
    closeSearch();
  }
});

// Close on click outside dialog
document.getElementById('search-overlay')?.addEventListener('click', (e) => {
  if (e.target.id === 'search-overlay') {
    closeSearch();
  }
});

// Search input handler (debounced 300ms)
document.getElementById('search-input')?.addEventListener('input', (e) => {
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(() => {
    renderSearchResults(e.target.value.trim());
  }, 300);
});

// Click on search result: navigate and scroll to section
document.getElementById('search-results')?.addEventListener('click', async (e) => {
  const result = e.target.closest('.search-result');
  if (!result) return;

  const partId = result.dataset.part;
  const section = result.dataset.section;

  closeSearch();

  if (partId) {
    await navigateTo(partId);

    // Expand and scroll to the matching section
    if (section) {
      const article = document.getElementById('article-area');
      const accordion = article?.querySelector(`.accordion[data-section="${section}"]`);
      if (accordion) {
        accordion.classList.add('open');
        const icon = accordion.querySelector('.accordion-icon');
        if (icon) icon.textContent = '\u25BE';

        // Update collapsed state
        const key = `${partId}.${section}`;
        State.collapsed[key] = false;
        State.save('collapsed');

        accordion.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }
});

/* ============================================================
   Part Navigation + Tab Bar
   ============================================================ */

async function navigateTo(partId) {
  State.currentPart = partId;
  State.save('currentPart');

  const html = await loadPart(partId);
  const article = document.getElementById('article-area');
  if (article) {
    article.innerHTML = html + `
      <div class="quiz-trigger-wrap">
        <button class="quiz-trigger-btn" id="quiz-trigger-btn">${t('ui.quiz_title')} →</button>
      </div>`;
  }

  // Apply accordion and progress state after inserting HTML
  applyCollapsedState();
  applyProgressCheckboxes();

  applyI18N();
  renderSidebar();
  renderTabBar();

  // Load and render quiz (use translated quizzes if available)
  let questions = await loadQuiz(partId);
  const langData = I18N[State.lang];
  if (langData && langData.quizzes && langData.quizzes[partId]) {
    questions = langData.quizzes[partId];
  }
  renderQuiz(questions, partId);

  // Wire up "Take Quiz" button
  document.getElementById('quiz-trigger-btn')?.addEventListener('click', () => {
    const qs = document.getElementById('quiz-section');
    if (qs) {
      qs.classList.add('active');
      qs.scrollIntoView({ behavior: 'smooth' });
    }
  });

  // Close sidebar on mobile after navigation
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('sidebar-overlay')?.classList.remove('open');

  window.scrollTo(0, 0);
}

function renderTabBar() {
  const bar = document.getElementById('tab-bar');
  if (!bar) return;

  bar.innerHTML = PART_ORDER.map(id => {
    const title = t(PART_META[id].titleKey)
      .replace(/^Part \d+: /, '')
      .replace('Glossary & Quick Reference', 'Glossary');
    const isActive = id === State.currentPart;
    return `<button class="tab ${isActive ? 'active' : ''}" data-part="${id}">${title}</button>`;
  }).join('');
}

document.getElementById('tab-bar')?.addEventListener('click', (e) => {
  const tab = e.target.closest('[data-part]');
  if (tab) navigateTo(tab.dataset.part);
});

document.getElementById('nav-prev')?.addEventListener('click', () => {
  const idx = PART_ORDER.indexOf(State.currentPart);
  if (idx > 0) navigateTo(PART_ORDER[idx - 1]);
});

document.getElementById('nav-next')?.addEventListener('click', () => {
  const idx = PART_ORDER.indexOf(State.currentPart);
  if (idx < PART_ORDER.length - 1) navigateTo(PART_ORDER[idx + 1]);
});

/* ============================================================
   Hamburger Toggle (Mobile Sidebar)
   ============================================================ */

document.getElementById('hamburger')?.addEventListener('click', () => {
  document.getElementById('sidebar')?.classList.toggle('open');
  document.getElementById('sidebar-overlay')?.classList.toggle('open');
});

document.getElementById('sidebar-overlay')?.addEventListener('click', () => {
  document.getElementById('sidebar')?.classList.remove('open');
  document.getElementById('sidebar-overlay')?.classList.remove('open');
});

/* ============================================================
   Init
   ============================================================ */

async function init() {
  applyTheme();
  await loadI18N(State.lang);

  // Preload all parts for search index
  await Promise.all(PART_ORDER.map(id => loadPart(id)));

  // Build search index from all loaded parts
  buildSearchIndex();

  applyI18N();
  updateLangMenuActive();
  renderSidebar();
  renderTabBar();

  const article = document.getElementById('article-area');
  if (article) {
    article.innerHTML = (PARTS[State.currentPart] || '') + `
      <div class="quiz-trigger-wrap">
        <button class="quiz-trigger-btn" id="quiz-trigger-btn">${t('ui.quiz_title')} →</button>
      </div>`;
  }

  // Apply interactive state to initial content
  applyCollapsedState();
  applyProgressCheckboxes();

  // Load and render quiz for initial part (use translated quizzes if available)
  let questions = await loadQuiz(State.currentPart);
  const initLangData = I18N[State.lang];
  if (initLangData && initLangData.quizzes && initLangData.quizzes[State.currentPart]) {
    questions = initLangData.quizzes[State.currentPart];
  }
  renderQuiz(questions, State.currentPart);

  // Wire up "Take Quiz" button
  document.getElementById('quiz-trigger-btn')?.addEventListener('click', () => {
    const qs = document.getElementById('quiz-section');
    if (qs) {
      qs.classList.add('active');
      qs.scrollIntoView({ behavior: 'smooth' });
    }
  });

  window.scrollTo(0, 0);
}

init();
