# Claude Code Master Guide — Interactive Study Guide

An interactive, multilingual study guide based on the 583-page "클로드코드 중심 실전 마스터 가이드" (2026).

## Quick Start (Reader)

Open `dist/index.html` in any browser. That's it. No server, no internet needed.

## Languages

English, 한국어, Русский, हिंदी, 中文, Français

## Features

- 8 study sections covering the complete Claude Code ecosystem
- Collapsible content sections for focused reading
- Self-check quizzes with scoring (5 questions per section)
- Progress tracking saved locally in your browser
- Full-text search across all content
- Dark/light theme (follows system preference)
- Works completely offline

## Development

Edit files in `src/`. Open `src/index.html` in a browser served via a local dev server for live development.

## Build

```bash
./build.sh
```

Produces a single portable `dist/index.html`. Requires `python3` and `bash`.

## Structure

```
src/
├── index.html       ← App shell
├── style.css        ← Design system + components
├── app.js           ← All interactive logic
├── parts/           ← 8 HTML content fragments
├── i18n/            ← 6 language files (EN/KO/RU/HI/ZH/FR)
└── quizzes/         ← Quiz questions per part
```
