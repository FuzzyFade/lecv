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

```

```