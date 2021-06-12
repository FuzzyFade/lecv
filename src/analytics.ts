import type { TransformCallback } from 'postcss'
import { getFunction, isFunction, walker } from './helper'
import less from 'less'

/**
 * 函数分析工具
 * 
 * 优化空间：walker 得到数值提前返回，避免无效遍历 ⬇️
 * 也就说 walker 会改造为更像是 find 一样的函数
 * 
 * 具有副作用，会改变 data 参数的某些数值
 */
export const funcCollectPlugin = (
  data: Record<string, Record<string, string>>,
  type: 'sass' | 'less' = 'less'
): TransformCallback => {
  const themes: string[] = Object.entries(data).map(([key]) => key)
  const varFlag = type === 'less' ? '@' : '$'
  const depthVarSet = new Set<string>(Object.entries(data[themes[0]]).map(i => i[0]))
  const funcVarMap = {}

  // initial funcVarMap
  themes.forEach(theme => {
    funcVarMap[theme] = {}
  })

  return root => {
    const getDepthVar = (p: string) => {
      if (p[0] !== varFlag) return false

      p = p.slice(1)  // 剔除 less/sass 变量前缀
      // 没有存在于 cache 中
      if (depthVarSet.has(p)) return true

      let isExist = false
      walker(type, root, ({ name, value }) => {
        if (p === name || p === '') {
          if (isFunction(value)) {
            const { params } = getFunction(value)
            isExist = params.some(getDepthVar)
            if (isExist) {
              depthVarSet.add(name)
            }
          }
        }
      })
      return isExist
    }

    const getParam = (theme: string, p: string) => {
      // 参数为函数
      // if (isFunction(p)) {
      //   const funcData = getFunction(p)
      //   return getCalc(funcData.name, funcData.params.map(v => getParam(theme, v)))
      // }
      // 参数不为变量，到这里是参数为常数
      if (p[0] !== varFlag) return p

      // 参数为变量
      p = p.slice(1) // 剔除 less/sass 变量前缀
      if (data[theme]?.[p]) return data[theme][p]

      let variable = ''
      walker(type, root, ({ name, value }) => {
        if (p === name || p === '') {
          if (isFunction(value)) {
            const { name: funcName, params } = getFunction(value)
            const calcValue = getCalc(funcName, params.map(v => getParam(theme, v)))

            funcVarMap[theme][name] = calcValue
            variable = calcValue
          } else {
            variable = value
          }
        }
      })
      return variable
    }

    // get depthVarSet
    getDepthVar(varFlag)

    // get funcVarMap
    themes.forEach(theme => {
      getParam(theme, varFlag)
    })

    // pick depthVarSet to funcVarMap
    depthVarSet.forEach(i => {
      themes.forEach(theme => {
        if (data[theme][i]) return
        data[theme][i] = funcVarMap[theme][i]
      })
    })
  }
}

const filterParams = (params: string[]) => {
  return params.map(p => {
    switch (true) {
      case p[0] === '#':
        return less.color(p.slice(1))
      case p[p.length - 1] === '%':
        return less.value(p.slice(0, p.length - 1))
      case Number.isNaN(p):
        return less.value(p)
      default:
        return Number(p)
    }
  })
}

const getCalc = (funcName: string, params: string[]): string => {
  const func = less.functions.functionRegistry.get(funcName)
  if (func) {
    return func(...filterParams(params)).toCSS()
  }
  return ''
}