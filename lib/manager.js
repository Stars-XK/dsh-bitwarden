/**
 * 密码库业务层：状态机 + 策略。
 *
 * 三条硬规则：
 * 1. 面向 AI 的元数据永不包含 password / notes / totp / fields。
 * 2. 主密码与会话密钥只走 ctx.credentials / 内存，不写设置文件。
 * 3. 每次访问都写审计；空闲超时自动 bw lock。
 */
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import * as bw from './engine.js'

const SCOPE = 'dsh-bitwarden'
const MASTER_KEY = `${SCOPE}/master`

/** Bitwarden item type：1 登录 / 2 安全笔记 / 3 银行卡 / 4 身份 */
export const ITEM_TYPE = { login: 1, note: 2, card: 3, identity: 4 }

/** 从 bw item 提取对 AI 安全的元数据 —— 这是唯一允许出仓的形状。 */
export function toMeta(item) {
  const login = item?.login ?? {}
  return {
    id: item?.id,
    type: item?.type,
    name: item?.name ?? '',
    username: login.username ?? undefined,
    uris: Array.isArray(login.uris) ? login.uris.map((u) => u?.uri).filter(Boolean) : [],
    favorite: Boolean(item?.favorite),
    folderId: item?.folderId ?? null,
    revisionDate: item?.revisionDate ?? null,
  }
}

export class VaultManager {
  constructor({ ctx, store, dataDir, log = console }) {
    this.ctx = ctx
    this.store = store
    this.log = log
    this.dataDir = dataDir
    this.engine = { cliHome: bw.ensureCliHome(dataDir) }
    this.sessionKey = null
    this.lastActivity = Date.now()
    this.lastError = null
    this.busy = false
  }

  get credentials() {
    return this.ctx.get('credentials')
  }

  touch() {
    this.lastActivity = Date.now()
  }

  idleMs() {
    const minutes = Number(this.store.get().idleLockMinutes) || 0
    return Math.max(0, minutes) * 60_000
  }

  isIdleExpired() {
    const limit = this.idleMs()
    return limit > 0 && Date.now() - this.lastActivity > limit
  }

  // ---- 凭据 -------------------------------------------------------------

  async readMasterPassword() {
    const credentials = this.credentials
    if (!credentials) return undefined
    try {
      const record = await credentials.readRecord(MASTER_KEY)
      if (record && record.kind === 'api-key' && typeof record.key === 'string' && record.key) {
        return record.key
      }
    } catch (error) {
      this.log.warn?.('[dsh-bitwarden] 读取主密码失败', error)
    }
    return undefined
  }

  async saveMasterPassword(password) {
    const credentials = this.credentials
    if (!credentials) throw new Error('当前 profile 没有 credentials 服务，无法保存主密码。')
    await credentials.modifyRecord(MASTER_KEY, async () => ({ kind: 'api-key', key: password }))
  }

  async forgetMasterPassword() {
    const credentials = this.credentials
    if (!credentials) return
    try { await credentials.deleteRecord(MASTER_KEY) } catch { /* 不存在即可 */ }
  }

  async hasMasterPassword() {
    const credentials = this.credentials
    if (!credentials) return false
    try {
      const info = await credentials.describeRecord(MASTER_KEY)
      return Boolean(info?.configured)
    } catch {
      return false
    }
  }

  // ---- 状态 -------------------------------------------------------------

  /** 给 UI 的状态快照（不含任何秘密）。 */
  async status() {
    const settings = this.store.get()
    let cliStatus = { status: 'unknown' }
    try {
      cliStatus = await bw.readStatus(this.engine)
    } catch (error) {
      this.lastError = error?.message ?? String(error)
    }
    const vaultStatus = this.sessionKey ? 'unlocked' : (cliStatus.status ?? 'unknown')
    return {
      status: vaultStatus,
      cliStatus: cliStatus.status ?? 'unknown',
      serverUrl: cliStatus.serverUrl || settings.serverUrl || '',
      email: cliStatus.userEmail || settings.email || '',
      lastSync: cliStatus.lastSync || settings.lastSyncAt || null,
      lastLoginAt: settings.lastLoginAt ?? null,
      idleLockMinutes: settings.idleLockMinutes,
      autoUnlock: settings.autoUnlock,
      auditEnabled: settings.auditEnabled,
      requireApproval: settings.requireApproval !== false,
      hasMasterPassword: await this.hasMasterPassword(),
      lastError: this.lastError,
      dataDir: this.dataDir,
      bwScript: (() => { try { return bw.resolveBwScript() } catch { return null } })(),
    }
  }

