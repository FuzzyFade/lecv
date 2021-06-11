import postcss from 'postCSS'
import * as path from 'path'
import * as fs from 'fs'
import * as pSa from 'postcss-scss'
import { funcCollectPlugin } from './analytics'

const p = path.join(__dirname, '../example', 'a.less')
const source = fs.readFileSync(p, 'utf8')

const a = { parser: pSa } as any

const data = { default: { 'result-title-font-size': '24px' }, dark: { 'result-title-font-size': '20px' } }

postcss([
  funcCollectPlugin(data, 'less'),
]).process(source, a).css

// const css = postcss([
//   declVarPlugin(data, 'default', 'sass')
// ]).process(_css, a).css

// less.render(css).then((res) => {
//   if (res) {
//     console.log(data)
//     console.log(res.css)
//   }
// })

console.log(data)
