/**
 * bw CLI 引擎层。
 *
 * 只做一件事：把 `@bitwarden/cli` 当成一个无状态子进程驱动器来用。
 * - 认证与解密全部交给 bw（不在插件里实现 KDF / EncString）
 * - CLI 的 HOME 重定向到插件自己的数据目录，不污染用户默认的 Bitwarden CLI 状态
 * - session key 由调用方（manager）持有，这里从不落盘
 */
import { spawn } from 'node:child_process'
import { createRequire } from 'node:module'
import { mkdirSync } from 'node:fs'
import path from 'node:path'

const require = createRequire(import.meta.url)

let cachedBwScript = null

/** 定位 @bitwarden/cli 的可执行脚本（package 的 bin 指向 build/bw.js）。 */
export function resolveBwScript() {
  if (cachedBwScript) return cachedBwScript
  let pkgPath
  try {
    pkgPath = require.resolve('@bitwarden/cli/package.json')
  } catch (error) {
    throw new Error(
      `找不到 @bitwarden/cli，请确认插件依赖已安装（npm install）。原始错误：${error?.message ?? error}`,
    )
  }
  const pkgRoot = path.dirname(pkgPath)
  const pkg = require(pkgPath)
  const bin = typeof pkg.bin === 'string' ? pkg.bin : pkg.bin?.bw
  cachedBwScript = path.resolve(pkgRoot, bin ?? 'build/bw.js')
  return cachedBwScript
}

/** CLI 的进程级 HOME：让 bw 把 config/data 写进插件数据目录。 */
export function ensureCliHome(dataDir) {
  const cliHome = path.join(dataDir, 'cli-home')
  mkdirSync(path.join(cliHome, 'Library', 'Application Support'), { recursive: true })
  mkdirSync(path.join(cliHome, '.config'), { recursive: true })
  return cliHome
}