  // ---- 连接与解锁 -------------------------------------------------------

  async connect({ serverUrl, email, password, remember = true }) {
    const cleanUrl = String(serverUrl ?? '').trim()
    const cleanEmail = String(email ?? '').trim()
    const secret = String(password ?? '')
    if (!cleanEmail) throw new Error('请填写邮箱。')
    if (!secret) throw new Error('请填写主密码。')

    this.busy = true
    try {
      if (remember) await this.saveMasterPassword(secret)

      const current = await bw.readStatus(this.engine).catch(() => ({ status: 'unauthenticated' }))
      if (current?.status !== 'unauthenticated' && current?.userEmail && current.userEmail !== cleanEmail) {
        await bw.logout(this.engine).catch(() => {})
      }

      let key
      const alreadyLoggedIn = current?.status !== 'unauthenticated'
      if (alreadyLoggedIn && current?.userEmail === cleanEmail) {
        key = await bw.unlock(this.engine, secret)
      } else {
        key = await bw.login(this.engine, { email: cleanEmail, password: secret, serverUrl: cleanUrl })
      }
      this.sessionKey = key
      this.lastError = null
      this.touch()

      // 同步失败不能静默：以前这里 catch 掉一切还照写 lastSyncAt，界面会显示「已同步」
      let synced = false
      try {
        await bw.sync(this.engine, key)
        synced = true
      } catch (error) {
        this.lastError = `登录成功，但同步失败：${error?.message ?? error}`
      }
      this.store.patch({
        serverUrl: cleanUrl || current?.serverUrl || this.store.get().serverUrl,
        email: cleanEmail,
        lastLoginAt: new Date().toISOString(),
        ...(synced ? { lastSyncAt: new Date().toISOString() } : {}),
      })
      this.store.audit({ action: 'connect', account: cleanEmail, result: synced ? 'ok' : 'partial', message: synced ? undefined : this.lastError })
      return await this.status()
    } catch (error) {
      this.store.audit({ action: 'connect', account: cleanEmail, result: 'fail', message: error?.message })
      throw error
    } finally {
      this.busy = false
    }
  }

  async unlockWithPassword(password) {
    const key = await bw.unlock(this.engine, password)
    this.sessionKey = key
    this.lastError = null
    this.touch()
    this.store.audit({ action: 'unlock', result: 'ok' })
    return await this.status()
  }

  /** 用凭据存储里的主密码解锁（设置页一键解锁）。 */
  async unlockWithSaved() {
    const password = await this.readMasterPassword()
    if (!password) throw new Error('没有保存的主密码，请手动输入。')
    return await this.unlockWithPassword(password)
  }

  /** 惰性解锁：有会话直接用，会话失效再尝试主密码。 */
  async ensureUnlocked() {
    if (this.isIdleExpired()) await this.lock()
    if (this.sessionKey) return this.sessionKey

    const settings = this.store.get()
    if (!settings.autoUnlock) {
      throw new Error('密码库已锁定。请在设置 → 密码库 中解锁，或打开「自动解锁」。')
    }
    const password = await this.readMasterPassword()
    if (!password) {
      throw new Error('密码库已锁定，且没有保存主密码。请在设置 → 密码库 中解锁。')
    }
    const key = await bw.unlock(this.engine, password)
    this.sessionKey = key
    this.touch()
    this.store.audit({ action: 'auto-unlock', result: 'ok' })
    return key
  }

  /** 带会话执行：会话失效时重新解锁，旧服务器的回填失败则自动重试一次。 */
  async withSession(operation) {
    let key = await this.ensureUnlocked()
    try {
      return await operation(key)
    } catch (error) {
      const text = String(error?.message ?? error)
      if (bw.isLocked(text)) {
        this.sessionKey = null
        key = await this.ensureUnlocked()
        return await operation(key)
      }
      // 旧版 Vaultwarden 没有 key id 回填端点：解锁后第一个命令注定失败，
      // 这次失败同时写下 24h 冷却，重来一次就跳过回填了。
      if (bw.isBackfillError(text)) {
        this.store.audit({ action: 'backfill-retry', result: 'ok' })
        return await operation(key)
      }
      throw error
    } finally {
      this.touch()
    }
  }

  async lock() {
    this.sessionKey = null
    try { await bw.lock(this.engine) } catch { /* CLI 不在登录态时忽略 */ }
    this.store.audit({ action: 'lock', result: 'ok' })
    return await this.status()
  }

