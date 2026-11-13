// 把 client/src/index.jsx 打成 DSH Web 的模块加载格式（client/client.js）。
// 只在开发时运行：node client/build.mjs
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..')

const result = await build({
  entryPoints: [path.join(here, 'src/index.jsx')],
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  target: ['chrome110'],
  external: ['react', 'react/jsx-runtime'],
  write: false,
  jsx: 'transform',
  legalComments: 'none',
})

const code = result.outputFiles?.[0]?.text
if (!code) throw new Error('esbuild 没有产出 bundle')

const wrapped = `window.__ModuleLoader__.load({
  id: "dsh-bitwarden",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    var React = require("react");
${code}
    return module.exports;
  }
});
`

const out = path.join(here, 'client.js')
await mkdir(path.dirname(out), { recursive: true })
await writeFile(out, wrapped, 'utf8')
console.log(`built ${out} (${wrapped.length} bytes)`)
