#!/usr/bin/env python3
import os, json, glob

SRC = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'src')
DIST = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'dist')

# Read base HTML
with open(os.path.join(SRC, 'index.html'), 'r') as f:
    html = f.read()

# Read CSS
with open(os.path.join(SRC, 'style.css'), 'r') as f:
    css = f.read()

# Inline CSS
html = html.replace('<link rel="stylesheet" href="style.css">', f'<style>\n{css}\n</style>')

# Read and inline parts as templates
templates = []
for path in sorted(glob.glob(os.path.join(SRC, 'parts', '*.html'))):
    name = os.path.splitext(os.path.basename(path))[0]
    with open(path, 'r') as f:
        content = f.read()
    templates.append(f'<template id="tpl-{name}">{content}</template>')

templates_html = '\n'.join(templates)

# Read i18n files
i18n = {}
for path in sorted(glob.glob(os.path.join(SRC, 'i18n', '*.json'))):
    lang = os.path.splitext(os.path.basename(path))[0]
    with open(path, 'r') as f:
        i18n[lang] = json.load(f)

# Read quiz files
quizzes = {}
for path in sorted(glob.glob(os.path.join(SRC, 'quizzes', '*.json'))):
    name = os.path.basename(path).replace('-quiz.json', '')
    with open(path, 'r') as f:
        quizzes[name] = json.load(f)

# Read app.js
with open(os.path.join(SRC, 'app.js'), 'r') as f:
    app_js = f.read()

# Build inline script
preamble = f'''const INLINED = true;
const INLINED_I18N = {json.dumps(i18n, ensure_ascii=False)};
const INLINED_QUIZZES = {json.dumps(quizzes, ensure_ascii=False)};
'''

inline_script = f'<script>\n{preamble}\n{app_js}\n</script>'

# Replace external script tag
html = html.replace('<script src="app.js"></script>', inline_script)

# Insert templates before </body>
html = html.replace('</body>', f'{templates_html}\n</body>')

# Write output
os.makedirs(DIST, exist_ok=True)
with open(os.path.join(DIST, 'index.html'), 'w') as f:
    f.write(html)
