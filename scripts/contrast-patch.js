/**
 * contrast-patch.js
 * Replaces hardcoded text colors that have poor contrast in dark mode
 * with CSS custom properties that adapt to both light and dark themes.
 *
 * Run: node scripts/contrast-patch.js
 */

const fs = require('fs')
const path = require('path')

const replacements = [
  // ── Body / secondary text ──────────────────────────────────────────
  // #475569 = Slate-600 (fine in light, near-invisible on dark surface)
  [/color:\s*'#475569'/g,  "color: 'var(--color-text-secondary)'"],
  [/color:\s*"#475569"/g,  'color: "var(--color-text-secondary)"'],
  // #334155 used as text (Slate-700, same problem)
  [/color:\s*'#334155'/g,  "color: 'var(--color-text-secondary)'"],
  [/color:\s*"#334155"/g,  'color: "var(--color-text-secondary)"'],

  // ── Semantic badge / tint-text colors ─────────────────────────────
  // These appear as text ON tinted backgrounds — need to flip in dark mode
  [/color:\s*'#3730A3'/g,  "color: 'var(--color-primary-on-tint)'"],
  [/color:\s*"#3730A3"/g,  'color: "var(--color-primary-on-tint)"'],

  [/color:\s*'#065F46'/g,  "color: 'var(--color-success-on-tint)'"],
  [/color:\s*"#065F46"/g,  'color: "var(--color-success-on-tint)"'],

  [/color:\s*'#92400E'/g,  "color: 'var(--color-warning-on-tint)'"],
  [/color:\s*"#92400E"/g,  'color: "var(--color-warning-on-tint)"'],

  [/color:\s*'#991B1B'/g,  "color: 'var(--color-danger-on-tint)'"],
  [/color:\s*"#991B1B"/g,  'color: "var(--color-danger-on-tint)"'],

  [/color:\s*'#1E40AF'/g,  "color: 'var(--color-info-on-tint)'"],
  [/color:\s*"#1E40AF"/g,  'color: "var(--color-info-on-tint)"'],

  // ── Disabled-button backgrounds (bright on dark surface = bad) ────
  [/backgroundColor:\s*'#E2E8F0',\s*color:\s*'#94A3B8'/g,
   "backgroundColor: 'var(--color-border)', color: 'var(--color-text-muted)'"],
  [/backgroundColor:\s*"#E2E8F0",\s*color:\s*"#94A3B8"/g,
   'backgroundColor: "var(--color-border)", color: "var(--color-text-muted)"'],

  // ── Textarea/input focus-out border (onBlur inline handler) ───────
  [/e\.currentTarget\.style\.borderColor\s*=\s*'#E2E8F0'/g,
   "e.currentTarget.style.borderColor = 'var(--color-border)'"],
  [/e\.currentTarget\.style\.borderColor\s*=\s*"#E2E8F0"/g,
   'e.currentTarget.style.borderColor = "var(--color-border)"'],
]

const SKIP = [
  'Sidebar.tsx', 'ThemeToggle.tsx', 'ThemeProvider.tsx',
  path.join('components', 'ui'),
]

function shouldSkip(filePath) {
  return SKIP.some(s => filePath.includes(s))
}

function walk(dir) {
  const result = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) result.push(...walk(full))
    else if (entry.isFile() && entry.name.endsWith('.tsx')) result.push(full)
  }
  return result
}

const SRC = path.join(__dirname, '..', 'src')
const files = walk(SRC).filter(f => !shouldSkip(f))

let totalFiles = 0
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8')
  const original = content
  for (const [pattern, replacement] of replacements) {
    content = content.replace(pattern, replacement)
  }
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8')
    console.log('✅  ' + path.relative(path.join(__dirname, '..'), file))
    totalFiles++
  }
}
console.log(`\nDone. ${totalFiles} file(s) updated.`)
