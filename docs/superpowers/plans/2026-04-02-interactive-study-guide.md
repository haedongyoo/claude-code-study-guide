# Interactive Study Guide Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an HTML-based interactive study guide that transforms a 583-page Korean Claude Code guidebook into a multilingual, searchable, quiz-enabled documentation site with a single-file portable distribution.

**Architecture:** Hybrid multi-file source with shell-script build that bundles into one self-contained `index.html`. All state (language, theme, progress, quiz scores, collapse state) persisted in localStorage. Content in 6 languages loaded from JSON files. Design system established via interface-design plugin.

**Tech Stack:** Vanilla HTML/CSS/JS (zero dependencies), bash build script, interface-design plugin for design system

**Spec:** `docs/superpowers/specs/2026-04-02-interactive-study-guide-design.md`

**Source PDF text:** `full_text.txt` (extracted from 클로드코드_가이드북.pdf)

---

## File Structure

```
study-guide/
├── src/
│   ├── index.html              ← app shell: header, sidebar, content area, overlays
│   ├── style.css               ← design tokens + all component styles + dark mode
│   ├── app.js                  ← state management, routing, search, quiz, i18n, theme, collapse, progress
│   ├── parts/
│   │   ├── part1.html          ← Building Fundamentals (Ch 1-2) content fragment
│   │   ├── part2.html          ← Practical Playbook (Ch 3-4) content fragment
│   │   ├── part3.html          ← System Design (Ch 5) content fragment
│   │   ├── part4.html          ← Extensions & Automation (Ch 6) content fragment
│   │   ├── part5.html          ← Role-Based Playbooks (Ch 7-8) content fragment
│   │   ├── part6.html          ← Community Patterns & Tools (Ch 9-10) content fragment
│   │   ├── part7.html          ← Governance & Final Practice (Ch 11-12) content fragment
│   │   └── glossary.html       ← Glossary & Quick Reference (Appendix) content fragment
│   ├── i18n/
│   │   ├── en.json             ← English: UI strings + all content
│   │   ├── ko.json             ← Korean: UI strings + all content
│   │   ├── ru.json             ← Russian: UI strings + all content
│   │   ├── hi.json             ← Hindi: UI strings + all content
│   │   ├── zh.json             ← Chinese: UI strings + all content
│   │   └── fr.json             ← French: UI strings + all content
│   └── quizzes/
│       ├── part1-quiz.json     ← Quiz questions for Part 1
│       ├── part2-quiz.json     ← Quiz questions for Part 2
│       ├── part3-quiz.json     ← Quiz questions for Part 3
│       ├── part4-quiz.json     ← Quiz questions for Part 4
│       ├── part5-quiz.json     ← Quiz questions for Part 5
│       ├── part6-quiz.json     ← Quiz questions for Part 6
│       ├── part7-quiz.json     ← Quiz questions for Part 7
│       └── glossary-quiz.json  ← Quiz questions for Glossary
├── build.sh                    ← bundles everything into dist/index.html
├── dist/
│   └── index.html              ← portable single-file output
└── README.md                   ← how to develop, build, and distribute
```

---

## Phase 1: Foundation (Tasks 1-3)

### Task 1: Project Scaffolding + Design System

Create directory structure and establish the design system using the interface-design plugin.

**Files:**
- Create: `study-guide/src/index.html`
- Create: `study-guide/src/style.css`
- Create: `study-guide/src/app.js`
- Create: `study-guide/.interface-design/system.md` (via plugin)

- [ ] **Step 1: Create directory structure**

```bash
mkdir -p study-guide/src/{parts,i18n,quizzes}
mkdir -p study-guide/dist
```

- [ ] **Step 2: Invoke `/interface-design:init` to establish the design system**

Run the interface-design plugin with this context:
- **Who:** Self-learners, team leads, developers studying Claude Code — beginners to advanced
- **Task:** Study, reference, and quiz themselves on Claude Code concepts across 6 languages
- **Feel:** Clean like a well-organized textbook. Light, airy, professional. Not sterile — warm enough to read for hours. Think "the best technical book you've ever read, as a website."
- **Starting direction:** Clean white with blue accents (user chose Option B — Clean White)
- **Key components:** Sidebar navigation, collapsible accordion sections, quiz cards, progress bars, search overlay, language dropdown, callout boxes (key concept, warning, tip)
- **Constraints:** Must support 6 scripts (Latin, Hangul, Cyrillic, Devanagari, CJK, Latin-FR). Dark mode required. Borders-only depth strategy.

Save the resulting system to `.interface-design/system.md`.

- [ ] **Step 3: Create `study-guide/src/style.css` with design tokens from system.md**

Write the CSS file with:
- CSS custom properties (tokens) from the design system
- Light mode as default, dark mode via `.dark` class on `<html>`
- Base typography with multilingual font stack
- Layout grid: sidebar (260px fixed) + content (fluid)
- Mobile breakpoint at 768px (sidebar becomes overlay)
- Component styles: `.callout`, `.quiz-card`, `.accordion`, `.progress-bar`, `.search-overlay`, `.lang-dropdown`, `.tab-bar`

