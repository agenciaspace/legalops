import { readFile, writeFile } from 'node:fs/promises'

const source = new URL('../design/legalops.css', import.meta.url)
const target = new URL('../cloudflare-landing/design-system.css', import.meta.url)
const css = await readFile(source, 'utf8')
if (process.argv.includes('--check')) {
  const current = await readFile(target, 'utf8').catch(() => '')
  if (current !== css) {
    console.error('Atualize a cópia do Dev com npm run design:sync.')
    process.exitCode = 1
  }
} else {
  await writeFile(target, css)
}
