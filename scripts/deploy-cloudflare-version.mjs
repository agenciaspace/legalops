// Publish the exact built version through the Work/Club routes already configured.
// Route/domain changes are infrastructure operations: `wrangler triggers deploy`.
import { spawnSync } from 'node:child_process'

const uploaded = spawnSync('npx', ['opennextjs-cloudflare', 'upload'], {
  encoding: 'utf8', stdio: ['inherit', 'pipe', 'inherit'], maxBuffer: 16 * 1024 * 1024,
})
process.stdout.write(uploaded.stdout || '')
if (uploaded.error) throw uploaded.error
if (uploaded.status !== 0) process.exit(uploaded.status || 1)
const plain = uploaded.stdout.replace(/\x1b\[[0-9;]*m/g, '')
const versions = [...plain.matchAll(/^Worker Version ID:\s*([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})\s*$/gm)]
if (versions.length !== 1) throw new Error('Upload did not return exactly one Worker version; refusing deployment.')
const published = spawnSync('npx', ['wrangler', 'versions', 'deploy', `${versions[0][1]}@100%`, '--yes', '--message', `Git ${process.env.GITHUB_SHA || 'local build'}`], { stdio: 'inherit' })
if (published.error) throw published.error
process.exit(published.status || (published.signal ? 1 : 0))