function stripAnsi(text) {
  // eslint-disable-next-line no-control-regex
  return String(text ?? '').replace(/\u001b\[[0-9;]*m/g, '')
}

/**
 * 执行一次 bw 命令。
 * @returns {Promise<{ code: number, stdout: string, stderr: string }>}
 */
export function execBw({ cliHome, args, env, timeoutMs = 60_000, signal, nodePath = process.execPath }) {
  const script = resolveBwScript()
  const childEnv = {
    ...process.env,
    HOME: cliHome,
    USERPROFILE: cliHome,
    BITWARDENCLI_NOINTERACTION: 'true',
    BW_NOINTERACTION: 'true',
    ...env,
  }
  // 清掉可能从 DSH 环境继承的会话，避免串号
  delete childEnv.BW_SESSION
  delete childEnv.BW_PASSWORD
  if (env?.BW_SESSION) childEnv.BW_SESSION = env.BW_SESSION
  if (env?.BW_PASSWORD) childEnv.BW_PASSWORD = env.BW_PASSWORD

  return new Promise((resolve, reject) => {
    let child
    try {
      child = spawn(nodePath, [script, ...args], {
        env: childEnv,
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
      })
    } catch (error) {
      reject(error)
      return
    }

    let stdout = ''
    let stderr = ''
    let settled = false
    const finish = (fn) => {
      if (settled) return
      settled = true
      if (timer) clearTimeout(timer)
      if (signal) signal.removeEventListener('abort', onAbort)
      fn()
    }
    const timer = setTimeout(() => {
      try { child.kill('SIGKILL') } catch { /* 已退出 */ }
      finish(() => reject(new Error(`bw ${args[0] ?? ''} 超时（${timeoutMs}ms）`)))
    }, timeoutMs)
    const onAbort = () => {
      try { child.kill('SIGKILL') } catch { /* 已退出 */ }
      finish(() => reject(new Error('bw 调用被取消')))
    }
    if (signal) {
      if (signal.aborted) { onAbort(); return }
      signal.addEventListener('abort', onAbort, { once: true })
    }

    child.stdout.on('data', (chunk) => { stdout += chunk })
    child.stderr.on('data', (chunk) => { stderr += chunk })
    child.on('error', (error) => finish(() => reject(error)))
    child.on('close', (code) => {
      finish(() => resolve({
        code: code ?? -1,
        stdout: stripAnsi(stdout),
        stderr: stripAnsi(stderr),
      }))
    })
  })
}

/** 从 bw 的错误输出里挑一行人类可读的说明。 */
export function pickBwError({ stdout, stderr }) {
  const lines = `${stderr}\n${stdout}`
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    // 过滤 SDK 内部日志：它们对用户没有意义，还会掩盖真正的原因
    .filter((line) => !/^ERROR\s+bitwarden_|ResponseContent|^\s*at /.test(line))
  const preferred = lines.find((line) =>
    /vault is locked|not logged in|invalid|error|failed|denied|unknown|username or password/i.test(line),
  )
  return preferred ?? lines[0] ?? 'bw 命令失败'
}

const NOT_LOGGED_IN = /not logged in|you are not logged in|unauthenticated/i
const LOCKED = /vault is locked|vault is not unlocked/i

export function isNotLoggedIn(text) {
  return NOT_LOGGED_IN.test(text)
}

export function isLocked(text) {
  return LOCKED.test(text)
}

/** bw status --raw → { serverUrl, lastSync, userEmail, userId, status } */
export async function readStatus(engine) {
  const out = await execBw({ ...engine, args: ['status'] })
  const text = out.stdout.trim() || out.stderr.trim()
  try {
    return JSON.parse(text)
  } catch {
    return { status: 'unknown', raw: text }
  }
}

/** 设置自建服务器地址。 */
export async function setServer(engine, serverUrl) {
  const out = await execBw({ ...engine, args: ['config', 'server', serverUrl] })
  if (out.code !== 0) throw new Error(pickBwError(out))
  return true
}

/**
 * 登录并返回 session key。
 *
 * 自建 Vaultwarden（尤其服务器版本落后于客户端）可能缺少新版客户端的
 * `user_crypto_management-key_id_backfill` 端点：CLI 会打一条 ERROR 日志并以非零码退出，
 * 但账号其实已经登录成功。所以非零退出时用 bw status 复核，已登录就继续解锁。
 */
export async function login(engine, { email, password, serverUrl }) {
  if (serverUrl) await setServer(engine, serverUrl)
  const out = await execBw({
    ...engine,
    args: ['login', email, '--passwordenv', 'BW_PASSWORD', '--raw'],
    env: { BW_PASSWORD: password },
    timeoutMs: 120_000,
  })
  const key = out.stdout.trim()
  if (out.code === 0 && key) return key

  const status = await readStatus(engine).catch(() => ({ status: 'unauthenticated' }))
  if (status?.status && status.status !== 'unauthenticated') {
    // 已登录：补一次 unlock 拿会话密钥（不追加密码到错误信息里）
    return await unlock(engine, password)
  }
  throw new Error(pickBwError(out))
}

/** 解锁并返回新的 session key。 */
export async function unlock(engine, password) {
  const out = await execBw({
    ...engine,
    args: ['unlock', '--passwordenv', 'BW_PASSWORD', '--raw'],
    env: { BW_PASSWORD: password },
    timeoutMs: 120_000,
  })
  if (out.code !== 0) throw new Error(pickBwError(out))
  const key = out.stdout.trim()
  if (!key) throw new Error('解锁没有返回会话密钥。')
  return key
}

export async function lock(engine) {
  const out = await execBw({ ...engine, args: ['lock'] })
  return out.code === 0
}

export async function logout(engine) {
  const out = await execBw({ ...engine, args: ['logout'] })
  return out.code === 0
}

export async function sync(engine, session) {
  const out = await execBw({ ...engine, args: ['sync'], env: { BW_SESSION: session }, timeoutMs: 180_000 })
  if (out.code !== 0) throw new Error(pickBwError(out))
  return true
}

/** 列表：items / folders。返回解析后的 JSON。 */
export async function listObjects(engine, session, object, search) {
  const args = ['list', object, '--raw']
  if (search) args.push('--search', search)
  const out = await execBw({ ...engine, args, env: { BW_SESSION: session } })
  if (out.code !== 0) throw new Error(pickBwError(out))
  const text = out.stdout.trim()
  if (!text) return []
  const parsed = JSON.parse(text)
  return Array.isArray(parsed) ? parsed : []
}

export async function getItem(engine, session, id) {
  const out = await execBw({ ...engine, args: ['get', 'item', id, '--raw'], env: { BW_SESSION: session } })
  if (out.code !== 0) throw new Error(pickBwError(out))
  return JSON.parse(out.stdout)
}

export async function createItem(engine, session, item) {
  const encoded = Buffer.from(JSON.stringify(item), 'utf8').toString('base64')
  const out = await execBw({ ...engine, args: ['create', 'item', encoded, '--raw'], env: { BW_SESSION: session } })
  if (out.code !== 0) throw new Error(pickBwError(out))
  return JSON.parse(out.stdout)
}

export async function editItem(engine, session, id, item) {
  const encoded = Buffer.from(JSON.stringify(item), 'utf8').toString('base64')
  const out = await execBw({ ...engine, args: ['edit', 'item', id, encoded, '--raw'], env: { BW_SESSION: session } })
  if (out.code !== 0) throw new Error(pickBwError(out))
  return JSON.parse(out.stdout)
}

export async function deleteItem(engine, session, id) {
  const out = await execBw({ ...engine, args: ['delete', 'item', id], env: { BW_SESSION: session } })
  if (out.code !== 0) throw new Error(pickBwError(out))
  return true
}

/** sync 之后列表才是新的；调用方决定何时刷。 */
export async function folders(engine, session) {
  return listObjects(engine, session, 'folders')
}
