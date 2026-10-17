from pathlib import Path
p=Path(__file__).parent/'site'
for route,title in [('','Club'),('community','Comunidade'),('brand','Identidade'),('news','News'),('news/leitura','Leitura')]:
 d=p/route;d.mkdir(parents=True,exist_ok=True)
 favicon='favicon.svg' if route.startswith('news') else 'club-favicon.svg'
 theme='#171813' if route.startswith('news') else '#f5f1e8'
 (d/'index.html').write_text(f'''<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="description" content="Preview completo das propostas de identidade para legalops.club e legalops.news."><meta name="theme-color" content="{theme}"><title>{title} · legalops / preview de identidade</title><link rel="icon" href="/assets/{favicon}" type="image/svg+xml"><link rel="stylesheet" href="/assets/style.css"><script src="/assets/app.js" defer></script></head><body><a class="skip-link" href="#main">Pular para o conteúdo</a><div id="app"></div><dialog id="dialog" aria-labelledby="dialog-title"></dialog><div id="toast" class="toast" role="status" aria-live="polite"></div><noscript>Ative o JavaScript para explorar este preview interativo. Os sites atuais estão em <a href="https://legalops.club">legalops.club</a> e <a href="https://legalops.news">legalops.news</a>.</noscript></body></html>''')
(p/'404.html').write_text('<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Página não encontrada</title><h1>Esta página não faz parte do preview.</h1><a href="/">Voltar ao Club</a></html>')
