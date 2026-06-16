const fs = require('fs')
const path = require('path')

const templatesDir = path.join(__dirname, '../src/templates')

const fileReplacements = [
  // Hex color replacements
  { regex: /#B9FF24/gi, replacement: 'var(--tribe-brand)' },
  { regex: /#2D6A4F/gi, replacement: 'var(--tribe-brand)' },
  { regex: /bg-\[#B9FF24\]/gi, replacement: 'bg-[var(--tribe-brand)]' },
  { regex: /bg-\[#2D6A4F\]/gi, replacement: 'bg-[var(--tribe-brand)]' },
  { regex: /text-\[#B9FF24\]/gi, replacement: 'text-[var(--tribe-brand)]' },
  { regex: /text-\[#2D6A4F\]/gi, replacement: 'text-[var(--tribe-brand)]' },
  { regex: /border-\[#B9FF24\]/gi, replacement: 'border-[var(--tribe-brand)]' },
  { regex: /border-\[#2D6A4F\]/gi, replacement: 'border-[var(--tribe-brand)]' },

  // Tailwind generic colors replacements
  { regex: /bg-slate-900/g, replacement: 'bg-[var(--tribe-bg)]' },
  { regex: /bg-slate-800/g, replacement: 'bg-[var(--tribe-surface-alt)]' },
  { regex: /bg-slate-50/g, replacement: 'bg-[var(--tribe-surface)]' },
  { regex: /bg-white/g, replacement: 'bg-[var(--tribe-surface)]' },
  
  { regex: /text-slate-900/g, replacement: 'text-[var(--tribe-heading)]' },
  { regex: /text-slate-800/g, replacement: 'text-[var(--tribe-heading)]' },
  { regex: /text-slate-700/g, replacement: 'text-[var(--tribe-text)]' },
  { regex: /text-slate-600/g, replacement: 'text-[var(--tribe-text)]' },
  { regex: /text-slate-500/g, replacement: 'text-[var(--tribe-text-muted)]' },
  { regex: /text-slate-400/g, replacement: 'text-[var(--tribe-text-muted)]' },
  
  { regex: /border-slate-100/g, replacement: 'border-[var(--tribe-border)]' },
  { regex: /border-slate-200/g, replacement: 'border-[var(--tribe-border)]' },
  { regex: /border-slate-700/g, replacement: 'border-[var(--tribe-border)]' },

  { regex: /text-white/g, replacement: 'text-[var(--tribe-text)]' },
  // Brand text cases
  { regex: /bg-\[var\(--tribe-brand\)\] text-\[var\(--tribe-text\)\]/g, replacement: 'bg-[var(--tribe-brand)] text-[var(--tribe-brand-text)]' },
]

function walk(dir) {
  let results = []
  const list = fs.readdirSync(dir)
  list.forEach(file => {
    file = path.join(dir, file)
    const stat = fs.statSync(file)
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file))
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file)
      }
    }
  })
  return results
}

const files = walk(templatesDir)

for (const file of files) {
  let content = fs.readFileSync(file, 'utf-8')
  let changed = false
  
  // Remove ACCENT export
  if (file.endsWith('theme.ts')) {
    const original = content;
    content = content.replace(/export const ACCENT = ['"][^'"]+['"];?\n?/g, '');
    if (content !== original) changed = true;
  }

  for (const { regex, replacement } of fileReplacements) {
    if (regex.test(content)) {
      content = content.replace(regex, replacement)
      changed = true
    }
  }
  
  if (changed) {
    fs.writeFileSync(file, content)
    console.log(`Updated ${path.relative(templatesDir, file)}`)
  }
}
