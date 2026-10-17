// Native vector variants of the existing Conexoes brand mark.
const fs=require('fs'),path=require('path');
const {chromium}=require('/root/legalops-chat-app/node_modules/playwright');
const out=path.join(__dirname,'site/grupos'),assets=path.join(out,'assets');
fs.mkdirSync(assets,{recursive:true});
const font=fs.readFileSync(path.join(__dirname,'site/assets/archivo-black.ttf')).toString('base64');
const items=[
 ['comunidade','Comunidade','legalops.club','Principal','club','base'],
 ['avisos','Avisos','legalops.club · grupo de avisos','Conversas','announce','coral'],
 ['conversa','Conversa','legalops.club · conversa','Conversas','chat','base'],
 ['bench-enter','Bench Enter','Bench Enter','Bench','compare','dark'],
 ['bench-netlex','Bench Netlex','Bench Netlex','Bench','compare','dark'],
 ['cafe','Café','legalops.club - coffe club','Interesses','coffee','base'],
 ['corrida','Corrida','legalops.club - corrreeeeeeeeee','Interesses','run','coral'],
 ['podcast','Podcast','legalops.club - podcast','Interesses','mic','dark'],
 ['vinho','Vinho','legalops.club - wine club','Interesses','wine','base'],
 ['sao-paulo','São Paulo','legalops.club - São Paulo','Locais','SP','base'],
 ['curitiba','Curitiba','legalops.club · Curitiba','Locais','CWB','base'],
 ['fortaleza','Fortaleza','legalops.club · Fortaleza','Locais','FOR','base'],
 ['goiania','Goiânia','legalops.club · Goiânia','Locais','GYN','base'],
 ['usa','USA','legalops.club - usa','Locais','USA','base'],
].map(([slug,title,original,category,icon,tone])=>({slug,title,original,category,icon,tone}));
const icons={
 announce:'<path d="M4 10h5l11-5v20L9 20H4zM9 20l3 8h5l-3-6M24 10l4-3M25 16h5M24 22l4 3"/>',
 chat:'<path d="M4 5h24v17H16l-7 6v-6H4z"/><path d="M10 11h12M10 16h8"/>',
 compare:'<path d="M7 3v26M25 3v26M3 9h8M21 22h8M12 16h8M17 13l3 3-3 3"/>',
 coffee:'<path d="M5 10h18v10a7 7 0 0 1-7 7h-4a7 7 0 0 1-7-7zM23 12h3a5 5 0 0 1 0 10h-3M10 3v3M17 3v3M3 30h24"/>',
 run:'<circle cx="20" cy="5" r="3"/><path d="M9 12l6-3 6 8 7 1M16 10l-5 10 7 4-2 7M11 20l-7 8M3 14h4"/>',
 mic:'<rect x="11" y="2" width="10" height="19" rx="5"/><path d="M6 14v3a10 10 0 0 0 20 0v-3M16 27v4M10 31h12"/>',
 wine:'<path d="M8 2h16l2 11a10 10 0 0 1-20 0zM7 13h18M16 23v8M10 31h12"/>',
 club:''
};
function svg(item){const bg=item.tone==='dark'?'#111111':item.tone==='coral'?'#E88A6A':'#F5F1E8';const ink=item.tone==='dark'?'#F5F1E8':'#111111';const accent=item.tone==='coral'?'#111111':'#E88A6A';const glyph=icons[item.icon]===undefined?`<text x="661" y="569" text-anchor="middle" fill="${ink}" font-size="43" letter-spacing="-2">${item.icon}</text>`:icons[item.icon]?`<g transform="translate(625 513) scale(2.15)" fill="none" stroke="${ink}" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">${icons[item.icon]}</g>`:'';
 const lines=item.title.startsWith('Bench ')?['bench',item.title.slice(6).toLowerCase()]:[item.title.toLowerCase()]; const text=lines.map((line,i)=>`<text x="540" y="${lines.length===2?727+i*102:784}" text-anchor="middle" fill="${ink}" font-size="${lines.length===2?96:104}" letter-spacing="-6">${line}</text>`).join('');
 return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080"><title>legalops.club — ${item.title}</title><defs><style>@font-face{font-family:Brand;src:url(data:font/ttf;base64,${font})}text{font-family:Brand,sans-serif}</style></defs><rect width="1080" height="1080" fill="${bg}"/><g transform="translate(270 142) scale(15)" fill="none" stroke="${accent}" stroke-width="3"><rect x="3" y="3" width="20" height="20" rx="7"/><rect x="13" y="13" width="20" height="20" rx="7"/></g>${glyph}${text}<text x="540" y="910" text-anchor="middle" fill="${ink}" font-size="45" letter-spacing="-2.5">legalops<tspan fill="${accent}">.</tspan>club</text></svg>`;
}
(async()=>{const browser=await chromium.launch({args:['--no-sandbox']});const p=await browser.newPage({viewport:{width:1080,height:1080},deviceScaleFactor:1});for(const item of items){const source=svg(item);fs.writeFileSync(path.join(assets,item.slug+'.svg'),source);await p.setContent(`<style>body{margin:0}svg{display:block}</style>${source}`);await p.evaluate(()=>document.fonts.ready);await p.screenshot({path:path.join(assets,item.slug+'.png')});}await browser.close();fs.writeFileSync(path.join(out,'groups.json'),JSON.stringify(items,null,2));console.log(`Rendered ${items.length} PNG + SVG logo previews`);})();
