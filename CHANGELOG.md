# 更新记录

## 0.1.1

- 修掉旧版 Vaultwarden 上的「第一次调用失败、重试才成功」：SDK 解锁后首次跑 `key_id_backfill` 迁移会抛 `KeyIdBackfillError`，插件现在在 `unlock` 和每次带会话的操作上各自动重试一次，失败那次写下的 24 小时冷却会让重试直接跳过回填。错误不再冒到 AI 工具和设置页。
- 审计日志新增 `backfill-retry` 记录，方便事后对账。

## 0.1.0

- 首个版本：`bitwarden_search` / `bitwarden_use` / `bitwarden_create` / `bitwarden_update` / `bitwarden_folders` / `bitwarden_status` 六个工具，设置页「密码库」，主密码走系统凭据存储，本地审计与空闲自动锁定。
