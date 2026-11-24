// 本地存储：默认值、原子写、审计轮转、命令脱敏。全部离线，不碰真密码库。
import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, stat, writeFile, appendFile } from 'node:fs/promises'
import path from 'node:path'
import { Store } from '../lib/store.js'
import { redactCommand } from '../lib/manager.js'

const here = import.meta.dirname
const fresh = () => mkdtemp(path.join(here, '.tmp-'))

test('默认开启执行批准，审计默认开启', async () => {
  const store = new Store(await fresh())
  assert.equal(store.get().requireApproval, true)
  assert.equal(store.get().auditEnabled, true)
})

test('patch 走临时文件 + rename，读回来的就是完整 JSON', async () => {
  const dir = await fresh()
  const store = new Store(dir)
  store.patch({ idleLockMinutes: 42 })
  const raw = await readFile(path.join(dir, 'settings.json'), 'utf8')
  assert.equal(JSON.parse(raw).idleLockMinutes, 42)
  assert.equal(new Store(dir).get().idleLockMinutes, 42)
})

test('审计超过 2MB 时轮转成 .1，当前文件重新开始', async () => {
  const dir = await fresh()
  const store = new Store(dir)
  const auditPath = path.join(dir, 'audit.jsonl')
  await appendFile(auditPath, 'x'.repeat(2 * 1024 * 1024 + 10), 'utf8')
  store.audit({ action: 'reveal', result: 'ok' })
  const previous = await stat(`${auditPath}.1`)
  assert.ok(previous.size > 2 * 1024 * 1024, '旧日志应该被挪到 .1')
  const current = await readFile(auditPath, 'utf8')
  assert.equal(current.trim().split('\n').length, 1, '轮转后当前文件只有新的一条')
})

test('审计关闭时不写文件', async () => {
  const dir = await fresh()
  const store = new Store(dir)
  store.patch({ auditEnabled: false })
  store.audit({ action: 'use', result: 'ok' })
  await assert.rejects(() => stat(path.join(dir, 'audit.jsonl')))
})

test('命令里的密码字面量在落盘前被替换', async () => {
  assert.equal(redactCommand('mysql -p"hunter2" -e "show databases"', 'hunter2'), 'mysql -p"[REDACTED]" -e "show databases"')
  assert.equal(redactCommand('echo hello', ''), 'echo hello')
  assert.equal(redactCommand(undefined, 'x'), '')
})

test('损坏的 settings.json 回落到默认值，而不是抛错', async () => {
  const dir = await fresh()
  await writeFile(path.join(dir, 'settings.json'), '{ not json', 'utf8')
  const store = new Store(dir)
  assert.equal(store.get().idleLockMinutes, 15)
  assert.equal(store.get().requireApproval, true)
})
