/**
 * Final dark mode patch — replaces remaining hardcoded light-theme colors
 * with CSS custom properties in all component .tsx files.
 *
 * Run: node scripts/final-darkmode-patch.js
 */

const fs = require('fs')
const path = require('path')

// Replacement pairs: [regex, replacement]
// Order matters — more specific patterns first.
const replacements = [
  // ---- JSX prop values (iconBg, etc.) ----
  [/iconBg="#EEF2FF"/g,  'iconBg="var(--color-primary-light)"'],
  [/iconBg='#EEF2FF'/g,  "iconBg='var(--color-primary-light)'"],
  [/iconBg="#D1FAE5"/g,  'iconBg="var(--color-success-light)"'],
  [/iconBg="#FEF3C7"/g,  'iconBg="var(--color-warning-light)"'],
  [/iconBg="#DBEAFE"/g,  'iconBg="var(--color-info-light)"'],

  // ---- Object bg color config values ----
  [/\bbg: '#F1F5F9'/g,   "bg: 'var(--color-surface-2)'"],
  [/\bbg: '#F9FAFB'/g,   "bg: 'var(--color-surface-2)'"],
  [/\bbg: '#FAFBFC'/g,   "bg: 'var(--color-surface-2)'"],

  // ---- Row dividers ----
  [/'1px solid #F9FAFB'/g,  "'1px solid var(--color-border)'"],
  [/"1px solid #F9FAFB"/g,  '"1px solid var(--color-border)"'],
  [/'1px solid #FAFBFC'/g,  "'1px solid var(--color-border)'"],

  // ---- Card header bg ----
  [/backgroundColor: '#FAFBFC'/g,  "backgroundColor: 'var(--color-surface-2)'"],

  // ---- Gradient placeholders (thumbnail fallback) ----
  [/background: 'linear-gradient\(135deg, #EEF2FF, #E0E7FF\)'/g,
    "background: 'linear-gradient(135deg, var(--color-primary-light), #E0E7FF)'"],

  // ---- Borders / dividers ----
  [/'1px solid #F1F5F9'/g,  "'1px solid var(--color-border)'"],
  [/"1px solid #F1F5F9"/g,  '"1px solid var(--color-border)"'],
  [/'2px solid #F1F5F9'/g,  "'2px solid var(--color-border)'"],
  [/'1px solid #E2E8F0'/g,  "'1px solid var(--color-border)'"],
  [/"1px solid #E2E8F0"/g,  '"1px solid var(--color-border)"'],
  [/border: '1px solid #F1F5F9'/g, "border: '1px solid var(--color-border)'"],
  [/border: "1px solid #F1F5F9"/g, 'border: "1px solid var(--color-border)"'],

  // ---- Icon / tag / type config container backgrounds ----
  [/backgroundColor: '#EEF2FF'/g,   "backgroundColor: 'var(--color-primary-light)'"],
  [/backgroundColor: "#EEF2FF"/g,   'backgroundColor: "var(--color-primary-light)"'],
  [/\bbg: '#EEF2FF'/g,              "bg: 'var(--color-primary-light)'"],
  [/\bbg: "#EEF2FF"/g,              'bg: "var(--color-primary-light)"'],
  // ternary where #EEF2FF is a branch value (e.g. copied ? '#EEF2FF' : ...)
  [/\? '#EEF2FF'/g,  "? 'var(--color-primary-light)'"],
  [/\? "#EEF2FF"/g,  '? "var(--color-primary-light)"'],
  // colon-value patterns in JSX (e.g. color: '#EEF2FF')
  [/: '#EEF2FF'(?=[,\s})])/g, ": 'var(--color-primary-light)'"],

  // ---- Page / panel backgrounds ----
  [/backgroundColor: '#F8F9FC'/g,   "backgroundColor: 'var(--color-bg)'"],
  [/backgroundColor: "#F8F9FC"/g,   'backgroundColor: "var(--color-bg)"'],
  [/backgroundColor: '#FAFBFF'/g,   "backgroundColor: 'var(--color-surface-2)'"],
  [/backgroundColor: "#FAFBFF"/g,   'backgroundColor: "var(--color-surface-2)"'],
  [/backgroundColor: '#F1F5F9'/g,   "backgroundColor: 'var(--color-surface-2)'"],
  [/backgroundColor: "#F1F5F9"/g,   'backgroundColor: "var(--color-surface-2)"'],
  [/backgroundColor: '#F9FAFB'/g,   "backgroundColor: 'var(--color-surface-2)'"],
  [/backgroundColor: "#F9FAFB"/g,   'backgroundColor: "var(--color-surface-2)"'],

  // ---- Ternary patterns (safe common forms) ----
  [/open \? '#EEF2FF' : 'transparent'/g,   "open ? 'var(--color-primary-light)' : 'transparent'"],
  [/isOpen \? '#EEF2FF' : 'transparent'/g, "isOpen ? 'var(--color-primary-light)' : 'transparent'"],

  // ---- Semantic light backgrounds ----
  [/backgroundColor: '#D1FAE5'/g,   "backgroundColor: 'var(--color-success-light)'"],
  [/backgroundColor: '#FEE2E2'/g,   "backgroundColor: 'var(--color-danger-light)'"],
  [/backgroundColor: '#FEF3C7'/g,   "backgroundColor: 'var(--color-warning-light)'"],
  [/backgroundColor: '#DBEAFE'/g,   "backgroundColor: 'var(--color-info-light)'"],
  [/backgroundColor: '#F0FDF4'/g,   "backgroundColor: 'var(--color-success-light)'"],
  [/backgroundColor: '#FFF5F5'/g,   "backgroundColor: 'var(--color-danger-light)'"],
  [/backgroundColor: '#FFFBEB'/g,   "backgroundColor: 'var(--color-warning-light)'"],
  [/backgroundColor: '#ECFDF5'/g,   "backgroundColor: 'var(--color-success-light)'"],
  [/backgroundColor: '#EFF6FF'/g,   "backgroundColor: 'var(--color-info-light)'"],
  [/\bbg: '#FEE2E2'/g,              "bg: 'var(--color-danger-light)'"],
  [/\bbg: '#FEF3C7'/g,              "bg: 'var(--color-warning-light)'"],
  [/\bbg: '#D1FAE5'/g,              "bg: 'var(--color-success-light)'"],
  [/\bbg: '#ECFDF5'/g,              "bg: 'var(--color-success-light)'"],
]

// Files / patterns to SKIP (already styled for dark sidebar or use vars)
const SKIP = [
  'Sidebar.tsx',
  'ThemeToggle.tsx',
  'ThemeProvider.tsx',
  'globals.css',
  path.join('components', 'ui'),
]

function shouldSkip(filePath) {
  return SKIP.some(s => filePath.includes(s))
}

function walk(dir) {
  const result = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      result.push(...walk(full))
    } else if (entry.isFile() && (entry.name.endsWith('.tsx') || entry.name.endsWith('.ts') || entry.name.endsWith('.css'))) {
      result.push(full)
    }
  }
  return result
}

const SRC = path.join(__dirname, '..', 'src')
const files = walk(SRC).filter(f => !shouldSkip(f))

let totalChanges = 0
for (const file of files) {
  let content = fs.readFileSync(file, 'utf8')
  const original = content
  for (const [pattern, replacement] of replacements) {
    content = content.replace(pattern, replacement)
  }
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8')
    const relPath = path.relative(path.join(__dirname, '..'), file)
    console.log(`✅  ${relPath}`)
    totalChanges++
  }
}

console.log(`\nDone. ${totalChanges} file(s) updated.`)
