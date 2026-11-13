/**
 * 插件自己的持久化：非敏感设置（JSON）与追加式审计日志（JSONL）。
 * 秘密不写这里 —— 主密码与会话密钥走 ctx.credentials。
 */
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

export function resolveDataDir(override) {
  const dir = override && String(override).trim()
    ? path.resolve(String(override).trim())
    : path.join(process.env.DSH_HOME || path.join(os.homedir(), '.dsh'), 'bitwarden')
  mkdirSync(dir, { recursive: true })
  return dir
}

const DEFAULTS = {
  serverUrl: '',
  email: '',
  idleLockMinutes: 15,
  autoUnlock: true,
  auditEnabled: true,
  lastSyncAt: null,
  lastLoginAt: null,
}

export class Store {
  constructor(dataDir) {
    this.dataDir = dataDir
    this.settingsPath = path.join(dataDir, 'settings.json')
    this.auditPath = path.join(dataDir, 'audit.jsonl')
    this.settings = this.#readSettings()
  }

  #readSettings() {
    try {
      const raw = readFileSync(this.settingsPath, 'utf8')
      const parsed = JSON.parse(raw)
      return { ...DEFAULTS, ...(parsed && typeof parsed === 'object' ? parsed : {}) }
    } catch {
      return { ...DEFAULTS }
    }
  }

  get() {
    return { ...this.settings }
  }

  patch(next) {
    this.settings = { ...this.settings, ...next }
    writeFileSync(this.settingsPath, `${JSON.stringify(this.settings, null, 2)}\n`, 'utf8')
    return this.get()
  }

  /** 追加一条审计记录。永不抛错：审计失败不能拖垮密码操作。 */
  audit(entry) {
    if (!this.settings.auditEnabled) return
    try {
      const line = JSON.stringify({ at: new Date().toISOString(), ...entry })
      appendFileSync(this.auditPath, `${line}\n`, 'utf8')
    } catch {
      /* 审计写入失败时保持静默，调用方不因此失败 */
    }
  }

  /** 读取最近 n 条审计（倒序）。 */
  auditTail(limit = 100) {
    try {
      const raw = readFileSync(this.auditPath, 'utf8')
      const lines = raw.split('\n').filter(Boolean)
      const picked = lines.slice(-Math.max(1, limit))
      return picked
        .map((line) => {
          try { return JSON.parse(line) } catch { return null }
        })
        .filter(Boolean)
        .reverse()
    } catch {
      return []
    }
  }
}
