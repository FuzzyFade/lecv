import type { Root } from 'postcss'

interface INode {
  name: string,
  value: string
}

const config = {
  less: {
    walker: 'walkAtRules',
    node: {
      name: 'name',
      nameGetter: (str: string) => str.slice(0, str.length - 1),
      value: 'params',
    }
  },
  sass: {
    walker: 'walkDecls',
    node: {
      name: 'prop',
      nameGetter: (str: string) => str.slice(1),
      value: 'value'
    }
  }
}

// TODO: 目前只能做到取一个函数的名字和参数，对于嵌套情况无效...
export const getFunction = (str: string) => {
  const list = str.replace(/\s+/g, "").match(/[^(|,|)]+/g)

  return {
    name: list[0],
    params: list.slice(1)
  }
}

export const isFunction = (str: string) => {
  const regA = /^[A-Za-z0-9_-]+[\(][\s\S]+[\)]$/g
  const regB = /^[A-Za-z0-9_-]+[\(][\)]$/g

  return regA.test(str) || regB.test(str)
}

// 重新封装后的 postcss 遍历函数 (sync)
export const walker = (type: string, root: Root, cb: (data: INode) => void) => {
  return root[config[type].walker](e => cb(getNode(type, e)))
}

const getNode = (type: string, node: any): INode => {
  const { name, nameGetter, value } = config[type].node
  return {
    name: nameGetter(node[name]),
    value: node[value]
  }
}

