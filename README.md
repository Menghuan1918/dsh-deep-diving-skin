<img src="icon.svg" width="28" alt="">

# dsh-deep-diving-skin

中文 | [English](README.en.md)

替换 DeepSeek Harness 运行状态行的图标、文本和颜色——就是那一行「深度求索中，用时 16分0秒…」。默认图标是旋转太极，默认文本「少女祈祷中」，默认颜色为红色。

![效果图](docs/preview.png)

## 安装

从 Git 安装：

```sh
dsh plugin --profile web add github:Menghuan1918/dsh-deep-diving-skin
```

重启一次 `dsh web`（宿主半边负责设置路由），然后**刷新页面**——重启前打开的标签页仍用着旧的客户端，看不到变化。

> 客户端半边的改动由模块注册表自动重载；**宿主半边的改动必须重启 `dsh web`**。宿主比插件字段旧时会回 200 却丢弃自己不认识的字，设置页会把被丢弃的字段点名。

<!-- INSTALL-GUIDE:START — 图文安装说明待填：在此处粘贴截图与分步说明 -->

<!-- INSTALL-GUIDE:END -->

## 设置

两个入口，同一个页面：

- 左侧边栏 → **插件** → `dsh-deep-diving-skin` → 那一行的配置入口。
- **设置** → **运行状态**。

| 字段 | 说明 |
|---|---|
| 图标 | 上传 SVG / GIF / WebP / PNG（存为 data URI，≤ 1 MiB），或填 `https://` 地址、`/路径`。 |
| 文本 | 只替换「深度求索中」这几个字，「用时 …」照常跳动。 |
| 颜色 | 这一行文字的颜色。 |
| 高亮扫光 | 扫过文字那道亮带的颜色；与文本颜色不同才看得出来。 |
| 旋转 / 周期 / 方向 | 图标是否旋转、转一圈的秒数（0.2–60），以及顺时针还是逆时针。 |

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

`lib/` 是提交进仓库的：Git 安装没有构建步骤，改动源码后请跑 `pnpm build` 并把 `lib/` 一起提交。

MIT
