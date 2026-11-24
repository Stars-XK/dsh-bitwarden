/**
 * 插件自己的持久化：非敏感设置（JSON）与追加式审计日志（JSONL）。
 * 秘密不写这里 —— 主密码与会话密钥走 ctx.credentials。
 */
import { appendFileSync, mkdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs'
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
  /** bitwarden_use 每次执行前要主人批准：工具能跑任意 shell 且带密码，默认拦一道。 */
  requireApproval: true,
  lastSyncAt: null,
  lastLoginAt: null,
}

/** 审计日志轮转阈值：超过就切成 audit.jsonl.1，只留一份上一代。 */
const AUDIT_MAX_BYTES = 2 * 1024 * 1024

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
    // 先写临时文件再 rename：进程中途退出时不会留下半截 JSON，把设置读坏
    const tmp = `${this.settingsPath}.tmp`
    writeFileSync(tmp, `${JSON.stringify(this.settings, null, 2)}\n`, 'utf8')
    renameSync(tmp, this.settingsPath)
    return this.get()
  }

  /** 追加一条审计记录。永不抛错：审计失败不能拖垮密码操作。 */
  audit(entry) {
    if (!this.settings.auditEnabled) return
    try {
      this.#rotateAudit()
      const line = JSON.stringify({ at: new Date().toISOString(), ...entry })
      appendFileSync(this.auditPath, `${line}\n`, 'utf8')
    } catch {
      /* 审计写入失败时保持静默，调用方不因此失败 */
    }
  }

  /** 超过阈值就把当前日志挪成 .1（覆盖上一代），避免无限增长。 */
  #rotateAudit() {
    try {
      if (statSync(this.auditPath).size < AUDIT_MAX_BYTES) return
      const previous = `${this.auditPath}.1`
      rmSync(previous, { force: true })
      renameSync(this.auditPath, previous)
    } catch {
      /* 文件还不存在：第一次写入 */
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
