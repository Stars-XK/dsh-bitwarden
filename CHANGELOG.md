# 更新记录

## 0.2.0

安全：

- `bitwarden_use` 加批准门：每次用密码执行命令前要主人确认（`tools/pre-execute` 返回 `ask`），设置页「偏好」里可以关掉。没有批准通道时按拒绝处理。
- 审计日志落盘前把命令里的密码字面量替换成 `[REDACTED]`——AI 若把密码直接写进命令，不会再跟着审计一起存下来。
- `revealItem` 改成解密成功后才记 `ok`，失败单独记 `fail`；以前失败也写着「已查看」。

正确性：

- 登录后的同步失败不再被静默吞掉：`lastSyncAt` 只在同步成功时写，失败进 `lastError`，审计记 `partial`。

健壮性：

- 审计日志超过 2MB 轮转成 `audit.jsonl.1`，只留一代。
- `settings.json` 改成临时文件 + rename 的原子写。
- 起 shell 前校验 `$SHELL` 是否存在，回退 `/bin/sh`（容器里 SHELL 常指向没装的 zsh）。
- 命令输出超过 1MB 时打截断标记，不再静默截断。

可测性：

- 新增 `npm test`（node:test，13 个用例）：回填重试、错误标记、非回填错误不被掩盖、设置原子写、审计轮转、密码脱敏、损坏配置回落。

## 0.1.1

- 修掉旧版 Vaultwarden 上的「第一次调用失败、重试才成功」：SDK 解锁后首次跑 `key_id_backfill` 迁移会抛 `KeyIdBackfillError`，插件现在在 `unlock` 和每次带会话的操作上各自动重试一次，失败那次写下的 24 小时冷却会让重试直接跳过回填。错误不再冒到 AI 工具和设置页。
- 审计日志新增 `backfill-retry` 记录，方便事后对账。

## 0.1.0

- 首个版本：`bitwarden_search` / `bitwarden_use` / `bitwarden_create` / `bitwarden_update` / `bitwarden_folders` / `bitwarden_status` 六个工具，设置页「密码库」，主密码走系统凭据存储，本地审计与空闲自动锁定。
