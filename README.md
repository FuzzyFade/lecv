# LECV: some postcss plugin for complier css var

主要负责提供 less/sass var function 的 AST 解析能力的 postCSS 插件工具集

```less
$result-title-font-size: #2e2e2e;
$result-zzz: 10%;
$result-title-font: lighten($result-zzz, 10%);
$result-title-font-fuzzy: lighten($result-title-font-size, $result-zzz);
$darken-color: lighten($result-title-font-fuzzy, 20%);

// draken-color 预先计算出来，并作为主题变量维护

// 考虑直接注入到 themeData 里
// 意味着要在 loader 之前就编译完成

// ------------------------ color ------------------------ //
.size {
  font-size: $result-title-font-size;
  color: $darken-color
}
```

## 函数与变量依赖关系分析

主题数据
```js
{
  default: { 
    'result-title-font-size': '24px' 
  }, 
  dark: { 
    'result-title-font-size': '20px' 
  }
}
```

分析后的数据
```js
{
  default: {
    'result-title-font-size': '24px',
    'result-title-font-fuzzy': '24px10%', // 由于还没完成计算能力，所以先纯 ++
    'darken-color': '24px10%20%'
  },
  dark: {
    'result-title-font-size': '20px',
    'result-title-font-fuzzy': '20px10%',
    'darken-color': '20px10%20%'
  }
}
```

## 变量转化能力

```js
/**
 * 将 less/sass variable 转化为 css variable
 * 
 * Less eg:  @color-bg: #fff; -> @color-bg: var(--color-bg, ${default});
 * 
 * Sass eg:  $color-bg: #fff; -> $color-bg: var(--color-bg, ${default});
 */
```

## TODO
- [x] 变量依赖分析能力
- [ ] 优化解析函数性能
- [ ] 收集 import 并遍历 import 的文件
- [x] 样式函数计算能力
- [ ] 发 npm 并提高通用性