  async sync() {
    await this.withSession(async (key) => bw.sync(this.engine, key))
    this.store.patch({ lastSyncAt: new Date().toISOString() })
    this.store.audit({ action: 'sync', result: 'ok' })
    return await this.status()
  }

  // ---- 读取 -------------------------------------------------------------

  async listMeta({ search, type, limit = 200 } = {}) {
    const items = await this.withSession(async (key) => bw.listObjects(this.engine, key, 'items', search))
    const wanted = type === undefined || type === null ? null : Number(type)
    const metas = items
      .filter((item) => (wanted === null ? true : item?.type === wanted))
      .map(toMeta)
      .slice(0, Math.max(1, Math.min(1000, Number(limit) || 200)))
    return metas
  }

  /** 给浏览器 UI 的完整条目（含密码），绝不走工具面。 */
  async revealItem(id) {
    if (!id) throw new Error('缺少条目 id。')
    try {
      const item = await this.withSession(async (key) => bw.getItem(this.engine, key, id))
      // 成功之后才记 ok：先记后做会让失败也写着「已查看」，审计就没法用来排查了
      this.store.audit({ action: 'reveal', itemId: id, name: item?.name, result: 'ok' })
      return item
    } catch (error) {
      this.store.audit({ action: 'reveal', itemId: id, result: 'fail', message: error?.message })
      throw error
    }
  }

  async listFolders() {
    const folders = await this.withSession(async (key) => bw.folders(this.engine, key))
    return folders.map((folder) => ({ id: folder?.id, name: folder?.name ?? '' }))
  }

  // ---- 写入 -------------------------------------------------------------

  async createLogin({ name, username, password, uris, notes, folderId }) {
    if (!name || !String(name).trim()) throw new Error('请填写条目名称。')
    const login = {
      username: username ?? '',
      password: password ?? '',
      uris: Array.isArray(uris) && uris.length ? uris.map((uri) => ({ uri: String(uri) })) : [],
    }
    const item = {
      type: ITEM_TYPE.login,
      name: String(name).trim(),
      notes: notes ?? '',
      favorite: false,
      login,
    }
    if (folderId) item.folderId = folderId
    const created = await this.withSession(async (key) => bw.createItem(this.engine, key, item))
    this.store.audit({ action: 'create', itemId: created?.id, name: item.name, result: 'ok' })
    return toMeta(created)
  }

  async updateLogin(id, patch = {}) {
    if (!id) throw new Error('缺少条目 id。')
    const current = await this.withSession(async (key) => bw.getItem(this.engine, key, id))
    const next = { ...current }
    if (patch.name !== undefined) next.name = String(patch.name)
    if (patch.notes !== undefined) next.notes = String(patch.notes)
    if (patch.login || patch.username !== undefined || patch.password !== undefined || patch.uris !== undefined) {
      const login = { ...(current.login ?? {}) }
      if (patch.username !== undefined) login.username = String(patch.username)
      if (patch.password !== undefined) login.password = String(patch.password)
      if (patch.uris !== undefined) {
        login.uris = (Array.isArray(patch.uris) ? patch.uris : []).map((uri) => ({ uri: String(uri) }))
      }
      next.login = login
    }
    if (patch.folderId !== undefined) next.folderId = patch.folderId || null
    const saved = await this.withSession(async (key) => bw.editItem(this.engine, key, id, next))
    this.store.audit({ action: 'update', itemId: id, name: saved?.name, result: 'ok' })
    return toMeta(saved)
  }

  async deleteItem(id) {
    if (!id) throw new Error('缺少条目 id。')
    const current = await this.withSession(async (key) => bw.getItem(this.engine, key, id)).catch(() => null)
    await this.withSession(async (key) => bw.deleteItem(this.engine, key, id))
    this.store.audit({ action: 'delete', itemId: id, name: current?.name, result: 'ok' })
    return { id, deleted: true }
  }

  // ---- 「使用密码」通道 --------------------------------------------------