- [ ] **Step 4: Create `study-guide/src/index.html` app shell**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Claude Code Master Guide — Interactive Study Guide</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <!-- Header -->
  <header class="header">
    <div class="header-left">
      <button class="hamburger" aria-label="Toggle navigation">
        <span></span><span></span><span></span>
      </button>
      <h1 class="logo" data-i18n="ui.title">Claude Code Study Guide</h1>
    </div>
    <div class="header-right">
      <div class="search-trigger">
        <input type="search" class="search-input" data-i18n-placeholder="ui.search_placeholder" placeholder="Search...">
      </div>
      <div class="lang-dropdown">
        <button class="lang-toggle" aria-label="Switch language">
          <span class="lang-current">EN</span>
        </button>
        <ul class="lang-menu" hidden>
          <li data-lang="en">English</li>
          <li data-lang="ko">한국어</li>
          <li data-lang="ru">Русский</li>
          <li data-lang="hi">हिंदी</li>
          <li data-lang="zh">中文</li>
          <li data-lang="fr">Français</li>
        </ul>
      </div>
      <button class="theme-toggle" aria-label="Toggle theme"></button>
    </div>
  </header>

  <!-- Sidebar -->
  <aside class="sidebar" id="sidebar">
    <nav class="sidebar-nav" id="sidebar-nav">
      <!-- populated by app.js -->
    </nav>
    <div class="sidebar-progress">
      <div class="progress-bar"><div class="progress-fill"></div></div>
      <span class="progress-label" data-i18n="ui.progress">Progress</span>
      <span class="progress-count">0/8</span>
    </div>
  </aside>

  <!-- Overlay for mobile sidebar -->
  <div class="sidebar-overlay" id="sidebar-overlay"></div>

  <!-- Main content -->
  <main class="content" id="content">
    <!-- Tab bar at top -->
    <div class="tab-bar" id="tab-bar">
      <!-- populated by app.js -->
    </div>

    <!-- Content area -->
    <article class="article" id="article">
      <!-- loaded dynamically from parts/*.html -->
    </article>

    <!-- Quiz section -->
    <section class="quiz-section" id="quiz-section" hidden>
      <h2 data-i18n="ui.quiz_title">Self-Check Quiz</h2>
      <div class="quiz-cards" id="quiz-cards"></div>
      <div class="quiz-score" id="quiz-score" hidden></div>
      <button class="quiz-retry" id="quiz-retry" data-i18n="ui.retry" hidden>Retry</button>
    </section>

    <!-- Prev/Next -->
    <nav class="page-nav">
      <button class="nav-prev" id="nav-prev" data-i18n="ui.prev">← Previous</button>
      <button class="nav-next" id="nav-next" data-i18n="ui.next">Next →</button>
    </nav>
  </main>

  <!-- Search overlay -->
  <div class="search-overlay" id="search-overlay" hidden>
    <div class="search-modal">
      <input type="search" class="search-modal-input" id="search-modal-input" data-i18n-placeholder="ui.search_placeholder" placeholder="Search...">
      <div class="search-results" id="search-results"></div>
    </div>
  </div>

  <script src="app.js"></script>
</body>
</html>
```

- [ ] **Step 5: Create minimal `study-guide/src/app.js` with state management**

Write the core state manager that all features will use:

```javascript
// ── State ──
const State = {
  lang: localStorage.getItem('lang') || 'en',
  theme: localStorage.getItem('theme') || (matchMedia('(prefers-color-scheme:dark)').matches ? 'dark' : 'light'),
  currentPart: localStorage.getItem('currentPart') || 'part1',
  progress: JSON.parse(localStorage.getItem('progress') || '{}'),
  collapsed: JSON.parse(localStorage.getItem('collapsed') || '{}'),
  quizScores: JSON.parse(localStorage.getItem('quizScores') || '{}'),
  save(key) {
    if (key === 'lang' || key === 'theme' || key === 'currentPart') {
      localStorage.setItem(key, this[key]);
    } else {
      localStorage.setItem(key, JSON.stringify(this[key]));
    }
  }
};

// ── Data stores (populated at load) ──
const I18N = {};
const PARTS = {};
const QUIZZES = {};
const SEARCH_INDEX = [];

// ── Part metadata ──
const PART_ORDER = ['part1','part2','part3','part4','part5','part6','part7','glossary'];
const PART_META = {
  part1: { chapters: 'Ch 1–2', titleKey: 'parts.part1.title' },
  part2: { chapters: 'Ch 3–4', titleKey: 'parts.part2.title' },
  part3: { chapters: 'Ch 5', titleKey: 'parts.part3.title' },
  part4: { chapters: 'Ch 6', titleKey: 'parts.part4.title' },
  part5: { chapters: 'Ch 7–8', titleKey: 'parts.part5.title' },
  part6: { chapters: 'Ch 9–10', titleKey: 'parts.part6.title' },
  part7: { chapters: 'Ch 11–12', titleKey: 'parts.part7.title' },
  glossary: { chapters: 'Appendix', titleKey: 'parts.glossary.title' }
};
```

- [ ] **Step 6: Verify the shell loads in browser**

Open `study-guide/src/index.html` in a browser. Expected: header visible with placeholder search/language/theme buttons, empty sidebar, empty content area. No console errors.

- [ ] **Step 7: Commit**

```bash
git add study-guide/
git commit -m "feat: scaffold study guide with app shell, design system, and state manager"
```

---

### Task 2: Core App Logic — Navigation, Theme, Language

Wire up the sidebar, tab bar, theme toggle, language switcher, and part loading.

**Files:**
- Modify: `study-guide/src/app.js`
- Modify: `study-guide/src/style.css`
- Create: `study-guide/src/i18n/en.json` (UI strings only, content placeholder)
- Create: `study-guide/src/parts/part1.html` (minimal placeholder content)

- [ ] **Step 1: Create `study-guide/src/i18n/en.json` with UI strings**

```json
{
  "ui": {
    "title": "Claude Code Study Guide",
    "search_placeholder": "Search...",
    "next": "Next →",
    "prev": "← Previous",
    "quiz_title": "Self-Check Quiz",
    "progress": "Progress",
    "expand_all": "Expand All",
    "collapse_all": "Collapse All",
    "retry": "Retry",
    "score": "{correct}/{total} correct",
    "mark_complete": "Mark as read",
    "completed": "Completed"
  },
  "parts": {
    "part1": {
      "title": "Part 1: Building Fundamentals",
      "sections": {}
    },
    "part2": { "title": "Part 2: Practical Playbook", "sections": {} },
    "part3": { "title": "Part 3: System Design", "sections": {} },
    "part4": { "title": "Part 4: Extensions & Automation", "sections": {} },
    "part5": { "title": "Part 5: Role-Based Playbooks", "sections": {} },
    "part6": { "title": "Part 6: Community Patterns & Tools", "sections": {} },
    "part7": { "title": "Part 7: Governance & Final Practice", "sections": {} },
    "glossary": { "title": "Glossary & Quick Reference", "sections": {} }
  }
}
```

- [ ] **Step 2: Create placeholder `study-guide/src/parts/part1.html`**

```html
<section class="part" data-part="part1">
  <div class="part-header">
    <h2 data-i18n="parts.part1.title">Part 1: Building Fundamentals</h2>
    <p class="part-subtitle">Chapters 1–2</p>
    <div class="part-controls">
      <button class="expand-all-btn" data-i18n="ui.expand_all">Expand All</button>
    </div>
  </div>

  <div class="accordion" data-section="1.1">
    <button class="accordion-header">
      <span class="accordion-icon">▾</span>
      <span data-i18n="parts.part1.sections.1_1.heading">1.1 Why the Ecosystem Is Hot</span>
      <label class="section-check"><input type="checkbox" class="section-checkbox" data-section-id="part1.1.1"></label>
    </button>
    <div class="accordion-body">
      <p>Placeholder content for section 1.1. This will be replaced with real content from the PDF.</p>
    </div>
  </div>

  <div class="accordion" data-section="1.2">
    <button class="accordion-header">
      <span class="accordion-icon">▾</span>
      <span data-i18n="parts.part1.sections.1_2.heading">1.2 Four Key Terms</span>
      <label class="section-check"><input type="checkbox" class="section-checkbox" data-section-id="part1.1.2"></label>
    </button>
    <div class="accordion-body">
      <p>Placeholder content for section 1.2.</p>
    </div>
  </div>
</section>
```

- [ ] **Step 3: Add data loading to `app.js`**

Add functions to load i18n, parts, and quizzes. In dev mode (served from src/), use fetch(). The build script will inline these later.

```javascript
// ── Loading ──
async function loadI18N(lang) {
  if (I18N[lang]) return I18N[lang];
  try {
    const res = await fetch(`i18n/${lang}.json`);
    I18N[lang] = await res.json();
    return I18N[lang];
  } catch {
    if (lang !== 'en') return loadI18N('en');
    return null;
  }
}

async function loadPart(partId) {
  if (PARTS[partId]) return PARTS[partId];
  try {
    const res = await fetch(`parts/${partId}.html`);
    PARTS[partId] = await res.text();
    return PARTS[partId];
  } catch {
    return '<p>Content not available.</p>';
  }
}

async function loadQuiz(partId) {
  if (QUIZZES[partId]) return QUIZZES[partId];
  try {
    const res = await fetch(`quizzes/${partId}-quiz.json`);
    QUIZZES[partId] = await res.json();
    return QUIZZES[partId];
  } catch {
    return [];
  }
}
```

- [ ] **Step 4: Add i18n application function to `app.js`**

```javascript
// ── i18n ──
function t(key) {
  const data = I18N[State.lang] || I18N['en'] || {};
  return key.split('.').reduce((o, k) => o && o[k], data) || key;
}

function applyI18N() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  document.querySelector('.lang-current').textContent = State.lang.toUpperCase();
}
```

- [ ] **Step 5: Add theme toggle to `app.js`**

```javascript
// ── Theme ──
function applyTheme() {
  document.documentElement.classList.toggle('dark', State.theme === 'dark');
  const btn = document.querySelector('.theme-toggle');
  btn.textContent = State.theme === 'dark' ? '☀️' : '🌙';
}

document.querySelector('.theme-toggle').addEventListener('click', () => {
  State.theme = State.theme === 'dark' ? 'light' : 'dark';
  State.save('theme');
  applyTheme();
});
```

- [ ] **Step 6: Add language switcher to `app.js`**

```javascript
// ── Language ──
const langToggle = document.querySelector('.lang-toggle');
const langMenu = document.querySelector('.lang-menu');

langToggle.addEventListener('click', () => {
  langMenu.hidden = !langMenu.hidden;
});

langMenu.addEventListener('click', async (e) => {
  const li = e.target.closest('[data-lang]');
  if (!li) return;
  State.lang = li.dataset.lang;
  State.save('lang');
  await loadI18N(State.lang);
  applyI18N();
  langMenu.hidden = true;
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('.lang-dropdown')) langMenu.hidden = true;
});
```

- [ ] **Step 7: Add sidebar rendering and navigation to `app.js`**

```javascript
// ── Sidebar ──
function renderSidebar() {
  const nav = document.getElementById('sidebar-nav');
  nav.innerHTML = PART_ORDER.map(id => {
    const title = t(PART_META[id].titleKey);
    const isActive = id === State.currentPart;
    const sections = getSectionsForPart(id);
    return `
      <div class="sidebar-part ${isActive ? 'active' : ''}" data-part="${id}">
        <button class="sidebar-part-header">${title}</button>
        <ul class="sidebar-sections ${isActive ? '' : 'collapsed'}">
          ${sections.map(s => `
            <li class="sidebar-section" data-section="${s.id}">
              <span class="section-check-icon">${State.progress[s.id] ? '✓' : ''}</span>
              ${s.label}
            </li>
          `).join('')}
        </ul>
      </div>
    `;
  }).join('');

  updateProgressDisplay();
}

function getSectionsForPart(partId) {
  const container = document.createElement('div');
  container.innerHTML = PARTS[partId] || '';
  return Array.from(container.querySelectorAll('.accordion')).map(acc => ({
    id: `${partId}.${acc.dataset.section}`,
    label: acc.querySelector('.accordion-header span[data-i18n], .accordion-header span:nth-child(2)')?.textContent || acc.dataset.section
  }));
}

// Sidebar click handlers
document.getElementById('sidebar-nav').addEventListener('click', async (e) => {
  const partHeader = e.target.closest('.sidebar-part-header');
  if (partHeader) {
    const partEl = partHeader.closest('.sidebar-part');
    const partId = partEl.dataset.part;
    await navigateTo(partId);
    return;
  }
  const sectionEl = e.target.closest('.sidebar-section');
  if (sectionEl) {
    const sectionId = sectionEl.dataset.section;
    const partId = sectionId.split('.')[0] + (sectionId.includes('glossary') ? '' : '');
    // scroll to section within current part
    const target = document.querySelector(`[data-section="${sectionId.split('.').pop()}"]`);
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  }
});
```

- [ ] **Step 8: Add part navigation + tab bar to `app.js`**

```javascript
// ── Navigation ──
async function navigateTo(partId) {
  State.currentPart = partId;
  State.save('currentPart');

  const html = await loadPart(partId);
  document.getElementById('article').innerHTML = html;

  const quiz = await loadQuiz(partId);
  renderQuiz(quiz, partId);

  applyI18N();
  applyCollapsedState();
  applyProgressCheckboxes();
  renderSidebar();
  renderTabBar();
  window.scrollTo(0, 0);
}

function renderTabBar() {
  const bar = document.getElementById('tab-bar');
  bar.innerHTML = PART_ORDER.map(id => {
    const title = t(PART_META[id].titleKey).replace(/^Part \d+: /, '').replace('Glossary & Quick Reference', 'Glossary');
    const isActive = id === State.currentPart;
    return `<button class="tab ${isActive ? 'active' : ''}" data-part="${id}">${title}</button>`;
  }).join('');
}

document.getElementById('tab-bar').addEventListener('click', (e) => {
  const tab = e.target.closest('[data-part]');
  if (tab) navigateTo(tab.dataset.part);
});

// Prev/Next
document.getElementById('nav-prev').addEventListener('click', () => {
  const idx = PART_ORDER.indexOf(State.currentPart);
  if (idx > 0) navigateTo(PART_ORDER[idx - 1]);
});
document.getElementById('nav-next').addEventListener('click', () => {
  const idx = PART_ORDER.indexOf(State.currentPart);
  if (idx < PART_ORDER.length - 1) navigateTo(PART_ORDER[idx + 1]);
});
```

- [ ] **Step 9: Add hamburger toggle for mobile**

```javascript
// ── Mobile sidebar ──
document.querySelector('.hamburger').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebar-overlay').classList.toggle('visible');
});
document.getElementById('sidebar-overlay').addEventListener('click', () => {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('visible');
});
```

- [ ] **Step 10: Add init function and boot the app**

```javascript
// ── Init ──
async function init() {
  applyTheme();
  await loadI18N(State.lang);
  await loadPart(State.currentPart);
  applyI18N();
  renderSidebar();
  renderTabBar();

  const html = PARTS[State.currentPart];
  document.getElementById('article').innerHTML = html;

  const quiz = await loadQuiz(State.currentPart);
  renderQuiz(quiz, State.currentPart);

  applyCollapsedState();
  applyProgressCheckboxes();
}

init();
```

- [ ] **Step 11: Verify navigation works in browser**

Open `study-guide/src/index.html`. Expected: sidebar shows Part 1 highlighted, placeholder content loads in main area, tab bar shows all parts, theme toggle switches light/dark, language dropdown opens/closes.

- [ ] **Step 12: Commit**

```bash
git add study-guide/
git commit -m "feat: add navigation, theme toggle, language switcher, and part loading"
```

---

### Task 3: Interactive Features — Accordions, Progress, Quizzes, Search

**Files:**
- Modify: `study-guide/src/app.js`
- Modify: `study-guide/src/style.css`
- Create: `study-guide/src/quizzes/part1-quiz.json`

- [ ] **Step 1: Add accordion collapse/expand to `app.js`**

```javascript
// ── Accordions ──
document.getElementById('article').addEventListener('click', (e) => {
  const header = e.target.closest('.accordion-header');
  if (!header) return;
  if (e.target.closest('.section-check')) return; // don't toggle when clicking checkbox

  const accordion = header.closest('.accordion');
  const body = accordion.querySelector('.accordion-body');
  const icon = accordion.querySelector('.accordion-icon');
  const isCollapsed = body.hidden;

  body.hidden = !isCollapsed;
  icon.textContent = isCollapsed ? '▾' : '▸';

  const sectionKey = `${State.currentPart}.${accordion.dataset.section}`;
  State.collapsed[sectionKey] = !isCollapsed;
  State.save('collapsed');
});

function applyCollapsedState() {
  document.querySelectorAll('.accordion').forEach(acc => {
    const key = `${State.currentPart}.${acc.dataset.section}`;
    const isCollapsed = State.collapsed[key] || false;
    const body = acc.querySelector('.accordion-body');
    const icon = acc.querySelector('.accordion-icon');
    body.hidden = isCollapsed;
    icon.textContent = isCollapsed ? '▸' : '▾';
  });
}

// Expand/Collapse All
document.getElementById('article').addEventListener('click', (e) => {
  if (!e.target.closest('.expand-all-btn')) return;
  const allExpanded = !document.querySelector('.accordion-body[hidden]');
  document.querySelectorAll('.accordion').forEach(acc => {
    const body = acc.querySelector('.accordion-body');
    const icon = acc.querySelector('.accordion-icon');
    body.hidden = allExpanded;
    icon.textContent = allExpanded ? '▸' : '▾';
    const key = `${State.currentPart}.${acc.dataset.section}`;
    State.collapsed[key] = allExpanded;
  });
  State.save('collapsed');
  e.target.textContent = allExpanded ? t('ui.expand_all') : t('ui.collapse_all');
});
```

- [ ] **Step 2: Add progress tracking to `app.js`**

```javascript
// ── Progress ──
document.getElementById('article').addEventListener('change', (e) => {
  if (!e.target.classList.contains('section-checkbox')) return;
  const sectionId = e.target.dataset.sectionId;
  State.progress[sectionId] = e.target.checked;
  State.save('progress');
  renderSidebar();
});

function applyProgressCheckboxes() {
  document.querySelectorAll('.section-checkbox').forEach(cb => {
    cb.checked = !!State.progress[cb.dataset.sectionId];
  });
}

function updateProgressDisplay() {
  const totalSections = Object.keys(State.progress).length || 1;
  const completedSections = Object.values(State.progress).filter(Boolean).length;
  const pct = Math.round((completedSections / Math.max(totalSections, 1)) * 100);

  const fill = document.querySelector('.progress-fill');
  if (fill) fill.style.width = `${pct}%`;

  const count = document.querySelector('.progress-count');
  if (count) count.textContent = `${completedSections}/${totalSections}`;
}
```

- [ ] **Step 3: Add quiz rendering and scoring to `app.js`**

```javascript
// ── Quizzes ──
function renderQuiz(questions, partId) {
  const section = document.getElementById('quiz-section');
  const container = document.getElementById('quiz-cards');
  const scoreEl = document.getElementById('quiz-score');
  const retryBtn = document.getElementById('quiz-retry');

  if (!questions || questions.length === 0) {
    section.hidden = true;
    return;
  }
  section.hidden = false;
  scoreEl.hidden = true;
  retryBtn.hidden = true;

  container.innerHTML = questions.map((q, i) => `
    <div class="quiz-card" data-index="${i}" data-answered="false">
      <p class="quiz-question">${i + 1}. ${q.question}</p>
      <div class="quiz-options">
        ${q.options.map((opt, j) => `
          <button class="quiz-option" data-option="${j}">${opt}</button>
        `).join('')}
      </div>
      <p class="quiz-explanation" hidden>${q.explanation}</p>
    </div>
  `).join('');

  let answered = 0;
  let correct = 0;

  container.addEventListener('click', (e) => {
    const optBtn = e.target.closest('.quiz-option');
    if (!optBtn) return;
    const card = optBtn.closest('.quiz-card');
    if (card.dataset.answered === 'true') return;

    card.dataset.answered = 'true';
    answered++;
    const idx = parseInt(card.dataset.index);
    const selected = parseInt(optBtn.dataset.option);
    const isCorrect = selected === questions[idx].answer;

    if (isCorrect) {
      correct++;
      optBtn.classList.add('correct');
    } else {
      optBtn.classList.add('incorrect');
      card.querySelector(`[data-option="${questions[idx].answer}"]`).classList.add('correct');
    }
    card.querySelector('.quiz-explanation').hidden = false;

    if (answered === questions.length) {
      scoreEl.textContent = t('ui.score').replace('{correct}', correct).replace('{total}', questions.length);
      scoreEl.hidden = false;
      retryBtn.hidden = false;
      State.quizScores[partId] = { correct, total: questions.length };
      State.save('quizScores');
    }
  });

  retryBtn.onclick = () => renderQuiz(questions, partId);
}
```

- [ ] **Step 4: Create sample quiz `study-guide/src/quizzes/part1-quiz.json`**

```json
[
  {
    "question": "What does 'memoized context' mean in the Claude Code harness?",
    "options": [
      "Storing all chat history permanently in a database",
      "Reusing background context across turns so you don't re-explain every time",
      "Memorizing the user's personal preferences",
      "Caching API responses for faster performance"
    ],
    "answer": 1,
    "explanation": "Memoized context means holding background information across turns so Claude doesn't need to be re-briefed each time. It's closer to 'reuse what was already established' than permanent storage."
  },
  {
    "question": "What are the four key terms introduced in Chapter 1?",
    "options": [
      "API, CLI, MCP, VM",
      "Prompt, Context, Response, Token",
      "Memoized Context, Tool Orchestration, Permission Gate, Resumable Session",
      "Skills, Plugins, Hooks, Subagents"
    ],
    "answer": 2,
    "explanation": "Chapter 1 introduces four foundational terms: Memoized Context (reusable background), Tool Orchestration (coordinating tools), Permission Gate (allow/ask/deny boundaries), and Resumable Session (picking up where you left off)."
  },
  {
    "question": "What is a 'harness' in the context of Claude Code?",
    "options": [
      "A physical device that connects to Claude's servers",
      "The outer structure defining what files Claude can read, what it can modify, and what it must verify",
      "A testing framework for running unit tests",
      "The graphical user interface of Claude Code"
    ],
    "answer": 1,
    "explanation": "A harness is like a workspace setup for Claude — reference materials on the desk, which drawers are accessible, and a checklist to complete before finishing. It defines boundaries and verification rules."
  },
  {
    "question": "Why does the book focus on Claude Code rather than other Claude products?",
    "options": [
      "Claude Code is the cheapest product",
      "Claude Code has the most users globally",
      "Claude Code brings together files, rules, verification, permissions, and tool connections in one place — showing where Anthropic is heading",
      "Claude Code is the only product available in Korea"
    ],
    "answer": 2,
    "explanation": "Claude Code is the central axis because it combines file access, rules, verification, permissions, reusable sessions, external tool connections, and team deployment. Cowork, Skills, Plugins, etc. are extensions of this core harness."
  },
  {
    "question": "What is the difference between a 'weak harness' request and a 'strong harness' request?",
    "options": [
      "Weak uses fewer tokens, strong uses more",
      "Weak: 'Fix the login bug.' Strong: 'Read only auth/, don't touch .env, pass login tests, leave a 3-line change note.'",
      "Weak means beginner, strong means expert",
      "There is no difference — it's the same concept"
    ],
    "answer": 1,
    "explanation": "A weak harness request like 'Fix the login bug' gives no boundaries. A strong harness request specifies what to read, what not to touch, what tests must pass, and what documentation to leave — reducing errors significantly."
  }
]
```

- [ ] **Step 5: Add client-side search to `app.js`**

```javascript
// ── Search ──
function buildSearchIndex() {
  SEARCH_INDEX.length = 0;
  for (const partId of PART_ORDER) {
    const html = PARTS[partId] || '';
    const container = document.createElement('div');
    container.innerHTML = html;
    container.querySelectorAll('.accordion').forEach(acc => {
      const heading = acc.querySelector('.accordion-header')?.textContent?.trim() || '';
      const body = acc.querySelector('.accordion-body')?.textContent?.trim() || '';
      SEARCH_INDEX.push({
        partId,
        section: acc.dataset.section,
        heading,
        text: `${heading} ${body}`.toLowerCase(),
        raw: body.substring(0, 200)
      });
    });
  }
}

let searchTimeout;
const searchOverlay = document.getElementById('search-overlay');
const searchInput = document.getElementById('search-modal-input');
const searchResults = document.getElementById('search-results');

document.querySelector('.search-input').addEventListener('focus', () => {
  searchOverlay.hidden = false;
  searchInput.focus();
});

searchOverlay.addEventListener('click', (e) => {
  if (e.target === searchOverlay) searchOverlay.hidden = true;
});

searchInput.addEventListener('input', () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    const query = searchInput.value.trim().toLowerCase();
    if (query.length < 2) { searchResults.innerHTML = ''; return; }

    const matches = SEARCH_INDEX.filter(item => item.text.includes(query)).slice(0, 20);
    searchResults.innerHTML = matches.map(m => {
      const partTitle = t(PART_META[m.partId].titleKey);
      const snippet = highlightMatch(m.raw, query);
      return `
        <div class="search-result" data-part="${m.partId}" data-section="${m.section}">
          <div class="search-result-path">${partTitle} → ${m.heading}</div>
          <div class="search-result-snippet">${snippet}</div>
        </div>
      `;
    }).join('') || '<p class="search-empty">No results found.</p>';
  }, 300);
});

function highlightMatch(text, query) {
  const idx = text.toLowerCase().indexOf(query);
  if (idx === -1) return text.substring(0, 150) + '...';
  const start = Math.max(0, idx - 40);
  const end = Math.min(text.length, idx + query.length + 80);
  let snippet = (start > 0 ? '...' : '') + text.substring(start, end) + (end < text.length ? '...' : '');
  return snippet.replace(new RegExp(`(${query})`, 'gi'), '<mark>$1</mark>');
}

searchResults.addEventListener('click', async (e) => {
  const result = e.target.closest('.search-result');
  if (!result) return;
  searchOverlay.hidden = true;
  searchInput.value = '';
  await navigateTo(result.dataset.part);
  const section = document.querySelector(`[data-section="${result.dataset.section}"]`);
  if (section) {
    const body = section.querySelector('.accordion-body');
    if (body && body.hidden) {
      body.hidden = false;
      section.querySelector('.accordion-icon').textContent = '▾';
    }
    section.scrollIntoView({ behavior: 'smooth' });
  }
});
```

- [ ] **Step 6: Update `init()` to build search index after loading**

Add `buildSearchIndex()` call at the end of the `init()` function, after all parts are loaded. Also preload all parts for search:

```javascript
async function init() {
  applyTheme();
  await loadI18N(State.lang);

  // preload all parts for search
  await Promise.all(PART_ORDER.map(id => loadPart(id)));

  applyI18N();
  renderSidebar();
  renderTabBar();

  document.getElementById('article').innerHTML = PARTS[State.currentPart];

  const quiz = await loadQuiz(State.currentPart);
  renderQuiz(quiz, State.currentPart);

  applyCollapsedState();
  applyProgressCheckboxes();
  buildSearchIndex();
}
```

- [ ] **Step 7: Verify all interactive features in browser**

Open `study-guide/src/index.html`. Test:
1. Accordion collapse/expand on section headers
2. Expand All / Collapse All button
3. Section checkboxes mark progress
4. Quiz renders with clickable options, shows correct/incorrect, displays score
5. Search opens overlay, finds text, navigates to match on click
6. Theme toggle switches light/dark
7. Language dropdown opens (only EN works for now)

- [ ] **Step 8: Commit**

```bash
git add study-guide/
git commit -m "feat: add accordions, progress tracking, quizzes, and search"
```

---

## Phase 2: Content (Tasks 4-5)

### Task 4: Extract and Write English Content for All 8 Parts

Read `full_text.txt` (the extracted PDF text) and write proper HTML content fragments for all 8 parts. Each part should have complete English content with proper section structure, callouts, code blocks, and quiz questions.

**Files:**
- Modify: `study-guide/src/parts/part1.html` (replace placeholder)
- Create: `study-guide/src/parts/part2.html`
- Create: `study-guide/src/parts/part3.html`
- Create: `study-guide/src/parts/part4.html`
- Create: `study-guide/src/parts/part5.html`
- Create: `study-guide/src/parts/part6.html`
- Create: `study-guide/src/parts/part7.html`
- Create: `study-guide/src/parts/glossary.html`
- Create: `study-guide/src/quizzes/part2-quiz.json` through `glossary-quiz.json`
- Modify: `study-guide/src/i18n/en.json` (add section headings)

**Source:** `full_text.txt` lines 1–23691

Each part HTML fragment must follow this pattern:

```html
<section class="part" data-part="partN">
  <div class="part-header">
    <h2 data-i18n="parts.partN.title">Part N: Title</h2>
    <p class="part-subtitle">Chapters X–Y</p>
    <div class="part-controls">
      <button class="expand-all-btn" data-i18n="ui.expand_all">Expand All</button>
    </div>
  </div>

  <div class="accordion" data-section="N.M">
    <button class="accordion-header">
      <span class="accordion-icon">▾</span>
      <span>N.M Section Title</span>
      <label class="section-check"><input type="checkbox" class="section-checkbox" data-section-id="partN.N.M"></label>
    </button>
    <div class="accordion-body">
      <!-- Content with callouts, tables, code blocks -->
      <div class="callout callout-concept">
        <strong>📌 Key Concept:</strong> explanation
      </div>
      <div class="callout callout-tip">
        <strong>💡 Pro Tip:</strong> explanation
      </div>
      <div class="callout callout-warning">
        <strong>⚠️ Common Mistake:</strong> explanation
      </div>
      <pre><code>code example</code></pre>
    </div>
  </div>
</section>
```

- [ ] **Step 1: Write `part1.html` — Building Fundamentals (Ch 1-2)**

Read `full_text.txt` lines 1-1000 (approximately). Extract and organize into sections:
- 1.1 Why the Ecosystem Is Hot
- 1.2 Four Key Terms to Remember
- 1.3 The Harness Concept
- 1.4 Work Surfaces: Chat vs Projects vs Cowork vs Claude Code
- 1.5 What Changes Fast vs What Stays

Include callouts for the 4 key terms (memoized context, tool orchestration, permission gate, resumable session), the harness analogy, and the work surface comparison table.

- [ ] **Step 2: Write `part2.html` — Practical Playbook (Ch 3-4)**

Read `full_text.txt` for chapters 3-4. Extract and organize into sections covering:
- Cowork starting templates (project-brief.md)
- Claude Code starting templates (CLAUDE.md, settings.json, hooks)
- Prompt templates: context-first, bug-fix, review, contract-style
- The three engineering layers comparison (prompt, context, harness)

- [ ] **Step 3: Write `part3.html` — System Design (Ch 5)**

Content covering context engineering, harness engineering, verification loops, token economics.

- [ ] **Step 4: Write `part4.html` — Extensions & Automation (Ch 6)**

Content covering Skills, Plugins, MCP, Hooks, Subagents, Control Surfaces. Include the skill folder structure example, frontmatter explanation, and the "when to use each" comparison table.

- [ ] **Step 5: Write `part5.html` — Role-Based Playbooks (Ch 7-8)**

Content covering job-specific playbooks (PM, marketing, sales, design, engineering) and Korea-specific scenarios (junior dev, team lead, operations).

- [ ] **Step 6: Write `part6.html` — Community Patterns (Ch 9-10)**

Content covering memory/recall patterns, plan.md pattern, parallel sessions, self-improvement loops, tool selection criteria.

- [ ] **Step 7: Write `part7.html` — Governance & Final Practice (Ch 11-12)**

Content covering permission models, governance layers, human-in-the-loop design, and the final website/automation practice walkthrough.

- [ ] **Step 8: Write `glossary.html` — Glossary & Quick Reference**

Alphabetical glossary with term groups (context, session, workspace bundles), each term as an accordion.

- [ ] **Step 9: Write quiz JSON files for parts 2-7 and glossary**

5 questions per part, following the same format as `part1-quiz.json`.

- [ ] **Step 10: Update `en.json` with all section heading keys**

Add all section headings so the sidebar renders correctly.

- [ ] **Step 11: Verify all parts load and navigate correctly**

Open in browser, click through all 8 tabs, verify content renders, quizzes work, search finds content across all parts.

- [ ] **Step 12: Commit**

```bash
git add study-guide/
git commit -m "feat: add complete English content for all 8 parts with quizzes"
```

---

### Task 5: Translate to 5 Additional Languages

Create i18n JSON files for Korean, Russian, Hindi, Chinese, and French. Each file contains UI strings and all content translations.

**Files:**
- Create: `study-guide/src/i18n/ko.json`
- Create: `study-guide/src/i18n/ru.json`
- Create: `study-guide/src/i18n/hi.json`
- Create: `study-guide/src/i18n/zh.json`
- Create: `study-guide/src/i18n/fr.json`

- [ ] **Step 1: Create `ko.json` — Korean**

Korean is the source language of the original PDF, so this should be the most faithful translation. Include all UI strings and content.

- [ ] **Step 2: Create `ru.json` — Russian**

Translate all UI strings and content to Russian.

- [ ] **Step 3: Create `hi.json` — Hindi**

Translate all UI strings and content to Hindi.

- [ ] **Step 4: Create `zh.json` — Chinese (Simplified)**

Translate all UI strings and content to Simplified Chinese.

- [ ] **Step 5: Create `fr.json` — French**

Translate all UI strings and content to French.

- [ ] **Step 6: Verify language switching works for all 6 languages**

Open in browser, switch through each language, verify content updates, sidebar updates, quiz questions translate, UI labels translate.

- [ ] **Step 7: Commit**

```bash
git add study-guide/src/i18n/
git commit -m "feat: add translations for KO, RU, HI, ZH, FR"
```

---

## Phase 3: Polish & Build (Tasks 6-7)

### Task 6: CSS Polish with Interface Design Plugin

Apply the interface-design plugin's design system to style all components with craft.

**Files:**
- Modify: `study-guide/src/style.css`

- [ ] **Step 1: Run `/interface-design:critique` on the current build**

Let the plugin analyze the current state and identify where defaults took over.

- [ ] **Step 2: Apply design system tokens and component styles**

Based on the critique, refine:
- Surface elevation hierarchy
- Border progression (subtle rgba)
- Typography hierarchy (4 text levels)
- Accordion styling (smooth transitions, hover states)
- Quiz card styling (correct/incorrect states, explanations)
- Callout box styling (concept, tip, warning variants)
- Progress bar styling
- Search overlay styling
- Tab bar styling
- Sidebar styling (active state, hover, checkmarks)
- Mobile responsive refinements

- [ ] **Step 3: Verify dark mode looks correct**

Switch to dark mode, check all components: borders over shadows, semantic colors slightly desaturated, proper contrast hierarchy.

- [ ] **Step 4: Test on mobile viewport (375px width)**

Verify: hamburger opens sidebar overlay, tabs scroll horizontally, content is readable, quizzes work on touch.

- [ ] **Step 5: Commit**

```bash
git add study-guide/src/style.css
git commit -m "feat: apply interface-design system polish to all components"
```

---

### Task 7: Build Script + Distribution

Create the build script that bundles everything into a single `dist/index.html`.

**Files:**
- Create: `study-guide/build.sh`
- Create: `study-guide/README.md`

- [ ] **Step 1: Create `study-guide/build.sh`**

```bash
#!/usr/bin/env bash
set -euo pipefail

SRC="$(dirname "$0")/src"
DIST="$(dirname "$0")/dist"
mkdir -p "$DIST"

# Read the shell HTML
SHELL=$(cat "$SRC/index.html")

# Inline CSS
CSS=$(cat "$SRC/style.css")
SHELL=$(echo "$SHELL" | sed "s|<link rel=\"stylesheet\" href=\"style.css\">|<style>${CSS//&/\\&}</style>|")

# Inline each part as a <template>
PARTS_TEMPLATES=""
for f in "$SRC"/parts/*.html; do
  name=$(basename "$f" .html)
  content=$(cat "$f")
  PARTS_TEMPLATES="${PARTS_TEMPLATES}<template id=\"tpl-${name}\">${content}</template>\n"
done

# Inline i18n as JS object
I18N_DATA="const INLINED_I18N = {"
for f in "$SRC"/i18n/*.json; do
  lang=$(basename "$f" .json)
  content=$(cat "$f")
  I18N_DATA="${I18N_DATA}\"${lang}\": ${content},"
done
I18N_DATA="${I18N_DATA}};"

# Inline quizzes as JS object
QUIZ_DATA="const INLINED_QUIZZES = {"
for f in "$SRC"/quizzes/*.json; do
  name=$(basename "$f" -quiz.json)
  content=$(cat "$f")
  QUIZ_DATA="${QUIZ_DATA}\"${name}\": ${content},"
done
QUIZ_DATA="${QUIZ_DATA}};"

# Build inline JS
APP_JS=$(cat "$SRC/app.js")
INLINE_JS="<script>
const INLINED = true;
${I18N_DATA}
${QUIZ_DATA}
${APP_JS}
</script>"

# Replace the external script tag
SHELL=$(echo "$SHELL" | sed "s|<script src=\"app.js\"></script>|<!-- inlined -->|")

# Insert templates before </body> and inline JS before </body>
SHELL=$(echo "$SHELL" | sed "s|</body>|${PARTS_TEMPLATES}${INLINE_JS}\n</body>|")

echo "$SHELL" > "$DIST/index.html"
echo "Built: $DIST/index.html ($(wc -c < "$DIST/index.html" | tr -d ' ') bytes)"
```

- [ ] **Step 2: Update `app.js` to detect inlined mode**

Add at the top of `app.js`, replace the fetch-based loaders with inlined data when available:

```javascript
// ── Loading (supports both dev fetch and inlined build) ──
async function loadI18N(lang) {
  if (I18N[lang]) return I18N[lang];
  if (typeof INLINED !== 'undefined' && INLINED_I18N[lang]) {
    I18N[lang] = INLINED_I18N[lang];
    return I18N[lang];
  }
  try {
    const res = await fetch(`i18n/${lang}.json`);
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
    const tpl = document.getElementById(`tpl-${partId}`);
    if (tpl) { PARTS[partId] = tpl.innerHTML; return PARTS[partId]; }
  }
  try {
    const res = await fetch(`parts/${partId}.html`);
    PARTS[partId] = await res.text();
    return PARTS[partId];
  } catch {
    return '<p>Content not available.</p>';
  }
}

async function loadQuiz(partId) {
  if (QUIZZES[partId]) return QUIZZES[partId];
  if (typeof INLINED !== 'undefined' && INLINED_QUIZZES[partId]) {
    QUIZZES[partId] = INLINED_QUIZZES[partId];
    return QUIZZES[partId];
  }
  try {
    const res = await fetch(`quizzes/${partId}-quiz.json`);
    QUIZZES[partId] = await res.json();
    return QUIZZES[partId];
  } catch {
    return [];
  }
}
```

- [ ] **Step 3: Make build.sh executable and run it**

```bash
chmod +x study-guide/build.sh
./study-guide/build.sh
```

Expected output: `Built: study-guide/dist/index.html (XXXXXX bytes)`

- [ ] **Step 4: Test the built file**

Open `study-guide/dist/index.html` by double-clicking it (not via a server). Verify:
1. All content loads
2. Navigation works
3. Language switching works
4. Theme toggle works
5. Search works
6. Quizzes work
7. Progress persists after refresh

- [ ] **Step 5: Create `study-guide/README.md`**

```markdown
# Claude Code Master Guide — Interactive Study Guide

An interactive, multilingual study guide based on the 583-page "클로드코드 중심 실전 마스터 가이드" (2026).

## Quick Start (Reader)

Open `dist/index.html` in any browser. That's it.

## Languages

English, 한국어, Русский, हिंदी, 中文, Français

## Features

- 8 study sections with collapsible content
- Self-check quizzes with scoring
- Progress tracking (saved locally)
- Full-text search
- Dark/light theme
- Works offline — no internet needed

## Development

Edit files in `src/`. Open `src/index.html` in a browser for live development.

## Build

Run `./build.sh` to produce a single portable `dist/index.html`.

Requires only `bash`.
```

- [ ] **Step 6: Commit**

```bash
git add study-guide/
git commit -m "feat: add build script and portable distribution"
```

---

## Summary

| Phase | Tasks | What it delivers |
|-------|-------|------------------|
| 1: Foundation | 1-3 | Working app shell with navigation, theme, language, accordions, progress, quizzes, search |
| 2: Content | 4-5 | Complete English content + 5 language translations |
| 3: Polish & Build | 6-7 | Crafted design system + single-file portable build |

Total: 7 tasks. Phase 1 builds the interactive framework. Phase 2 fills it with content. Phase 3 polishes and packages.
