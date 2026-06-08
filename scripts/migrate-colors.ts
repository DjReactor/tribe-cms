const fs = require('fs')
const path = require('path')

const templatesDir = path.join(__dirname, '../src/templates')

const fileReplacements = [
  // Hex color replacements
  { regex: /#B9FF24/gi, replacement: 'var(--sf-brand)' },
  { regex: /#2D6A4F/gi, replacement: 'var(--sf-brand)' },
  { regex: /bg-\[#B9FF24\]/gi, replacement: 'bg-[var(--sf-brand)]' },
  { regex: /bg-\[#2D6A4F\]/gi, replacement: 'bg-[var(--sf-brand)]' },
  { regex: /text-\[#B9FF24\]/gi, replacement: 'text-[var(--sf-brand)]' },
  { regex: /text-\[#2D6A4F\]/gi, replacement: 'text-[var(--sf-brand)]' },
  { regex: /border-\[#B9FF24\]/gi, replacement: 'border-[var(--sf-brand)]' },
  { regex: /border-\[#2D6A4F\]/gi, replacement: 'border-[var(--sf-brand)]' },

  // Tailwind generic colors replacements
  { regex: /bg-slate-900/g, replacement: 'bg-[var(--sf-bg)]' },
  { regex: /bg-slate-800/g, replacement: 'bg-[var(--sf-surface-alt)]' },
  { regex: /bg-slate-50/g, replacement: 'bg-[var(--sf-surface)]' },
  { regex: /bg-white/g, replacement: 'bg-[var(--sf-surface)]' },
  
  { regex: /text-slate-900/g, replacement: 'text-[var(--sf-heading)]' },
  { regex: /text-slate-800/g, replacement: 'text-[var(--sf-heading)]' },
  { regex: /text-slate-700/g, replacement: 'text-[var(--sf-text)]' },
  { regex: /text-slate-600/g, replacement: 'text-[var(--sf-text)]' },
  { regex: /text-slate-500/g, replacement: 'text-[var(--sf-text-muted)]' },
  { regex: /text-slate-400/g, replacement: 'text-[var(--sf-text-muted)]' },
  
  { regex: /border-slate-100/g, replacement: 'border-[var(--sf-border)]' },
  { regex: /border-slate-200/g, replacement: 'border-[var(--sf-border)]' },
  { regex: /border-slate-700/g, replacement: 'border-[var(--sf-border)]' },

  { regex: /text-white/g, replacement: 'text-[var(--sf-text)]' },
  // Brand text cases
  { regex: /bg-\[var\(--sf-brand\)\] text-\[var\(--sf-text\)\]/g, replacement: 'bg-[var(--sf-brand)] text-[var(--sf-brand-text)]' },
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
