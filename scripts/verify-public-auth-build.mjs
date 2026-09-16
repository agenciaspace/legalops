import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

const directory = process.argv[2] || '.open-next/assets/_next/static/chunks'
async function chunks(dir) {
  const files = await readdir(dir, { withFileTypes: true })
  return (await Promise.all(files.map(file => file.isDirectory()
    ? chunks(path.join(dir, file.name))
    : file.name.endsWith('.js') ? readFile(path.join(dir, file.name), 'utf8') : ''))).join('\n')
}
const code = await chunks(directory)
for (const name of ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY']) {
  if (code.includes(`.env.${name}`)) throw new Error(`Browser auth build has unresolved ${name}`)
  const value = process.env[name]
  if (!value || !code.includes(value)) throw new Error(`Browser auth build is missing ${name}`)
}
console.log('Browser auth configuration is embedded in the published JavaScript.')
