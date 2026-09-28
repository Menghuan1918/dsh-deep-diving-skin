# dsh-deep-diving-skin

替换 DeepSeek Harness 运行状态行的图标、文本和颜色——就是那一行「深度求索中，用时 16分0秒…」。默认附带东方 project 加载画面：旋转的太极 + 「少女祈祷中」 + 红色。

![效果图](docs/preview.png)

## 安装

从 Git 安装：

```sh
dsh plugin --profile web add github:Menghuan1918/dsh-deep-diving-skin
```

重启一次 `dsh web`（宿主半边负责设置路由），然后刷新页面。

<!-- INSTALL-GUIDE:START — 图文安装说明待填：在此处粘贴截图与分步说明 -->

<!-- INSTALL-GUIDE:END -->

## 设置

左侧边栏 → **插件** → `dsh-deep-diving-skin` → 那一行的配置入口。

| 字段 | 说明 |
|---|---|
| 图标 | 上传 SVG / GIF / WebP / PNG（存为 data URI，≤ 1 MiB），或填 `https://` 地址、`/路径`。 |
| 文本 | 只替换「深度求索中」这几个字，「用时 …」照常跳动。 |
| 颜色 | 这一行文字的颜色。 |
| 旋转 / 周期 | 图标是否旋转，以及转一圈的秒数（0.2–60）。 |

配置存放在 `<DSH_HOME>/deep-diving-skin.json`。

## 版本要求

DSH `>= 0.2.0-rc.1 < 0.3.0`；其它版本会被运行时自带的兼容性预检拒绝。

## 说明

- 颜色只作用于文本，图标保留你给它本身的颜色。
- `prefers-reduced-motion` 不会自动关掉旋转——那个勾选框才是开关。

## 开发

```sh
pnpm install
pnpm test        # 先构建再跑测试
pnpm typecheck
```

MIT
