# dsh-deep-diving-skin

English | [中文](README.zh.md)

Replace the icon, the text, and the colour of the DeepSeek Harness running-status line — the one that reads 「深度求索中，用时 16分0秒…」.

Ships the Touhou loading screen as its default: a **spinning taiji**, the text **少女祈祷中**, in **red**. The elapsed-time suffix keeps ticking.

```
[◯] 少女祈祷中，用时 16分0秒...
 ^                ^
 icon you choose  harness's own timer, untouched
```

## Requirements

- DSH `>= 0.2.0-rc.1 < 0.3.0`. The browser half targets markup that only 0.2.x renders, and the declared peer range makes the runtime's compatibility preflight refuse the row on anything else (with the official `dsh plugin allow-version` escape hatch).

## Install

```sh
dsh plugin --profile web add dsh-deep-diving-skin
# or, from a checkout:
dsh plugin --profile web add link:/abs/path/to/dsh-deep-diving-skin
```

Restart `dsh web` once so the host half picks up the settings route; after that the browser half only needs a page refresh.

## Settings

The page lives inside the **Plugins page in the left sidebar** — open it, find the `dsh-deep-diving-skin` package, then the configure control on its row.

| Field | Meaning |
|---|---|
| Icon | Upload an SVG / GIF / WebP / PNG (stored as a data URI), or type an `https://` URL or a `/path`. Uploads are capped at 1 MiB. |
| Text | Replaces the 「深度求索中」 phrase only. The 「用时 …」 suffix stays. |
| Colour | The colour of that line's text. |
| Rotate / period | Whether the icon spins, and how many seconds per turn (0.2–60). |

Values persist to `<DSH_HOME>/deep-diving-skin.json`. Uploaded icons live in that file as data URIs, so it can grow; that is the price of having the picture survive a browser change.

## How it works

DSH 0.2.x renders that line inline in `ChatView` rather than through a slot, and its copy belongs to a locale namespace another plugin already owns — `LocaleRuntime.register` throws on an occupied `(namespace, locale)`, so no plugin can override 「深度求索中」 as a string. The only lever is the rendered element:

```
<div data-chat-running>
  <span role="status">深度求索中...</span>      ← accessibility copy, left alone
  <span class="…_runningDivider">
  <span class="…_runningContent">
    <span class="…_runningIcon"><svg/></span>   ← hidden
    <span data-text-shimmer>深度求索中，用时 16分0秒...</span>
```

The plugin hides that `<svg>`, heads the flex row with its own icon element, rewrites the phrase at the head of the shimmer label (re-applying after each clock tick, which React commits by rewriting the text node), and overrides the one custom property the line takes its colour from (`--dsw-alias-label-deep-diving`). Every step is a no-op when the markup is not what it expects, so a future layout change degrades to "the skin does nothing" rather than a broken page.

The settings route (`/deep-diving-skin/api/config`) is fenced to loopback plus a same-origin browser marker. Behind a reverse proxy, list that authority in the row config:

```yaml
- id: dsh-deep-diving-skin
  config:
    trustedHosts: ['my-host.example:3080']
```

## Known limitations

- The colour applies to the **text**. The icon keeps whatever colours you gave it: re-tinting an SVG means inlining it as markup, which would turn user input into a DOM injection surface.
- Raw SVG **markup** cannot be pasted — upload the file or point at a URL instead. Same reason.
- `prefers-reduced-motion` does not switch the rotation off; it is an explicit setting, and its switch is the `Rotate` checkbox.
- The `plugins.row.config` slot key is `<package name>#<row id>`, both `dsh-deep-diving-skin`. Mounting the module under a different row id leaves the skin working but hides its settings page.
- Nothing on the page is reachable if the settings route is unreachable (for example when a proxy authority is not listed); the skin then keeps the shipped preset.

## Development

```sh
pnpm install
pnpm test        # builds, then runs the suite (43 specs: DOM skin, settings API, store, page)
pnpm typecheck
pnpm build
```

The client half is a zero-dependency tsdown bundle wrapped in the `window.__ModuleLoader__.load({ id, factory })` closure the module table expects, with only `react` and `react/jsx-runtime` left external. `@deepseek-ai/dsh-client-store` is pinned in `devDependencies` even though nothing imports it: it is a type dependency of `dsh-client-ui-slots`, and without it in the tree TypeScript silently resolves the slot hook types to `any`.
