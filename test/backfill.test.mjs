// 回填重试与错误标记：不需要真的密码库，用假的 @bitwarden/cli 驱动 engine.js。
import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, writeFile, copyFile, readFile } from 'node:fs/promises'
import path from 'node:path'

const here = import.meta.dirname

/**
 * 造一个隔离的运行目录：复制 lib/engine.js，并放一个假的 @bitwarden/cli。
 * engine.js 用 require.resolve 找 CLI，所以假包必须和它同一个 node_modules 树。
 */
async function sandbox(bwBody) {
  const dir = await mkdtemp(path.join(here, '.tmp-'))
  await copyFile(path.join(here, '..', 'lib', 'engine.js'), path.join(dir, 'engine.js'))
  const pkgDir = path.join(dir, 'node_modules', '@bitwarden', 'cli')
  await mkdir(path.join(pkgDir, 'build'), { recursive: true })
  await writeFile(path.join(pkgDir, 'package.json'), JSON.stringify({ name: '@bitwarden/cli', version: '0.0.0', bin: { bw: 'build/bw.js' } }))
  await writeFile(path.join(pkgDir, 'build', 'bw.js'), bwBody)
  return dir
}

const COUNTED_BW = `
const fs = require('fs')
const counter = process.env.FAKE_COUNTER
const args = process.argv.slice(2)
if (args[0] === 'unlock') {
  let n = 0
  try { n = Number(fs.readFileSync(counter, 'utf8')) || 0 } catch {}
  n += 1
  fs.writeFileSync(counter, String(n))
  if (n === 1) {
    process.stderr.write('ERROR bitwarden_core::backfill: KeyIdBackfillError: key id backfill failed (404)\\n')
    process.exit(1)
  }
  process.stdout.write('SESSION-OK\\n')
  process.exit(0)
}
if (args[0] === 'status') { process.stdout.write('{"status":"locked"}\\n'); process.exit(0) }
process.exit(0)
`

test('unlock 第一次撞上 KeyIdBackfillError 时自动重试一次并成功', async () => {
  const dir = await sandbox(COUNTED_BW)
  const counter = path.join(dir, 'counter')
  process.env.FAKE_COUNTER = counter
  const { unlock } = await import(path.join(dir, 'engine.js'))
  const key = await unlock({ cliHome: path.join(dir, 'home') }, 'pw')
  assert.equal(key, 'SESSION-OK')
  assert.equal(await readFile(counter, 'utf8'), '2', '应该只重试一次')
})

test('pickBwError 认得出回填错误，并保留标记', async () => {
  const dir = await sandbox(COUNTED_BW)
  const { pickBwError, isBackfillError } = await import(path.join(dir, 'engine.js'))
  assert.equal(isBackfillError('KeyIdBackfillError: boom'), true)
  assert.equal(isBackfillError('vault is locked'), false)
  const tagged = pickBwError({ stdout: '', stderr: 'ERROR bitwarden_core: KeyIdBackfillError\nbw failed hard' })
  assert.match(tagged, /^key_id_backfill: /, '标记要留在最前面，manager 才能自动重试')
  assert.doesNotMatch(pickBwError({ stdout: '', stderr: 'vault is locked' }), /key_id_backfill/)
})

test('非回填错误不会被掩盖', async () => {
  const dir = await sandbox(`
const args = process.argv.slice(2)
if (args[0] === 'unlock') { process.stderr.write('Master password is invalid.\\n'); process.exit(1) }
process.exit(0)
`)
  const { unlock } = await import(path.join(dir, 'engine.js'))
  await assert.rejects(() => unlock({ cliHome: path.join(dir, 'home') }, 'wrong'), /Master password is invalid/)
})
