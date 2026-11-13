/**
 * 面向 AI 的工具面。
 *
 * 这里没有「取密码」工具，是设计而不是遗漏：
 * 密码只通过 bitwarden_use 进入子进程环境变量，并以 [REDACTED] 屏蔽回显。
 */
const text = (value) => [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value, null, 2) }]

const TYPE_LABEL = { 1: 'login', 2: 'note', 3: 'card', 4: 'identity' }

/** 去掉 undefined 键：DSH 只接受无损 JSON，undefined 会破坏回执。 */
const compact = (value) => {
  const out = {}
  for (const [key, item] of Object.entries(value)) {
    if (item !== undefined) out[key] = item
  }
  return out
}

export function registerTools(ctx, manager, log = console) {
  const disposers = []

  disposers.push(ctx.tools.register({
    name: 'bitwarden_search',
    description:
      'Search the user\'s Bitwarden / Vaultwarden vault. Returns item metadata only — name, username, URLs, type, folder and id. Passwords, notes and TOTP values are never returned. Use this first when a task needs a credential; when nothing matches, ask the user instead of guessing.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Substring matched against item name, username and URL. Omit to list every item.',
        },
        type: {
          type: 'string',
          enum: ['login', 'note', 'card', 'identity'],
          description: 'Restrict results to one item type. Usually "login".',
        },
        limit: { type: 'number', description: 'Maximum results, 1–200. Defaults to 50.' },
      },
      required: [],
      additionalProperties: false,
    },
    output: {
      schema: {
        type: 'object',
        properties: {
          count: { type: 'number' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                type: { type: 'number' },
                name: { type: 'string' },
                username: { type: 'string' },
                uris: { type: 'array', items: { type: 'string' } },
                folderId: { type: 'string' },
              },
            },
          },
        },
      },
      render: (_args, value) => text(value),
    },
    async execute(args) {
      const input = args ?? {}
      const typeNumber = input.type ? ({ login: 1, note: 2, card: 3, identity: 4 })[input.type] : undefined
      const limit = Math.max(1, Math.min(200, Number(input.limit) || 50))
      const items = await manager.listMeta({ search: input.query || undefined, type: typeNumber, limit })
      return {
        count: items.length,
        items: items.map((item) => compact({
          id: item.id,
          type: item.type,
          name: item.name,
          username: item.username || undefined,
          uris: item.uris,
          folderId: item.folderId || undefined,
        })),
      }
    },
  }))

  disposers.push(ctx.tools.register({
    name: 'bitwarden_use',
    description:
      'Run a shell command with the password of one vault item injected as an environment variable. The password never appears in the result: any occurrence in stdout or stderr is replaced with [REDACTED]. Use this for ssh, mysql, curl -u, or any tool that reads a password from the environment. Prefer a non-interactive command and a strict timeout.',
    parameters: {
      type: 'object',
      properties: {
        itemId: { type: 'string', description: 'Vault item id from bitwarden_search.' },
        command: { type: 'string', description: 'Shell command to run. Reference the password as $BW_PASSWORD unless envName is set.' },
        envName: { type: 'string', description: 'Environment variable name for the password. Defaults to BW_PASSWORD.' },
        cwd: { type: 'string', description: 'Working directory for the command. Defaults to the plugin data directory.' },
        timeoutMs: { type: 'number', description: 'Kill the command after this many milliseconds. Defaults to 120000.' },
      },
      required: ['itemId', 'command'],
      additionalProperties: false,
    },
    output: {
      schema: {
        type: 'object',
        properties: {
          exitCode: { type: 'number' },
          stdout: { type: 'string' },
          stderr: { type: 'string' },
          timedOut: { type: 'boolean' },
          redacted: { type: 'boolean' },
        },
      },
      render: (_args, value) => {
        const out = value ?? {}
        const body = [
          `exit=${out.exitCode}${out.timedOut ? ' (timeout)' : ''}${out.redacted ? ' (password redacted)' : ''}`,
          out.stdout ? `stdout:\n${out.stdout}` : '',
          out.stderr ? `stderr:\n${out.stderr}` : '',
        ].filter(Boolean).join('\n')
        return text(body || `exit=${out.exitCode}`)
      },
    },
    async execute(args, exec) {
      const input = args ?? {}
      return await manager.runWithSecret({
        itemId: input.itemId,
        command: input.command,
        envName: input.envName,
        cwd: input.cwd,
        timeoutMs: input.timeoutMs,
        signal: exec?.signal,
      })
    },
  }))

  disposers.push(ctx.tools.register({
    name: 'bitwarden_create',
    description:
      'Create a new login item in the vault. Use it after the user asks to store or rotate a credential. The returned value is metadata only; the password stays in the vault.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Item name, e.g. "生产库 MySQL".' },
        username: { type: 'string', description: 'Login username.' },
        password: { type: 'string', description: 'Login password.' },
        uris: { type: 'array', items: { type: 'string' }, description: 'One or more URLs.' },
        notes: { type: 'string', description: 'Free-form notes.' },
        folderId: { type: 'string', description: 'Optional folder id from the vault UI.' },
      },
      required: ['name'],
      additionalProperties: false,
    },
    output: {
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          username: { type: 'string' },
          uris: { type: 'array', items: { type: 'string' } },
        },
      },
      render: (_args, value) => text(value),
    },
    async execute(args) {
      const input = args ?? {}
      const meta = await manager.createLogin(input)
      return compact({ id: meta.id, name: meta.name, username: meta.username, uris: meta.uris })
    },
  }))

  disposers.push(ctx.tools.register({
    name: 'bitwarden_folders',
    description: 'List the vault folders with their ids and names. Use it to learn folder ids before moving items with bitwarden_update.',
    parameters: { type: 'object', properties: {}, required: [], additionalProperties: false },
    output: {
      schema: {
        type: 'object',
        properties: {
          folders: {
            type: 'array',
            items: { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' } } },
          },
        },
      },
      render: (_args, value) => text(value),
    },
    async execute() {
      const folders = await manager.listFolders()
      return { folders: folders.map((folder) => compact({ id: folder.id, name: folder.name })) }
    },
  }))

  disposers.push(ctx.tools.register({
    name: 'bitwarden_update',
    description:
      'Update one item\'s metadata: name, URLs and folder. This tool never reads back or changes the password or notes. Pass folderId as an empty string to move the item to Unfiled. Use it to tidy names and folder placement after the user asks for a cleanup.',
    parameters: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Vault item id from bitwarden_search.' },
        name: { type: 'string', description: 'New item name.' },
        uris: { type: 'array', items: { type: 'string' }, description: 'Replacement URL list.' },
        folderId: { type: 'string', description: 'Target folder id from bitwarden_folders; empty string moves it to Unfiled.' },
      },
      required: ['id'],
      additionalProperties: false,
    },
    output: {
      schema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          uris: { type: 'array', items: { type: 'string' } },
          folderId: { type: 'string' },
        },
      },
      render: (_args, value) => text(value),
    },
    async execute(args) {
      const input = args ?? {}
      if (!input.id) throw new Error('缺少条目 id。')
      const patch = {}
      if (input.name !== undefined) patch.name = input.name
      if (input.uris !== undefined) patch.uris = input.uris
      if (input.folderId !== undefined) patch.folderId = input.folderId || null
      const meta = await manager.updateLogin(input.id, patch)
      return compact({ id: meta.id, name: meta.name, uris: meta.uris, folderId: meta.folderId || undefined })
    },
  }))

  disposers.push(ctx.tools.register({
    name: 'bitwarden_status',
    description:
      'Report the vault connection state: server URL, account, whether the vault is unlocked, last sync time, and the last error. Use it to explain to the user why a credential lookup failed.',
    parameters: { type: 'object', properties: {}, required: [], additionalProperties: false },
    output: {
      schema: {
        type: 'object',
        properties: {
          status: { type: 'string' },
          serverUrl: { type: 'string' },
          email: { type: 'string' },
          lastSync: { type: 'string' },
          hasMasterPassword: { type: 'boolean' },
          lastError: { type: 'string' },
        },
      },
      render: (_args, value) => text(value),
    },
    async execute() {
      const status = await manager.status()
      return compact({
        status: String(status.status ?? 'unknown'),
        serverUrl: status.serverUrl || undefined,
        email: status.email || undefined,
        lastSync: status.lastSync || undefined,
        hasMasterPassword: Boolean(status.hasMasterPassword),
        lastError: status.lastError || undefined,
      })
    },
  }))

  // 高危动作的兜底拦截：删除不属于 AI 工具面，这里只防未来误加。
  if (typeof ctx.tools.guard === 'function') {
    disposers.push(ctx.tools.guard((execution) => {
      const name = execution?.name
      if (name === 'bitwarden_delete' || name === 'bitwarden_export') {
        return {
          reason: `dsh-bitwarden 不提供 ${name}：删除/导出请在设置 → 密码库 中由本人操作。`,
          info: { name: 'bitwarden_policy' },
        }
      }
      return undefined
    }))
  }

  log.info?.('[dsh-bitwarden] 工具已注册：bitwarden_search / bitwarden_use / bitwarden_create / bitwarden_update / bitwarden_folders / bitwarden_status')
  return () => { for (const dispose of disposers) { try { dispose() } catch { /* 已清理 */ } } }
}

export { TYPE_LABEL }
