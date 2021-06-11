import type { TransformCallback } from 'postcss'

/**
 * 将 less/sass variable 转化为 css variable
 * 
 * Less eg:  @color-bg: #fff; -> @color-bg: var(--color-bg, ${default});
 * 
 * Sass eg:  $color-bg: #fff; -> $color-bg: var(--color-bg, ${default});
 */
export const declVarPlugin = (
  data: Record<string, Record<string, string>>,
  defaultTheme: string,
  type: 'sass' | 'less' = 'less'
): TransformCallback => {
  const varsMap = data[defaultTheme]

  return root => {
    if (type === 'sass') {
      root.walkDecls(decl => {
        if (decl.prop) {
          const str = decl.prop;
          const name = str.slice(1);

          if (varsMap[name] && str[0] === '$') {
            decl.value = `var(--${name}, ${varsMap[name]})`;
          }
        }
      });
      return;
    }

    if (type === 'less') {
      root.walkAtRules(atRule => {
        if (atRule.name) {
          const str = atRule.name
          const name = str.slice(0, str.length - 1)

          if (varsMap[name]) {
            atRule.params = `var(--${name}, ${varsMap[name]})`
          }
        }
      })
    }
  };
};
