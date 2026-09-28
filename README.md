# dsh-deep-diving-skin

Replace the icon, text and colour of the DeepSeek Harness running-status line — the one reading 「深度求索中，用时 16分0秒…」. Ships the Touhou loading screen by default: a spinning taiji, 「少女祈祷中」, in red.

![preview](docs/preview.png)

## Install

From Git:

```sh
dsh plugin --profile web add github:Menghuan1918/dsh-deep-diving-skin
```

Restart `dsh web` once (the host half serves the settings route), then reload the page.

<!-- INSTALL-GUIDE:START — 图文安装说明待填 / paste the walkthrough with screenshots here -->

<!-- INSTALL-GUIDE:END -->

## Settings

Left sidebar → **Plugins** → `dsh-deep-diving-skin` → the configure control on its row.

| Field | Meaning |
|---|---|
| Icon | Upload SVG / GIF / WebP / PNG (stored as a data URI, ≤ 1 MiB), or type an `https://` URL or `/path`. |
| Text | Replaces the 「深度求索中」 phrase only; the 「用时 …」 suffix keeps ticking. |
| Colour | Colour of that line's text. |
| Rotate / period | Whether the icon spins, and seconds per turn (0.2–60). |

Configuration lives in `<DSH_HOME>/deep-diving-skin.json`.

## Requirements

DSH `>= 0.2.0-rc.1 < 0.3.0`; other versions are refused by the runtime's own compatibility preflight.

## Notes

- The colour applies to the text. The icon keeps the colours you gave it.
- `prefers-reduced-motion` does not switch the rotation off — the checkbox is the control.

## Development

```sh
pnpm install
pnpm test        # builds, then runs the suite
pnpm typecheck
```

`lib/` is committed: a Git install has no build step, so run `pnpm build` and commit `lib/` with any source change.

MIT
