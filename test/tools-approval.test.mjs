// 批准门：bitwarden_use 要 ask，其它工具直接放行，开关关掉时也放行。
import test from 'node:test'
import assert from 'node:assert/strict'
import { registerTools } from '../lib/tools.js'

/** 造一个够用的假 ctx：收集注册的工具和 pre-execute 监听器。 */
function fakeCtx({ requireApproval = true } = {}) {
  const tools = []
  const listeners = []
  const ctx = {
    tools: {
      register: (definition) => { tools.push(definition); return () => {} },
      guard: () => () => {},
    },
    on: (event, listener) => {
      if (event === 'tools/pre-execute') listeners.push(listener)
      return () => {}
    },
    get: () => undefined,
  }
  const manager = { store: { get: () => ({ requireApproval, auditEnabled: true }) } }
  return { ctx, manager, tools, listeners }
}

const next = async () => ({ kind: 'allow' })

test('bitwarden_use 默认要求批准', async () => {
  const { ctx, manager, listeners } = fakeCtx()
  registerTools(ctx, manager, { info() {} })
  assert.equal(listeners.length, 1, '应该挂了一个 pre-execute 监听器')
  const decision = await listeners[0]({ name: 'bitwarden_use', arguments: { itemId: 'abc' } }, next)
  assert.equal(decision.kind, 'ask')
  assert.match(decision.reason, /abc/)
  assert.ok(decision.displayReason.zh && decision.displayReason.en, '提示要双语')
})

test('批准提示里不带命令原文（命令可能写进了密码）', async () => {
  const { ctx, manager, listeners } = fakeCtx()
  registerTools(ctx, manager, { info() {} })
  const decision = await listeners[0](
    { name: 'bitwarden_use', arguments: { itemId: 'abc', command: 'mysql -p"hunter2" -e "select 1"' } },
    next,
  )
  assert.doesNotMatch(JSON.stringify(decision), /hunter2/)
})

test('关掉开关后放行，其它工具也放行', async () => {
  const off = fakeCtx({ requireApproval: false })
  registerTools(off.ctx, off.manager, { info() {} })
  assert.deepEqual(await off.listeners[0]({ name: 'bitwarden_use', arguments: {} }, next), { kind: 'allow' })

  const on = fakeCtx()
  registerTools(on.ctx, on.manager, { info() {} })
  assert.deepEqual(await on.listeners[0]({ name: 'bitwarden_search', arguments: {} }, next), { kind: 'allow' })
})

test('六个工具都注册上了，且没有取密码的工具', () => {
  const { ctx, manager, tools } = fakeCtx()
  registerTools(ctx, manager, { info() {} })
  const names = tools.map((tool) => tool.name).sort()
  assert.deepEqual(names, [
    'bitwarden_create',
    'bitwarden_folders',
    'bitwarden_search',
    'bitwarden_status',
    'bitwarden_update',
    'bitwarden_use',
  ])
})
