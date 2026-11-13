/**
 * dsh-bitwarden —— DeepSeek Harness 的 Bitwarden / Vaultwarden 密码库连接器。
 *
 * 分工：
 *   lib/engine.js   bw CLI 进程驱动（认证与解密全交给官方 CLI）
 *   lib/manager.js  状态机与策略（脱敏、审计、自动锁、使用密码通道）
 *   lib/tools.js    面向 AI 的工具面（无明文）
 *   lib/rpc.js      面向浏览器设置页的 RPC（唯一允许 reveal 的通道）
 *   client/         设置 → 密码库 页面
 */
import { Store, resolveDataDir } from './lib/store.js'
import { VaultManager } from './lib/manager.js'
import { registerTools } from './lib/tools.js'
import { installRpc } from './lib/rpc.js'

export const name = 'dsh-bitwarden'

export const inject = ['tools', 'connection', 'webServer']

const IDLE_TICK_MS = 30_000

export function apply(ctx, config = {}) {
  const log = console
  const dataDir = resolveDataDir(config?.dataDir ?? process.env.DSH_BITWARDEN_DATA_DIR)
  const store = new Store(dataDir)
  const manager = new VaultManager({ ctx, store, dataDir, log })

  let disposeTools = () => {}
  let disposeRpc = () => {}

  try {
    disposeTools = registerTools(ctx, manager, log)
  } catch (error) {
    log.error?.('[dsh-bitwarden] 工具注册失败', error)
  }

  try {
    disposeRpc = installRpc(ctx, manager, log)
  } catch (error) {
    log.warn?.('[dsh-bitwarden] RPC 挂载失败', error)
  }

  // 空闲自动锁定：到点就把会话密钥丢掉并 bw lock。
  const idleTimer = setInterval(() => {
    try {
      if (manager.sessionKey && manager.isIdleExpired()) {
        manager.lock().catch((error) => log.warn?.('[dsh-bitwarden] 自动锁定失败', error))
      }
    } catch (error) {
      log.warn?.('[dsh-bitwarden] 自动锁定检查失败', error)
    }
  }, IDLE_TICK_MS)
  idleTimer.unref?.()

  ctx.effect(() => () => {
    clearInterval(idleTimer)
    try { disposeRpc() } catch { /* 已清理 */ }
    try { disposeTools() } catch { /* 已清理 */ }
    manager.sessionKey = null
  })

  log.info?.(`[dsh-bitwarden] 已启动，数据目录：${dataDir}`)
}
