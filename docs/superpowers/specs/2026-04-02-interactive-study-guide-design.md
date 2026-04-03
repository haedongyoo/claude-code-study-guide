# Interactive Study Guide — Design Spec

## Overview

An HTML-based interactive study guide that transforms a 583-page Korean Claude Code guidebook into a multilingual, searchable, quiz-enabled documentation site. Supports 6 languages (EN/KO/RU/HI/ZH/FR) with a global toggle.

---

## Architecture

### Hybrid: Multi-File Source + Single-File Distribution

**Source structure (for editing):**
```
study-guide/
├── src/
│   ├── index.html              ← app shell: sidebar, header, content area
│   ├── style.css               ← design system tokens + all styles
│   ├── app.js                  ← all interactive behavior
│   ├── parts/
│   │   ├── part1.html          ← content fragment (no <html> wrapper)
│   │   ├── part2.html
│   │   ├── part3.html
│   │   ├── part4.html
│   │   ├── part5.html
│   │   ├── part6.html
│   │   ├── part7.html
│   │   └── glossary.html
│   ├── i18n/
│   │   ├── en.json
│   │   ├── ko.json
│   │   ├── ru.json
│   │   ├── hi.json
│   │   ├── zh.json
│   │   └── fr.json
│   └── quizzes/
│       ├── part1-quiz.json
│       ├── part2-quiz.json
│       └── ...
├── build.sh                    ← shell script, inlines everything into one file
├── dist/
│   └── index.html              ← portable output (open in any browser)
└── README.md
```

**Build step:** `build.sh` reads all source files, inlines CSS/JS/content/i18n/quizzes into a single `dist/index.html`. No Node.js or npm required — pure shell script using `cat` and `sed`.

**Distribution:** The `dist/index.html` file is fully self-contained. Double-click to open. No server needed. Can also be deployed to GitHub Pages or any static host.

---

## Content Structure

8 parts derived from the 583-page PDF (12 chapters + appendix):

| Part | Chapters | Title | Focus |
|------|----------|-------|-------|
| 1 | Ch 1–2 | Building Fundamentals | Ecosystem, core concepts, 4 key terms |
| 2 | Ch 3–4 | Practical Playbook | Cowork/Claude Code playbook, templates, checklists |
| 3 | Ch 5 | System Design | Context, harness, verification architecture |
| 4 | Ch 6 | Extensions & Automation | Skills, Plugins, MCP, Hooks, Subagents |
| 5 | Ch 7–8 | Role-Based Playbooks | Job-specific guides + Korea-specific scenarios |
| 6 | Ch 9–10 | Community Patterns & Tools | Usage patterns, memory, planning, tool selection |
| 7 | Ch 11–12 | Governance & Final Practice | Security, adoption, website/automation practice |
| 8 | Appendix | Glossary & Quick Reference | Extended glossary, term groups, quick lookup |

Each part contains:
- Section headings with anchors
- Key concept callouts
- Code/config examples in fenced blocks
- Diagrams described as structured text/tables
- Pro tips and common mistake warnings
- Self-check quiz at the end

---

## Layout

### Desktop (>768px)
```
┌─────────────────────────────────────────────────┐
│  [Logo/Title]     [🔍 Search]  [🌐 EN ▾] [☀/🌙] │  ← Header
├────────────┬────────────────────────────────────┤
│            │                                    │
│  CONTENTS  │  Part 1: Building Fundamentals     │
│            │                                    │
│  ▾ Part 1  │  ▾ 1.1 Why the ecosystem is hot    │
│    1.1     │    Content here...                 │
│    1.2     │                                    │
│    1.3     │  ▸ 1.2 Four key terms (collapsed)  │
│  ▸ Part 2  │                                    │
│  ▸ Part 3  │  ▸ 1.3 The harness concept         │
│  ▸ Part 4  │                                    │
│  ...       │  ──────────────────────────         │
│            │  📋 Self-Check Quiz                 │
│  ───────── │  [question cards here]              │
│  Progress  │                                    │
│  ████░░ 4/8│  ← Prev    [Part 2: Playbook →]   │
│            │                                    │
└────────────┴────────────────────────────────────┘
```

### Mobile (<768px)
- Sidebar collapses into hamburger menu
- Full-width content
- Language/theme toggles move into hamburger
- Search becomes expandable icon

### Key Layout Decisions
- **Sidebar:** Same background as content area, separated by subtle border (not different color)
- **Active section:** Highlighted in sidebar with left accent border
- **Sidebar sections:** Collapsible — click part name to expand/collapse subsections
- **Progress indicator:** Bottom of sidebar, shows overall completion

---

## Navigation

### Sidebar (persistent on desktop)
- Collapsible tree: Part → Sections
- Active section highlighted
- Progress checkmarks on completed sections
- Overall progress bar at bottom

### Page-level
- Prev/Next buttons at bottom of content area
- Tab-style part selector at top of content (horizontal, scrollable on mobile)
- Both navigate between parts

### Within a part
- Sections are collapsible accordions
- Click heading to expand/collapse
- All expanded by default on first visit
- Remembers collapse state in localStorage

---

## Language System

### Global Toggle (Option A)
- Dropdown in header: 🌐 EN | 한국어 | Русский | हिंदी | 中文 | Français
- Switches ALL content on current page at once
- Saved to localStorage, persists across visits
- Default: English

