import type { TransformCallback, Root } from 'postcss'

// TODO: 目前只能做到取一个函数的名字和参数，对于嵌套情况无效...
const getFunction = (str: string) => {
  const list = str.replace(/\s+/g, "").match(/[^(|,|)]+/g)

  return {
    name: list[0],
    params: list.slice(1)
  }
}

const isFunction = (str: string) => {
  const regA = /^[A-Za-z0-9_-]+[\(][\s\S]+[\)]$/g
  const regB = /^[A-Za-z0-9_-]+[\(][\)]$/g

  return regA.test(str) || regB.test(str)
}

interface INode {
  name: string,
  value: string
}

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

  const getNode = (node: any): INode => {
    const result = {
      name: '',
      value: ''
    }
    if (type === 'less') {
      const str = node.name
      result.name = str.slice(0, str.length - 1)
      result.value = node.params
    }
    if (type === 'sass') {
      const str = node.prop;
      result.name = str.slice(1);
      result.value = node.value
    }

    return result
  }

  const walker = (root: Root, cb: (data: INode) => void) => {
    if (type === 'less') {
      return root.walkAtRules(e => cb(getNode(e)))
    }
    if (type === 'sass') {
      return root.walkDecls(e => cb(getNode(e)))
    }
  }

  return root => {
    const getDepthVar = (p: string) => {
      if (p[0] !== varFlag) return false

      p = p.slice(1)  // 剔除 less/sass 变量前缀
      // 没有存在于 cache 中
      if (depthVarSet.has(p)) return true

      let isExist = false
      walker(root, ({ name, value }) => {
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
      if (isFunction(p)) {
        const funcData = getFunction(p)
        return getCalc(funcData.name, funcData.params.map(v => getParam(theme, v)))
      }
      // 参数不为变量，到这里是参数为常数
      if (p[0] !== varFlag) return p

      // 参数为变量
      p = p.slice(1) // 剔除 less/sass 变量前缀
      if (data[theme]?.[p]) return data[theme][p]

      let variable = ''
      walker(root, ({ name, value }) => {
        if (p === name || p === '') {
          if (isFunction(value)) {
            const { name, params } = getFunction(value)
            const calcValue = getCalc(name, params.map(v => getParam(theme, v)))

            funcVarMap[theme][value] = calcValue
            variable = calcValue
          } else {
            variable = value
          }
        }
      })
      return variable
    }

    getDepthVar(varFlag)

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

// TODO: '这个就需要翻 api 了...'
const getCalc = (funcName: string, params: string[]): string => {
  if (funcName === 'lighten') {
    return params.reduce((acc, cur) => acc + cur, '')
  }
  return ''
}