  /**
   * 用某条目的密码执行一条命令：密码只作为环境变量进入子进程，永远不返回。
   * 返回值里的密码字面量会被替换成 [REDACTED]。
   */
  async runWithSecret({ itemId, command, envName = 'BW_PASSWORD', cwd, timeoutMs = 120_000, signal }) {
    if (!itemId) throw new Error('缺少条目 id。')
    if (!command || !String(command).trim()) throw new Error('缺少要执行的命令。')
    const safeEnvName = /^[A-Za-z_][A-Za-z0-9_]*$/.test(String(envName)) ? String(envName) : 'BW_PASSWORD'

    const item = await this.withSession(async (key) => bw.getItem(this.engine, key, itemId))
    const secret = item?.login?.password ?? ''
    if (!secret) throw new Error('该条目没有密码字段。')

    // 审计要留命令原貌，但命令里可能被写进了密码字面量（`mysql -p'xxx'`）—— 落盘前替掉
    const auditCommand = redactCommand(command, secret)

    this.store.audit({
      action: 'use',
      itemId,
      name: item?.name,
      env: safeEnvName,
      command: auditCommand,
      result: 'start',
    })

    const result = await runCommand({
      command,
      cwd: cwd || this.dataDir,
      env: { [safeEnvName]: secret },
      timeoutMs,
      signal,
    })

    const scrub = (text) => (text && secret ? text.split(secret).join('[REDACTED]') : text)
    const payload = {
      exitCode: result.code,
      stdout: scrub(result.stdout),
      stderr: scrub(result.stderr),
      timedOut: result.timedOut,
      redacted: Boolean(result.stdout?.includes(secret) || result.stderr?.includes(secret)),
    }
    this.store.audit({
      action: 'use',
      itemId,
      name: item?.name,
      env: safeEnvName,
      command: auditCommand,
      result: result.code === 0 ? 'ok' : 'fail',
      exitCode: result.code,
    })
    return payload
  }

  auditTail(limit) {
    return this.store.auditTail(limit)
  }
}

/** 审计落盘前的命令脱敏：命令里可能被写进了密码字面量。 */
export function redactCommand(command, secret) {
  const text = String(command ?? '')
  return secret ? text.split(String(secret)).join('[REDACTED]') : text
}

/** 选一个真实存在的 POSIX shell：容器里 SHELL 常指向没装的 zsh，直接用会 spawn 失败。 */
function pickPosixShell() {
  for (const candidate of [process.env.SHELL, '/bin/bash', '/bin/sh']) {
    if (!candidate) continue
    try {
      if (existsSync(candidate)) return candidate
    } catch { /* 不可访问就试下一个 */ }
  }
  return '/bin/sh'
}

/** 用宿主 shell 跑一条命令，stdout/stderr 全量收集并限长。 */
function runCommand({ command, cwd, env, timeoutMs, signal }) {
  return new Promise((resolve, reject) => {
    const isWin = process.platform === 'win32'
    const shell = isWin ? (process.env.ComSpec || 'cmd.exe') : pickPosixShell()
    const args = isWin ? ['/d', '/s', '/c', command] : ['-c', command]
    let child
    try {
      child = spawn(shell, args, {
        cwd,
        env: { ...process.env, ...env },
        windowsHide: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      })
    } catch (error) {
      reject(error)
      return
    }
    const MAX = 1_000_000
    let stdout = ''
    let stderr = ''
    let truncatedOut = false
    let truncatedErr = false
    let timedOut = false
    let settled = false
    const finish = (fn) => { if (settled) return; settled = true; clearTimeout(timer); fn() }
    const timer = setTimeout(() => {
      timedOut = true
      try { child.kill('SIGKILL') } catch { /* 已退出 */ }
    }, Math.max(1000, Number(timeoutMs) || 120_000))
    const onAbort = () => { try { child.kill('SIGKILL') } catch { /* 已退出 */ } }
    if (signal) {
      if (signal.aborted) { onAbort(); }
      else signal.addEventListener('abort', onAbort, { once: true })
    }
    child.stdout.on('data', (chunk) => {
      if (stdout.length >= MAX) { truncatedOut = true; return }
      stdout += chunk.toString('utf8')
    })
    child.stderr.on('data', (chunk) => {
      if (stderr.length >= MAX) { truncatedErr = true; return }
      stderr += chunk.toString('utf8')
    })
    child.on('error', (error) => finish(() => reject(error)))
    child.on('close', (code) => finish(() => resolve({
      code: code ?? -1,
      // 截断要留痕，否则调用方以为命令只输出了这些
      stdout: truncatedOut ? `${stdout}\n…（输出超过 ${MAX} 字符，已截断）` : stdout,
      stderr: truncatedErr ? `${stderr}\n…（输出超过 ${MAX} 字符，已截断）` : stderr,
      timedOut,
      truncated: truncatedOut || truncatedErr,
    })))
  })
}


