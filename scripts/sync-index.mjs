#!/usr/bin/env node
/**
 * 把 data/dsh-market-index.json 里的版本信息同步到当前 HEAD。
 *
 * 用法：npm run sync-index   （或 node scripts/sync-index.mjs）
 *
 * 做的事：
 *   - 从 package.json 读版本号
 *   - 从 git 读当前 HEAD 的完整 commit
 *   - 更新索引里每个插件的最新版本：version / source.commit / publishTimestamp
 *   - 打印改动摘要；加 --check 时只检查不写入，供 CI 用
 */
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const checkOnly = process.argv.includes('--check')

const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'))
const commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root }).toString().trim()
const shortCommit = commit.slice(0, 12)

const indexPath = path.join(root, 'data', 'dsh-market-index.json')
const raw = readFileSync(indexPath, 'utf8')
const index = JSON.parse(raw)

const version = pkg.version
if (!version) throw new Error('package.json 没有 version')

let changed = 0
const report = []

for (const plugin of index.plugins ?? []) {
  const versions = plugin.versions ?? []
  if (versions.length === 0) {
    plugin.versions = [{
      version,
      publishTimestamp: Math.floor(Date.now() / 1000),
      source: { type: 'git', url: plugin.repository?.url ?? pkg.repository?.url, commit },
      engines: { dsh: '>=0.2.0' },
    }]
    changed += 1
    report.push(`${plugin.name}: 新建版本 ${version} @ ${shortCommit}`)
    continue
  }

  const latest = versions[0]
  const next = {
    ...latest,
    version,
    source: { ...latest.source, commit },
  }
  const sameVersion = latest.version === version
  const sameCommit = latest.source?.commit === commit
  if (sameVersion && sameCommit) {
    report.push(`${plugin.name}: 已是最新（${version} @ ${shortCommit}）`)
    continue
  }
  // 版本号没变但 commit 变了（例如只改了文档）也要同步，否则市场更新按钮指向旧代码
  next.publishTimestamp = Math.floor(Date.now() / 1000)
  versions[0] = next
  changed += 1
  report.push(`${plugin.name}: ${latest.version} @ ${(latest.source?.commit ?? '').slice(0, 12)} → ${version} @ ${shortCommit}`)
}

console.log(report.join('\n'))

if (checkOnly) {
  if (changed > 0) {
    console.error(`\n索引落后于 HEAD（${changed} 处），请运行 npm run sync-index`)
    process.exit(1)
  }
  console.log('\n索引已与 HEAD 同步')
  process.exit(0)
}

if (changed === 0) {
  console.log('\n没有需要写入的改动')
  process.exit(0)
}

writeFileSync(indexPath, `${JSON.stringify(index, null, 2)}\n`, 'utf8')
console.log(`\n已更新 ${indexPath}`)