### Implementation
- All 6 translations live in JSON files under `i18n/`
- Each JSON has keys matching content section IDs
- Content fragments in `parts/*.html` use `data-i18n="key"` attributes
- `app.js` swaps `textContent` based on selected language
- UI strings (button labels, "Next", "Search", etc.) also in i18n files

### Structure of i18n JSON
```json
{
  "ui": {
    "search_placeholder": "Search...",
    "next": "Next",
    "prev": "Previous",
    "quiz_title": "Self-Check Quiz",
    "progress": "Progress",
    "expand_all": "Expand All",
    "collapse_all": "Collapse All"
  },
  "parts": {
    "part1": {
      "title": "Part 1: Building Fundamentals",
      "sections": {
        "1.1": {
          "heading": "Why the Ecosystem Is Hot",
          "content": "The competition shifted from..."
        }
      }
    }
  },
  "quizzes": {
    "part1": [
      {
        "question": "What does 'memoized context' mean?",
        "options": ["...", "...", "..."],
        "answer": 1,
        "explanation": "..."
      }
    ]
  }
}
```

---

## Interactive Features

### 1. Self-Check Quizzes
- Multiple choice questions at end of each part
- Click option to select → reveal correct/incorrect + explanation
- Score counter: "3/5 correct"
- Score saved to localStorage per part
- Retry button to reset

### 2. Progress Tracking
- Checkbox per section (click to mark as read)
- Progress bar per part in sidebar
- Overall progress bar at sidebar bottom
- All state in localStorage
- Visual: filled segments in progress bar, checkmarks in sidebar

### 3. Collapsible Sections
- Each section within a part is an accordion
- Click heading to toggle
- "Expand All / Collapse All" button per part
- Collapse state saved to localStorage
- Smooth height transition animation

### 4. Full-Text Search
- Search input in header
- Client-side search using pre-built index
- Index built at build time from all content across all languages
- Results show: Part → Section → matching snippet with highlighted term
- Click result to navigate and scroll to match
- Debounced input (300ms)

### 5. Dark/Light Theme
- Toggle button in header (sun/moon icon)
- Light mode default (Clean White base)
- Dark mode: inverted palette, borders over shadows
- Respects `prefers-color-scheme` on first visit
- Saved to localStorage after manual toggle
- Smooth transition between modes

---

## Visual Design

### Intent
- **Who:** Self-learners, team leads, developers studying Claude Code — ranging from beginners to advanced
- **Task:** Study, reference, and quiz themselves on Claude Code concepts across languages
- **Feel:** Clean like a well-organized textbook, not sterile like a generic docs template

### Approach
- Use the **interface-design plugin** (`/interface-design:init`) to establish the full design system
- Starting intent: Clean White (Option B from brainstorming)
- The plugin will do domain exploration, signature element, color world, token architecture
- Design system saved to `.interface-design/system.md` for consistency

### Known Design Constraints
- Must work without JavaScript for basic reading (progressive enhancement)
- Must support RTL-adjacent scripts (Hindi, potentially Arabic in future)
- Must handle CJK characters (Chinese, Korean) — font-family stack needs CJK fallbacks
- Code blocks need monospace with good Unicode coverage
- Quiz cards, callout boxes, and collapsible sections are the primary components

### Typography Requirements
- Body: sans-serif with good multilingual coverage
- Code: monospace with ligatures optional
- CJK fallback: system fonts (Noto Sans CJK, PingFang, Malgun Gothic)
- Hindi: Noto Sans Devanagari or system fallback
- Data/stats: tabular-nums for alignment

---

## Build System

### `build.sh`
Pure shell script. No dependencies beyond `bash`, `cat`, `sed`.

**What it does:**
1. Reads `src/index.html` as shell
2. Inlines `src/style.css` into `<style>` tag
3. Inlines `src/app.js` into `<script>` tag
4. Inlines each `src/parts/*.html` as `<template>` elements
5. Inlines each `src/i18n/*.json` into a JS object
6. Inlines each `src/quizzes/*.json` into a JS object
7. Builds search index from content
8. Writes single `dist/index.html`

**Output:** One HTML file, ~2-4MB, opens in any modern browser.

### Development Workflow
- Edit source files in `src/`
- Open `src/index.html` directly for development (loads files via fetch)
- Run `./build.sh` to produce portable `dist/index.html`
- The `src/` version uses fetch() to load parts/i18n dynamically
- The `dist/` version has everything inlined

---

## Data Flow

```
User opens dist/index.html
  → App initializes
  → Reads localStorage for: language, theme, progress, collapse states, quiz scores
  → Applies saved state (or defaults)
  → Renders sidebar with progress
  → Loads Part 1 content (or last viewed part)
  → User navigates / reads / quizzes
  → State changes saved to localStorage in real-time
```

---

## Error Handling

- **Missing translation:** Fall back to English, show subtle indicator
- **localStorage unavailable:** Features degrade gracefully (no persistence, still functional)
- **No JavaScript:** Basic HTML content still readable (progressive enhancement)
- **Search index missing:** Search disabled, no error shown

---

## Scope Boundaries

### In scope
- 8 content parts + glossary, all translated to 6 languages
- Sidebar + tab navigation
- Collapsible sections
- Self-check quizzes with scoring
- Progress tracking with localStorage
- Full-text search
- Dark/light theme
- Single-file portable build
- Mobile responsive

### Out of scope
- User accounts / server-side storage
- Collaborative features (comments, shared progress)
- PDF export
- Keyboard shortcuts
- Offline service worker (the single file already works offline)
- Analytics
- Print stylesheet
