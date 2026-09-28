# dsh-deep-diving-skin

[English](README.md) | 中文

替换 DeepSeek Harness 运行状态行的**图标**、**文本**和**颜色**——就是那一行「深度求索中，用时 16分0秒…」。

默认附带东方 project 的加载画面：**旋转的太极图标** + **少女祈祷中** + **红色**，后面的计时照常跳动。

```
[◯] 少女祈祷中，用时 16分0秒...
 ^                ^
 你选的图标        harness 自己的计时，原样保留
```

## 版本要求

- DSH `>= 0.2.0-rc.1 < 0.3.0`。浏览器半边针对 0.2.x 渲染的标记；声明的 peer 范围会让运行时的兼容性预检在其它版本上拒绝该行（官方提供 `dsh plugin allow-version` 放行开关）。

## 安装

```sh
dsh plugin --profile web add dsh-deep-diving-skin
# 或从本地检出安装：
dsh plugin --profile web add link:/绝对路径/dsh-deep-diving-skin
```

需要重启一次 `dsh web` 以加载宿主半边（设置路由）；之后浏览器半边只需刷新页面。

## 设置

设置页面在**左侧边栏的「插件」页里**——打开该页，找到 `dsh-deep-diving-skin` 这个包，点它那一行的配置入口。

| 字段 | 说明 |
|---|---|
| 图标 | 上传 SVG / GIF / WebP / PNG（存为 data URI），或填 `https://` 地址、`/路径`。上传上限 1 MiB。 |
| 文本 | 只替换「深度求索中」这几个字，「用时 …」原样保留。 |
| 颜色 | 这一行文字的颜色。 |
| 旋转 / 周期 | 图标是否旋转，以及转一圈的秒数（0.2–60）。 |

配置持久化在 `<DSH_HOME>/deep-diving-skin.json`。上传的图标以 data URI 存进该文件，因此文件会变大；这是「换浏览器也不丢」的代价。

## 实现原理

DSH 0.2.x 把这一行内联渲染在 `ChatView` 里，没有走任何 slot；而它的文案属于另一个插件已经占用的 locale 命名空间——`LocaleRuntime.register` 对已占用的 `(命名空间, 语言)` 直接抛错，所以任何插件都无法以字符串方式覆盖「深度求索中」。唯一可用的着力点是已渲染的元素：

```
<div data-chat-running>
  <span role="status">深度求索中...</span>      ← 无障碍文案，不动
  <span class="…_runningDivider">
  <span class="…_runningContent">
    <span class="…_runningIcon"><svg/></span>   ← 隐藏
    <span data-text-shimmer>深度求索中，用时 16分0秒...</span>
```

插件隐藏那个 `<svg>`，在弹性行首插入自己的图标元素，改写 shimmer 标签开头的短语（每个时钟 tick React 都会重写该文本节点，插件随之重新应用），并覆盖这一行唯一的取色点 `--dsw-alias-label-deep-diving`。每一步在标记不符合预期时都只是空操作，所以将来布局变化时最坏结果是「皮肤不生效」，而不是页面错乱。

设置路由 `/deep-diving-skin/api/config` 只信任 loopback 加同源浏览器标记。经反向代理访问时，在行配置里列出该权威：

```yaml
- id: dsh-deep-diving-skin
  config:
    trustedHosts: ['my-host.example:3080']
```

## 已知限制

- 颜色只作用于**文本**。图标保留你给它本身的颜色：给 SVG 重新上色需要把它作为标记内联，那会把用户输入变成 DOM 注入面。
- 不支持粘贴原始 SVG **源码**——请上传文件或填 URL，原因同上。
- `prefers-reduced-motion` 不会自动关掉旋转：旋转是显式设置项，开关就是那个「旋转图标」勾选框。
- `plugins.row.config` 的 key 是 `<包名>#<行 id>`，两者都是 `dsh-deep-diving-skin`。用别的行 id 挂载时皮肤照常工作，但设置页不会出现。
- 设置路由不可达时（例如反代权威没列进白名单），设置页打不开；此时皮肤沿用自带预设。

## 开发

```sh
pnpm install
pnpm test        # 先构建再跑测试（43 条：DOM 换皮、设置 API、存储、设置页）
pnpm typecheck
pnpm build
```

浏览器半边是零依赖的 tsdown 产物，外面包着模块表期望的 `window.__ModuleLoader__.load({ id, factory })` 闭包，只有 `react` 与 `react/jsx-runtime` 保持 external。`devDependencies` 里的 `@deepseek-ai/dsh-client-store` 虽然没人直接 import 也必须钉住：它是 `dsh-client-ui-slots` 的类型依赖，缺了它 TypeScript 会把 slot hook 的类型静默解析成 `any`。
