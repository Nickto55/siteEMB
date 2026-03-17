const fs = require('fs/promises');
const path = require('path');

const rootDir = path.join(__dirname, '..', 'public');

const insertDesktop = "\n                                <a href='rp-rules.html' class='text-purple-soft/70 block px-4 py-2 text-sm hover:text-purple-soft hover:bg-purple-deep/10'>Правила РП</a>\n";
const insertMobile = "\n                        <a href='rp-rules.html' class='block px-2 py-1 text-sm rounded-md hover:bg-purple-deep/10 text-purple-soft/70'>Правила РП</a>\n";
const insertFooter = "\n                        <li><a href='rp-rules.html' class='text-purple-soft/50 hover:text-purple-soft transition-colors'>Правила РП</a></li>\n";

// These regexes match the "Обзор правил" link in different navigation blocks.
const desktopRe = /(<a[^>]*href="rules\.html"[^>]*first:rounded-t-lg[^>]*>[^<]*Обзор[\s\S]*?<\/a>\s*)/i;
const mobileRe = /(<a[^>]*href="rules\.html"[^>]*px-2 py-1[^>]*>[^<]*Обзор[\s\S]*?<\/a>\s*)/i;
const footerRe = /(<li>\s*<a[^>]*href="rules\.html"[^>]*>[^<]*Обзор правил[^<]*<\/a>\s*<\/li>\s*)/i;

async function insertNav() {
  const entries = await fs.readdir(rootDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.html')) continue;

    const filePath = path.join(rootDir, entry.name);
    const content = await fs.readFile(filePath, 'utf-8');

    // Skip pages that already contain the target page (to avoid self-inserting)
    if (content.includes('rp-rules.html') && entry.name !== 'rules.html') continue;

    let updated = content;
    updated = updated.replace(desktopRe, `$1${insertDesktop}`);
    updated = updated.replace(mobileRe, `$1${insertMobile}`);
    updated = updated.replace(footerRe, `$1${insertFooter}`);

    if (updated !== content) {
      await fs.writeFile(filePath, updated, 'utf-8');
      console.log(`Updated: ${entry.name}`);
    }
  }

  console.log('Done.');
}

insertNav().catch(err => {
  console.error('Failed:', err);
  process.exit(1);
});
