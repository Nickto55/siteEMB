import json
import os
import re
from pathlib import Path
from bs4 import BeautifulSoup

PUBLIC_DIR = Path(__file__).parent.parent / 'public'
EXCLUDE = {'admin-panel.html', 'content-manager-demo.html', 'login.html', 'dashboard.html', 'ticket-status.html'}
BACKUP_DIR = PUBLIC_DIR / 'original-backup'

PLACEHOLDER = '''<div id="dynamic-content" class="min-h-[50vh] flex items-center justify-center transition-opacity duration-300 opacity-0" data-page-content="true">
    <div class="text-center">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white/50"></div>
        <p class="mt-2 text-gray-400 text-sm">Загрузка контента...</p>
    </div>
</div>'''

def transform_file(filename: str) -> dict | None:
    filepath = PUBLIC_DIR / filename
    html = filepath.read_text(encoding='utf-8')
    soup = BeautifulSoup(html, 'html.parser')

    # Уже преобразован?
    dynamic = soup.find(id='dynamic-content')
    if dynamic and dynamic.get('data-page-content') == 'true':
        print(f"  SKIP {filename} already transformed")
        return None

    main = soup.find('main')
    if not main:
        print(f"  WARN {filename}: no <main>, skipping")
        return None

    # Извлечь контент для БД
    page_content = str(main.decode_contents())

    # Добавить inline-скрипты после <main> в <body> (страничные скрипты)
    body = soup.find('body')
    if body:
        found_main = False
        for child in body.children:
            if child is main:
                found_main = True
                continue
            if found_main and getattr(child, 'name', None) == 'script':
                src = child.get('src')
                if src in ('script.js', '/script.js'):
                    continue
                page_content += str(child)

    # Удалить inline-скрипты после <main> из body (они пойдут в БД)
    # Внешние скрипты (src) оставляем в шаблоне, так как это обычно общие скрипты
    if body:
        found_main = False
        to_remove = []
        for child in list(body.children):
            if child is main:
                found_main = True
                continue
            if found_main and getattr(child, 'name', None) == 'script':
                # Если это inline скрипт (без src) — удаляем, он страничный
                if not child.get('src'):
                    to_remove.append(child)
                # Если src указывает на script.js — оставляем (общий скрипт)
                elif child.get('src') in ('script.js', '/script.js'):
                    continue
                else:
                    to_remove.append(child)
        for script in to_remove:
            script.decompose()

    # Заменить innerHTML <main>
    main.clear()
    main.append(BeautifulSoup(PLACEHOLDER, 'html.parser'))

    # Добавить content-manager.js
    has_manager = any(
        tag.get('src') in ('content-manager.js', '/content-manager.js')
        for tag in soup.find_all('script')
    )
    if not has_manager:
        new_script = soup.new_tag('script', src='content-manager.js', defer='')
        body.append(new_script)

    # Сохранить бэкап
    BACKUP_DIR.mkdir(exist_ok=True)
    (BACKUP_DIR / filename).write_text(html, encoding='utf-8')

    # Сохранить преобразованный файл
    filepath.write_text(str(soup), encoding='utf-8')
    print(f"  OK {filename} transformed")

    title_tag = soup.find('title')
    page_title = title_tag.get_text(strip=True) if title_tag else filename.replace('.html', '')
    page_name = filename.replace('.html', '')

    return {
        'page_name': page_name,
        'title': page_title,
        'content': page_content
    }

def main():
    print("[TRANSFORM] Starting page transformation...\n")
    files = sorted(f for f in os.listdir(PUBLIC_DIR) if f.endswith('.html') and f not in EXCLUDE)

    exported = {}
    for filename in files:
        data = transform_file(filename)
        if data:
            exported[data['page_name']] = data

    # Сохранить экспорт для БД
    export_path = PUBLIC_DIR / 'content_export.json'
    export_path.write_text(json.dumps(exported, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f"\n[EXPORT] Content export saved: {export_path}")
    print(f"[BACKUP] Original backups: {BACKUP_DIR}")
    print(f"[DONE] Transformation complete: {len(exported)} files")

if __name__ == '__main__':
    main()
