from pathlib import Path

assets = Path(__file__).parent / 'site/assets'
# Native vector assets: typography remains editable and uses the bundled Archivo Black font.
mark = '<rect x="3" y="3" width="20" height="20" rx="7"/><rect x="13" y="13" width="20" height="20" rx="7"/>'
(assets / 'club-favicon.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><rect width="48" height="48" rx="12" fill="#e88a6a"/><g transform="translate(6 6)" fill="none" stroke="#111111" stroke-width="2.5">{mark}</g></svg>')
(assets / 'club-social.svg').write_text('''<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080">
<title>legalops.club — Edição Club</title>
<rect width="1080" height="1080" fill="#f5f1e8"/>
<text x="65" y="67" font-family="monospace" font-size="17" fill="#111111">LEGAL OPS, TECNOLOGIA &amp; PESSOAS</text>
<path d="M65 89H1015" stroke="#111111"/>
<text x="60" y="210" font-family="Archivo Black, sans-serif" font-size="110" font-weight="400" letter-spacing="-7" fill="#111111">legalops<tspan fill="#a94e38">.</tspan>club</text>
<path d="M65 253H1015" stroke="#111111" stroke-width="5"/>
<text x="65" y="300" font-family="monospace" font-size="17" fill="#111111">EM COMUNIDADE / LEGALOPS.CLUB</text>
<rect x="65" y="349" width="950" height="578" fill="#e88a6a"/>
<g font-family="Space Grotesk, sans-serif" font-size="133" font-weight="700" letter-spacing="-7" fill="#111111"><text x="100" y="520">O jurídico</text><text x="100" y="680">se move</text><text x="100" y="840">junto.</text></g>
<path d="M65 958H1015" stroke="#111111"/>
<text x="65" y="1003" font-family="monospace" font-size="17" fill="#111111">PESSOAS, IDEIAS E PRÓXIMOS PASSOS.</text>
</svg>''')
