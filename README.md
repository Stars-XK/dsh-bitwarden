# dsh-bitwarden

把 **Bitwarden / Vaultwarden** 密码库接进 [DeepSeek Harness](https://github.com/deepseek-ai)。给 AI 一套「能用密码、但看不到密码」的工具面，同时给主人一个 Bitwarden 扩展风格的密码库页面。

> 设计前提：AI 的职责是**用**密码，不是**看**密码。密码明文不进对话、不进会话日志、不进模型上下文。

---

## 特性

- **AI 只拿元数据**：`bitwarden_search` 返回名称、用户名、网址、类型、文件夹，永远不含密码、备注、TOTP。
- **受控执行通道**：`bitwarden_use` 在本地把密码注入为环境变量执行命令，返回值里的密码会被替换为 `[REDACTED]`。
- **设置页「密码库」**：登录 / 搜索 / 类型筛选 / **按文件夹筛选与分组** / 查看详情 / 复制用户名密码 / 新建 / 编辑 / 删除，界面参照 Bitwarden 浏览器扩展的「列表 + 详情」布局。
- **文件夹分组**：默认按文件夹分组显示，组头带名称与条数；也可用文件夹 chips 只看某一个文件夹或「未分类」。
- **凭据不落配置**：主密码存放在系统凭据存储（`ctx.credentials`），会话密钥只存在内存。
- **审计与自动锁定**：本地追加式 JSONL 审计日志；空闲超时自动 `bw lock` 并丢弃会话密钥。
- **协议交给官方 CLI**：认证与解密全部由 `@bitwarden/cli` 完成，插件不自己实现 PBKDF2/Argon2id/HKDF/EncString。

## 工具面（给 AI）

| 工具 | 说明 |
|---|---|
| `bitwarden_search` | 按名称 / 用户名 / 网址搜条目，返回元数据列表，可限类型和条数 |
| `bitwarden_use` | 用某条目的密码执行 shell 命令，密码只进子进程环境变量，回显脱敏 |
| `bitwarden_create` | 在密码库里新建登录条目 |
| `bitwarden_status` | 连接状态、账号、上次同步、最后的错误 |

没有「取密码」工具——这是设计，不是遗漏。

## 安装

插件本身是通用的：不绑定任何特定服务器，装好后在设置页填自己的 Bitwarden / Vaultwarden 地址和账号即可。

### 方式一：从 Gitee 直接装（推荐）

在 DSH 里打开 **设置 → 插件 → 添加插件**，填入：

```
git+https://gitee.com/Stars-FX/dsh-bitwarden.git
```

或者用命令行：

```bash
dsh plugin add git+https://gitee.com/Stars-FX/dsh-bitwarden.git
```

> **首次安装会提示批准 `core-js` 的构建脚本**
> `@bitwarden/cli` 的间接依赖 `core-js` 带一个 postinstall 脚本，DSH 默认拦截未批准的构建脚本。
> 在插件管理器里点批准（或 `dsh plugin approve-builds` 后选 `core-js`）即可，之后不会再问。

### 方式二：npm（发布后）

```bash
dsh plugin add dsh-bitwarden
```

### 方式三：本地目录

把仓库下载到任意目录，**设置 → 插件 → 添加插件** 选这个目录。适合改代码、调试。

### 安装后

1. 重启 DSH（或按提示重载插件）。
2. 打开 **设置 → 密码库**，填写服务器地址、邮箱、主密码，点 **登录并解锁**。
3. 如果页面里没有「密码库」入口，刷新一次浏览器页面——客户端模块需要重新进 boot graph。

安装时会把 `@bitwarden/cli` 作为依赖一并装入当前 profile。

### 2. 首次配置

1. 打开 **设置 → 密码库**。
2. 填写：
   - **服务器地址**：自建 Vaultwarden 例如 `https://vault.example.com`；官方服务填 `https://bitwarden.com` 或留空。
   - **邮箱**：账号邮箱。
   - **主密码**：用于登录与解锁。
3. 勾选「保存主密码以便自动解锁」（推荐），点 **登录并解锁**。
4. 成功后进入列表页；之后 AI 在需要时可用已保存的主密码自动解锁。

> 主密码保存到系统凭据存储，不写入 `cordis.patch.yml` 或任何配置文件。
> 想彻底移除：设置 → 密码库 → 偏好 → 「删除已保存的主密码」。

## 使用

对 AI 说：

- 「去密码库找一下 1Panel 的账号」
- 「用生产库 MySQL 的密码跑一下备份」
- 「把这个新密码存进密码库，叫 XX 服务器」

AI 会先 `bitwarden_search`；找不到时再问你。

### 关于 `bitwarden_use`

```json
{
  "itemId": "…",
  "command": "mysql -h 10.0.0.5 -u root -p\"$BW_PASSWORD\" -e 'show databases'",
  "envName": "BW_PASSWORD",
  "timeoutMs": 60000
}
```

- 密码以环境变量注入子进程；
- stdout / stderr 里的密码字面量会被替换成 `[REDACTED]`；
- 每次调用写入审计日志（命令原文、条目名、退出码）。

## 安全设计

| 边界 | 做法 |
|---|---|
| AI 视角 | 只有元数据；密码靠执行通道使用 |
| 主人视角 | 浏览器页面可显示 / 复制密码（结果不进会话日志） |
| 主密码 | 系统凭据存储；配置文件里只有非敏感设置 |
| 会话密钥 | 只在 Host 内存；不动磁盘 |
| 审计 | `~/.dsh/bitwarden/audit.jsonl`，append-only |
| 自动锁 | 空闲 N 分钟自动 `bw lock`（默认 15，可调，0 关闭） |
| 高危动作 | 删除 / 导出不提供 AI 工具，由主人在设置页操作 |

**建议**：给 AI 单独开一个 Vaultwarden 子账号，只授予只读 collection。安全边界靠权限，不靠提示词。

## 数据目录

默认 `$DSH_HOME/bitwarden`（通常是 `~/.dsh/bitwarden`）：

```
bitwarden/
├── settings.json        # 非敏感设置（服务器地址、自动锁时长等）
├── audit.jsonl          # 追加式审计日志
└── cli-home/            # bw CLI 的 HOME，隔离于系统默认 Bitwarden CLI
```

## 已知限制

- 同一时间只管理一个账号。
- 依赖 `@bitwarden/cli` 与 Node ≥ 22。
- 自建 Vaultwarden 版本低于客户端时，`bw login` 可能打出 `key_id_backfill` 404 的 SDK 日志；插件已用 `bw status` 复核，实际登录不受影响。
- 组织级 collection 的写入权限取决于 Vaultwarden 侧授权。
- TOTP 取回永久排除。

## 开发

```bash
npm install          # 安装依赖（含 @bitwarden/cli）
npm install --no-save esbuild
node client/build.mjs   # 生成 client/client.js
```

修改 `client/src/index.jsx` 后需要重新构建；安装/替换插件后需要刷新页面让客户端模块进入 boot graph。

## 插件市场索引

本仓库同时自带一个 DSH 插件市场索引，可直接加入 DSH 的「发现」页：

```
https://gitee.com/Stars-FX/dsh-bitwarden/raw/main/data/dsh-market-index.json
```

添加方式：打开 **插件 → 发现（Discover）**，点空状态里的 **添加索引源**；已经有索引时，从左上角索引菜单末尾选 **管理索引源…**，把上面的地址粘进去。

添加后就能在发现页搜到「Bitwarden 密码库」，点 **安装** 即可。

索引文件是 `data/dsh-market-index.json`，其中 `versions[].source.commit` 必须指向实际包含插件代码的 commit。改了代码并推送后，要同步更新这个 commit，市场里的「更新」才会指向新版本。

## 许可证

[MIT](LICENSE)
