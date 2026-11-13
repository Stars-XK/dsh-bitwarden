/**
 * HTTP 端点：只服务本机浏览器里「设置 → 密码库」页面。
 *
 * 不用 connection.rpc.handle —— 它在本版本的激活路径里没把物理路由挂到 webServer 上，
 * 请求会落到静态路由兜底（405）。这里自己挂一个 prefix 路由，并用
 * connection.requestRejection 复用 DSH 自己的浏览器认证/来源栅栏。
 *
 * 这里是唯一允许返回密码明文的地方（reveal），因为浏览器页面属于「主人」本人，
 * 结果不进会话日志、不进模型上下文。AI 的工具面走 lib/tools.js，两者互不复用。
 */
const ROUTE = '/dsh-bitwarden'
const MAX_BODY = 4 * 1024 * 1024

const ok = (value) => ({ ok: true, value })
const fail = (code, message) => ({
  ok: false,
  error: { code, message, details: code === 'bad-request' ? { issues: [{ message }] } : {} },
})

const TYPE_CODES = { login: 1, note: 2, card: 3, identity: 4 }

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > MAX_BODY) {
        reject(new Error('请求体过大'))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

export function installRpc(ctx, manager, log = console) {
  const webServer = ctx.get('webServer')
  const connection = ctx.get('connection')
  if (!webServer || typeof webServer.register !== 'function') {
    log.warn?.('[dsh-bitwarden] 当前 profile 没有 webServer，设置页将无法加载数据。')
    return () => {}
  }

  const handler = async (endpoint, payload) => {
    switch (endpoint) {
      case 'status':
        return ok(await manager.status())

      case 'connect': {
        const input = payload ?? {}
        return ok(await manager.connect({
          serverUrl: input.serverUrl,
          email: input.email,
          password: input.password,
          remember: input.remember !== false,
        }))
      }

      case 'unlock': {
        const input = payload ?? {}
        if (!input.password) return fail('bad-request', '请填写主密码。')
        return ok(await manager.unlockWithPassword(input.password))
      }

      case 'unlockSaved':
        return ok(await manager.unlockWithSaved())

      case 'lock':
        return ok(await manager.lock())

      case 'sync':
        return ok(await manager.sync())

      case 'list': {
        const input = payload ?? {}
        const type = input.type && input.type !== 'all' ? TYPE_CODES[input.type] : undefined
        const items = await manager.listMeta({ search: input.query || undefined, type, limit: 500 })
        return ok({ count: items.length, items })
      }

      case 'reveal': {
        const input = payload ?? {}
        return ok(await manager.revealItem(input.id))
      }

      case 'folders':
        return ok(await manager.listFolders())

      case 'create': {
        const input = payload ?? {}
        return ok(await manager.createLogin(input))
      }

      case 'update': {
        const input = payload ?? {}
        if (!input.id) return fail('bad-request', '缺少条目 id。')
        return ok(await manager.updateLogin(input.id, input.patch ?? {}))
      }

      case 'delete': {
        const input = payload ?? {}
        if (!input.id) return fail('bad-request', '缺少条目 id。')
        return ok(await manager.deleteItem(input.id))
      }

      case 'settings':
        return ok({ ...manager.store.get(), dataDir: manager.dataDir })

      case 'saveSettings': {
        const input = payload ?? {}
        const next = {}
        if (typeof input.idleLockMinutes === 'number') next.idleLockMinutes = Math.max(0, Math.min(240, input.idleLockMinutes))
        if (typeof input.autoUnlock === 'boolean') next.autoUnlock = input.autoUnlock
        if (typeof input.auditEnabled === 'boolean') next.auditEnabled = input.auditEnabled
        return ok(manager.store.patch(next))
      }

      case 'audit': {
        const input = payload ?? {}
        return ok({ entries: manager.auditTail(Math.max(1, Math.min(500, Number(input.limit) || 100))) })
      }

      case 'forgetMaster': {
        await manager.forgetMasterPassword()
        return ok({ forgotten: true })
      }

      default:
        return fail('bad-request', `未知端点：${endpoint}`)
    }
  }

  const route = {
    kind: 'prefix',
    path: ROUTE,
    handler: async (req, res) => {
      let rejection
      if (connection && typeof connection.requestRejection === 'function') {
        try { rejection = connection.requestRejection(req) } catch { rejection = 403 }
      } else {
        rejection = 403
      }
      if (rejection !== undefined) {
        res.writeHead(rejection, { 'content-type': 'text/plain; charset=utf-8' })
        res.end(rejection === 401 ? 'unauthorized' : 'forbidden')
        return
      }
      if (req.method !== 'POST') {
        res.writeHead(405, { 'content-type': 'text/plain; charset=utf-8' })
        res.end('method not allowed')
        return
      }

      let body
      try {
        body = JSON.parse(await readBody(req))
      } catch (error) {
        res.writeHead(400, { 'content-type': 'application/json; charset=utf-8' })
        res.end(JSON.stringify(fail('bad-request', `请求体不是合法 JSON：${error?.message ?? error}`)))
        return
      }

      const endpoint = typeof body?.endpoint === 'string' ? body.endpoint : ''
      const payload = body?.payload ?? {}
      if (!endpoint) {
        res.writeHead(400, { 'content-type': 'application/json; charset=utf-8' })
        res.end(JSON.stringify(fail('bad-request', '缺少 endpoint。')))
        return
      }

      try {
        const result = await handler(endpoint, payload)
        res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
        res.end(JSON.stringify(result))
      } catch (error) {
        const message = error?.message ?? String(error)
        log.warn?.(`[dsh-bitwarden] rpc ${endpoint} 失败：${message}`)
        res.writeHead(200, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' })
        res.end(JSON.stringify(fail('bad-request', message)))
      }
    },
  }

  const registered = webServer.register(route)
  const cleanup = () => {
    if (typeof registered === 'function') {
      try { registered() } catch { /* 已清理 */ }
      return
    }
    if (registered && typeof registered.then === 'function') {
      registered.then((dispose) => {
        if (typeof dispose === 'function') {
          try { dispose() } catch { /* 已清理 */ }
        }
      }).catch(() => { /* 忽略 */ })
    }
  }

  log.info?.(`[dsh-bitwarden] HTTP 端点已挂载：${ROUTE}`)
  return cleanup
}

export { ROUTE }
