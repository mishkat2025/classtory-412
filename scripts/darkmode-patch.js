const fs = require('fs');
const path = require('path');

const replacements = [
  ["backgroundColor: '#FFFFFF'", "backgroundColor: 'var(--color-surface)'"],
  ["backgroundColor: '#F8FAFC'", "backgroundColor: 'var(--color-surface-2)'"],
  ["backgroundColor: '#F8F9FC'", "backgroundColor: 'var(--color-bg)'"],
  ["backgroundColor: '#F1F5F9'", "backgroundColor: 'var(--color-surface-2)'"],
  ["border: '1px solid #E2E8F0'", "border: '1px solid var(--color-border)'"],
  ["border: '2px dashed #E2E8F0'", "border: '2px dashed var(--color-border)'"],
  ["borderBottom: '1px solid #F1F5F9'", "borderBottom: '1px solid var(--color-border)'"],
  ["borderTop: '1px solid #E2E8F0'", "borderTop: '1px solid var(--color-border)'"],
  ["color: '#0F172A'", "color: 'var(--color-text-primary)'"],
  ["color: '#64748B'", "color: 'var(--color-text-secondary)'"],
  ["color: '#94A3B8'", "color: 'var(--color-text-muted)'"],
  ["boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)'", "boxShadow: 'var(--shadow-card)'"],
];

const SKIP_DIRS = new Set(['node_modules', '.next', 'ui']);
const SKIP_FILES = new Set(['Sidebar.tsx', 'ThemeToggle.tsx', 'ThemeProvider.tsx']);

let patchedCount = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (!SKIP_DIRS.has(entry)) walk(full);
    } else if (entry.endsWith('.tsx') && !SKIP_FILES.has(entry)) {
      let content = fs.readFileSync(full, 'utf8');
      let changed = false;
      for (const [from, to] of replacements) {
        if (content.includes(from)) {
          content = content.split(from).join(to);
          changed = true;
        }
      }
      if (changed) {
        fs.writeFileSync(full, content, 'utf8');
        console.log('Patched:', path.relative('src', full));
        patchedCount++;
      }
    }
  }
}

walk('src');
console.log(`\nDone. ${patchedCount} file(s) patched.`);
