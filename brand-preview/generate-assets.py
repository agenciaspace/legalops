from pathlib import Path

assets = Path(__file__).parent / 'site/assets'
# Native vector assets: typography remains editable and uses the bundled Archivo Black font.
mark = '<rect x="3" y="3" width="20" height="20" rx="7"/><rect x="13" y="13" width="20" height="20" rx="7"/>'
(assets / 'club-favicon.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="12" fill="#e88a6a"/><g transform="translate(6 6)" fill="none" stroke="#111111" stroke-width="2.5">{mark}</g></svg>')
(assets / 'club-social.svg').write_text(f'''<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
<title>legalops.club — Conexões</title>
<rect width="1080" height="1080" fill="#f5f1e8"/>
<g transform="translate(82 80) scale(1.5)" fill="none" stroke="#e88a6a" stroke-width="3">{mark}</g>
<text x="155" y="125" font-family="Archivo Black, sans-serif" font-size="43" font-weight="400" letter-spacing="-2" fill="#111111">legalops<tspan>.</tspan><tspan font-weight="400">club</tspan></text>
<g font-family="Archivo Black, sans-serif" font-size="104" font-weight="400" letter-spacing="-5" fill="#111111"><text x="80" y="415">seu próximo</text><text x="80" y="545">“e se?”</text><text x="80" y="675">começa aqui.</text></g>
<g transform="translate(710 690) scale(11)" fill="none" stroke="#e88a6a" stroke-width=".18" opacity=".4">{mark}</g>
<text x="85" y="978" font-family="sans-serif" font-size="16" letter-spacing="2" fill="#69635e">COMUNIDADE / LEGALOPS.CLUB</text>
</svg>''')
