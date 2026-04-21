const fs = require('fs');
const path = require('path');

const badPatterns = ["= '#F8FAFC'", "= '#F1F5F9'", "= '#EEF2FF'", "= '#FFFFFF'", "= '#F8F9FF'", "= '#F8F9FC'"];

function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      if (!['node_modules', '.next', 'ui'].includes(f)) walk(full);
    } else if (f.endsWith('.tsx')) {
      const c = fs.readFileSync(full, 'utf8');
      if (!c.includes('onMouseEnter')) continue;
      for (const p of badPatterns) {
        if (c.includes(p)) {
          console.log(path.relative('src', full), '->', p);
          break;
        }
      }
    }
  }
}

walk('src');
console.log('Audit done.');
