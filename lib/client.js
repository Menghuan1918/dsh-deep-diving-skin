window.__ModuleLoader__.load({
	id: "dsh-deep-diving-skin",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/skin-config.ts
		/**
		* The skin's configuration vocabulary. Imported by BOTH halves of the plugin,
		* so this module stays browser-safe: no Node import, no side effect.
		*/
		/** Host route serving the persisted configuration. */
		const SKIN_API_PATH = "/deep-diving-skin/api/config";
		/** Locale namespace owned by this plugin. */
		const SKIN_NS = "deep-diving-skin";
		/**
		* Slot key of this plugin's configuration page on the Plugins page:
		* `${package name}#${loader row id}`. Both are 'dsh-deep-diving-skin' because
		* cordis.patch.yml declares that row id.
		*/
		const SKIN_ROW_CONFIG_KEY = "dsh-deep-diving-skin#dsh-deep-diving-skin";
		/** Longest icon upload accepted from the settings page, before base64 expansion. */
		const UPLOAD_MAX_BYTES = 1048576;
		/** Rotation period bounds, in seconds. */
		const SPIN_SECONDS_MIN = .2;
		/** The shipped preset: a spinning taiji + 「少女祈祷中」 + red. */
		const DEFAULT_SKIN = {
			icon: "",
			text: "少女祈祷中",
			color: "#e60012",
			spin: true,
			spinSeconds: 3
		};
		/**
		* Accepted icon sources: an inline image, an http(s) URL, or a root-relative
		* path. The allowlist is what keeps `javascript:` and friends out of the CSS
		* `url()` the patcher writes; the quote and control-character exclusions keep
		* that `url("…")` a well-formed string.
		*/
		const ICON_SCHEME = /^(?:data:image\/|https?:\/\/|\/)/;
		const ICON_REJECTED_CHARS = /["'\u0000-\u001f\u007f]/;
		/**
		* Whether a non-empty icon source may be used as a CSS image.
		* @param value - candidate icon source.
		* @returns true when the value is an accepted inline image, URL, or path.
		*/
		function isIconSource(value) {
			return value.length <= 2097152 && ICON_SCHEME.test(value) && !ICON_REJECTED_CHARS.test(value);
		}
		/**
		* Whether a CSS color value is plausibly well-formed. Structural validity is
		* the browser's call (`CSS.supports`); this only bounds what reaches the wire
		* and the settings file.
		* @param value - candidate CSS color.
		* @returns true when the value is a short, control-character-free string.
		*/
		function isColorValue(value) {
			return value.length > 0 && value.length <= 64 && !/[\u0000-\u001f\u007f]/.test(value);
		}
		function recordOf(value) {
			return typeof value === "object" && value !== null && !Array.isArray(value) ? value : {};
		}
		/**
		* Clamp a rotation period into the supported range.
		* @param value - candidate period in seconds.
		* @returns the clamped period, or the default when the value is not a number.
		*/
		function clampSpinSeconds(value) {
			if (typeof value !== "number" || !Number.isFinite(value)) return DEFAULT_SKIN.spinSeconds;
			return Math.min(60, Math.max(SPIN_SECONDS_MIN, value));
		}
		/**
		* Read any stored or received value as a complete configuration. Every field
		* falls back to its default independently, so a hand-edited or truncated
		* settings file degrades field by field instead of failing.
		* @param value - raw value from the settings file or the settings route.
		* @returns a well-formed configuration.
		*/
		function normalizeSkinConfig(value) {
			const raw = recordOf(value);
			return {
				icon: typeof raw.icon === "string" && isIconSource(raw.icon) ? raw.icon : DEFAULT_SKIN.icon,
				text: typeof raw.text === "string" && raw.text.length > 0 && raw.text.length <= 200 ? raw.text : DEFAULT_SKIN.text,
				color: typeof raw.color === "string" && isColorValue(raw.color) ? raw.color : DEFAULT_SKIN.color,
				spin: typeof raw.spin === "boolean" ? raw.spin : DEFAULT_SKIN.spin,
				spinSeconds: clampSpinSeconds(raw.spinSeconds)
			};
		}
		//#endregion
		//#region src/client/locales.ts
		/** Simplified Chinese dictionary. */
		const zh = {
			"summary": "把「深度求索中，用时 …」那一行换成你自己的图标、文本和颜色（默认：旋转太极 + 少女祈祷中 + 红色）。",
			"title": "运行状态皮肤",
			"intro": "这些设置只作用于会话正在运行时的那一行状态提示，改完点保存即时生效。",
			"iconLabel": "图标",
			"iconHint": "支持 SVG 与动图（GIF / WebP / PNG）。上传的文件会转成 data URI 存进配置。",
			"iconUpload": "选择图片文件",
			"iconTooLarge": "图片太大（{kb} KB），上限 {limit} KB。",
			"iconIsData": "当前使用上传的图片（约 {kb} KB）。",
			"iconClear": "清除图标",
			"iconUrlLabel": "或填写图片地址",
			"iconUrlPlaceholder": "https://example.com/icon.svg，或 /assets/icon.svg",
			"iconPreview": "预览",
			"textLabel": "文本",
			"textHint": "只替换「深度求索中」这几个字，后面的「用时 …」原样保留。",
			"colorLabel": "颜色",
			"colorHint": "只作用于这一行文字。",
			"spinLabel": "旋转图标",
			"spinSecondsLabel": "旋转周期（秒）",
			"spinSecondsHint": "0.2 – 60 秒转一圈。",
			"save": "保存",
			"saving": "保存中…",
			"saved": "已保存",
			"saveFailed": "保存失败：",
			"resetAll": "恢复全部默认",
			"resetting": "恢复中…"
		};
		/** English dictionary, key-identical to the Chinese source of truth. */
		const en = {
			"summary": "Replace the 「深度求索中，用时 …」 line with your own icon, text and colour (defaults: spinning taiji + 少女祈祷中 + red).",
			"title": "Running-status skin",
			"intro": "These settings only affect the status line shown while a session runs. Save applies them immediately.",
			"iconLabel": "Icon",
			"iconHint": "SVG and animated images (GIF / WebP / PNG) are supported. An uploaded file is stored as a data URI.",
			"iconUpload": "Choose an image file",
			"iconTooLarge": "Image is too large ({kb} KB); the limit is {limit} KB.",
			"iconIsData": "Using the uploaded image (about {kb} KB).",
			"iconClear": "Clear icon",
			"iconUrlLabel": "Or enter an image URL",
			"iconUrlPlaceholder": "https://example.com/icon.svg, or /assets/icon.svg",
			"iconPreview": "Preview",
			"textLabel": "Text",
			"textHint": "Replaces only the 「深度求索中」 phrase; the elapsed-time suffix is kept verbatim.",
			"colorLabel": "Colour",
			"colorHint": "Applies to this line's text only.",
			"spinLabel": "Rotate the icon",
			"spinSecondsLabel": "Rotation period (seconds)",
			"spinSecondsHint": "0.2 – 60 seconds per turn.",
			"save": "Save",
			"saving": "Saving…",
			"saved": "Saved",
			"saveFailed": "Save failed: ",
			"resetAll": "Reset everything",
			"resetting": "Resetting…"
		};
		//#endregion
		//#region src/client/art.ts
		/**
		* The default icon: the Touhou loading-screen taiji, as a self-contained SVG
		* data URI. Geometry (viewBox 0 0 100 100):
		*
		* - outer disc r=49, white with a dark rim;
		* - the filled half is bounded by the outer circle's LEFT arc from (50,1) to
		*   (50,99) and returns through two half-radius circles — the lower one
		*   (r=24.5, centre (50,74.5)) bulging right, the upper one (centre
		*   (50,25.5)) bulging left, which is the classic S;
		* - each lobe carries its counter-coloured eye at its circle's centre.
		*/
		/** The default taiji markup. Kept as markup so the data URI is generated safely. */
		const DEFAULT_ICON_SVG = [
			"<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 100\">",
			"<circle cx=\"50\" cy=\"50\" r=\"49\" fill=\"#ffffff\" stroke=\"#111111\" stroke-width=\"2\"/>",
			"<path d=\"M50 1A49 49 0 0 0 50 99A24.5 24.5 0 0 0 50 50A24.5 24.5 0 0 1 50 1Z\" fill=\"#e60012\"/>",
			"<circle cx=\"50\" cy=\"25.5\" r=\"8\" fill=\"#e60012\"/>",
			"<circle cx=\"50\" cy=\"74.5\" r=\"8\" fill=\"#ffffff\"/>",
			"</svg>"
		].join("");
		/**
		* Percent-encode SVG markup into a data URI. `encodeURIComponent` leaves
		* parentheses and apostrophes alone, and those would end the CSS `url("…")`
		* string early, so they are escaped too.
		* @param svg - SVG markup.
		* @returns a `data:image/svg+xml,…` URI.
		*/
		function svgDataUri(svg) {
			return `data:image/svg+xml,${encodeURIComponent(svg).replace(/\(/g, "%28").replace(/\)/g, "%29").replace(/'/g, "%27")}`;
		}
		/** The bundled default icon source. */
		const DEFAULT_ICON_URI = svgDataUri(DEFAULT_ICON_SVG);
		/**
		* Resolve the configured icon source.
		* @param icon - configured icon; the empty string selects the bundled default.
		* @returns a CSS-usable image source.
		*/
		function resolveIconSource(icon) {
			return icon === "" ? DEFAULT_ICON_URI : icon;
		}
		//#endregion
		//#region src/client/panel.tsx
		/**
		* The plugin's configuration page, registered at `plugins.row.config` so it
		* opens from the plugin's row on the Plugins page (a left-sidebar panel in
		* DSH 0.2.x). The same component answers `view: 'summary'` with the one-line
		* description that page shows for a row without one.
		*/
		const styles = {
			wrap: {
				display: "flex",
				flexDirection: "column",
				gap: "14px",
				maxWidth: "640px",
				color: "var(--dsw-alias-label-primary, inherit)"
			},
			field: {
				display: "flex",
				flexDirection: "column",
				gap: "4px"
			},
			label: {
				fontSize: "13px",
				fontWeight: 600
			},
			hint: {
				margin: 0,
				color: "var(--dsw-alias-label-tertiary, #888)",
				fontSize: "12px",
				lineHeight: "18px"
			},
			row: {
				display: "flex",
				alignItems: "center",
				gap: "10px",
				flexWrap: "wrap"
			},
			input: {
				font: "inherit",
				padding: "4px 8px",
				color: "inherit",
				border: "1px solid var(--dsw-alias-border-l2, #555)",
				borderRadius: "6px",
				background: "var(--dsw-alias-bg-layer-1, transparent)"
			},
			preview: {
				display: "inline-flex",
				alignItems: "center",
				justifyContent: "center",
				width: "32px",
				height: "32px",
				overflow: "hidden"
			},
			previewImage: {
				width: "28px",
				height: "28px",
				objectFit: "contain"
			},
			button: {
				font: "inherit",
				cursor: "pointer",
				padding: "4px 12px",
				color: "inherit",
				border: "1px solid var(--dsw-alias-border-l2, #555)",
				borderRadius: "6px",
				background: "var(--dsw-alias-bg-layer-1, transparent)"
			},
			ok: {
				color: "var(--dsw-alias-state-success-primary, #3c3)",
				fontSize: "13px"
			},
			error: {
				color: "var(--dsw-alias-state-error-primary, #c33)",
				fontSize: "13px"
			}
		};
		/** Read one file as a data URI. */
		function toDataUrl(file) {
			return new Promise((resolve, reject) => {
				const reader = new FileReader();
				reader.onload = () => {
					if (typeof reader.result === "string") resolve(reader.result);
					else reject(/* @__PURE__ */ new Error("the file reader produced a non-string result"));
				};
				reader.onerror = () => {
					reject(reader.error ?? /* @__PURE__ */ new Error("the file could not be read"));
				};
				reader.readAsDataURL(file);
			});
		}
		/** Whole kilobytes, rounded up so an over-limit file never reads as the limit. */
		function kilobytes(bytes) {
			return Math.max(1, Math.ceil(bytes / 1024));
		}
		function failureText(error) {
			return error instanceof Error ? error.message : String(error);
		}
		/** `<input type="color">` accepts only a six-digit hex value. */
		function hexColor(value) {
			return /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#e60012";
		}
		/**
		* Render the plugin's row configuration page.
		* @param props - composed slot props and the injected settings face.
		* @returns the settings form, or the row's one-line description.
		*/
		function SkinPanel({ view, useConfig, t, save, reset }) {
			const config = useConfig((current) => current);
			const [draft, setDraft] = (0, react.useState)(config);
			const [seeded, setSeeded] = (0, react.useState)(config);
			const [state, setState] = (0, react.useState)({ kind: "idle" });
			if (seeded !== config) {
				setSeeded(config);
				setDraft(config);
			}
			if (view === "summary") return t("summary");
			const edit = (patch) => {
				setDraft((current) => ({
					...current,
					...patch
				}));
				setState({ kind: "idle" });
			};
			const commit = async (write) => {
				setState({ kind: "saving" });
				try {
					await write();
					setState({ kind: "saved" });
				} catch (error) {
					setState({
						kind: "failed",
						detail: failureText(error)
					});
				}
			};
			const onFile = (event) => {
				const file = event.target.files?.[0];
				event.target.value = "";
				if (file === void 0) return;
				if (file.size > 1048576) {
					setState({
						kind: "failed",
						detail: t("iconTooLarge", {
							kb: kilobytes(file.size),
							limit: kilobytes(UPLOAD_MAX_BYTES)
						})
					});
					return;
				}
				toDataUrl(file).then((dataUrl) => {
					edit({ icon: dataUrl });
				}, (error) => {
					setState({
						kind: "failed",
						detail: failureText(error)
					});
				});
			};
			const dataIcon = draft.icon.startsWith("data:");
			const busy = state.kind === "saving";
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				style: styles.wrap,
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: styles.field,
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							style: styles.label,
							children: t("title")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							style: styles.hint,
							children: t("intro")
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: styles.field,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								style: styles.label,
								children: t("iconLabel")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								style: styles.row,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										style: styles.preview,
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
											style: styles.previewImage,
											src: resolveIconSource(draft.icon),
											alt: t("iconPreview")
										})
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										type: "file",
										accept: "image/svg+xml,image/gif,image/webp,image/png",
										onChange: onFile
									}),
									draft.icon === "" ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										style: styles.button,
										onClick: () => {
											edit({ icon: "" });
										},
										children: t("iconClear")
									})
								]
							}),
							dataIcon ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								style: styles.hint,
								children: t("iconIsData", { kb: kilobytes(draft.icon.length) })
							}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
								style: styles.field,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									style: styles.hint,
									children: t("iconUrlLabel")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									style: styles.input,
									type: "text",
									value: draft.icon,
									placeholder: t("iconUrlPlaceholder"),
									onChange: (event) => {
										edit({ icon: event.target.value });
									}
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								style: styles.hint,
								children: t("iconHint")
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
						style: styles.field,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								style: styles.label,
								children: t("textLabel")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
								style: styles.input,
								type: "text",
								value: draft.text,
								onChange: (event) => {
									edit({ text: event.target.value });
								}
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								style: styles.hint,
								children: t("textHint")
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: styles.field,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								style: styles.label,
								children: t("colorLabel")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								style: styles.row,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									type: "color",
									value: hexColor(draft.color),
									onChange: (event) => {
										edit({ color: event.target.value });
									}
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									style: styles.input,
									type: "text",
									value: draft.color,
									onChange: (event) => {
										edit({ color: event.target.value });
									}
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								style: styles.hint,
								children: t("colorHint")
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: styles.field,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
								style: styles.row,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: draft.spin,
									onChange: (event) => {
										edit({ spin: event.target.checked });
									}
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									style: styles.label,
									children: t("spinLabel")
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
								style: styles.row,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									style: styles.hint,
									children: t("spinSecondsLabel")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									style: styles.input,
									type: "number",
									min: .2,
									max: 60,
									step: .1,
									value: draft.spinSeconds,
									onChange: (event) => {
										edit({ spinSeconds: Number(event.target.value) });
									}
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								style: styles.hint,
								children: t("spinSecondsHint")
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						style: styles.row,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								style: styles.button,
								disabled: busy,
								onClick: () => {
									commit(() => save(draft));
								},
								children: busy ? t("saving") : t("save")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								style: styles.button,
								disabled: busy,
								onClick: () => {
									setDraft({ ...DEFAULT_SKIN });
									commit(() => reset());
								},
								children: t("resetAll")
							}),
							state.kind === "saved" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								style: styles.ok,
								children: t("saved")
							}) : null,
							state.kind === "failed" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								style: styles.error,
								children: [t("saveFailed"), state.detail]
							}) : null
						]
					})
				]
			});
		}
		//#endregion
		//#region src/client/patcher.ts
		/**
		* The running-status skin.
		*
		* DSH 0.2.x renders the running indicator inline in `ChatView` rather than
		* through a slot, and its copy belongs to a locale namespace another plugin
		* already owns (`LocaleRuntime.register` throws on an occupied (namespace,
		* locale)). A browser plugin therefore has exactly one lever: edit the
		* rendered element. This module owns that edit and nothing else.
		*
		* The markup it targets (verified against the shipped dsh 0.2.0-rc.1 bundle):
		*
		*   <div class="<hash>_running" data-chat-running>
		*     <span role="status" …>深度求索中...</span>          ← accessibility copy, left alone
		*     <span class="<hash>_runningDivider" …></span>
		*     <span class="<hash>_runningContent">
		*       <span class="<hash>_runningIcon"><svg …/></span>   ← the only <svg> inside
		*       <span class="<hash>_runningText" data-text-shimmer>深度求索中，用时 16分0秒...</span>
		*     </span>
		*   </div>
		*
		* Every step is a no-op when the markup is not what it expects, so a changed
		* DSH layout degrades to "the skin does nothing" rather than a broken page.
		*/
		/** The running-status element. */
		const RUNNING_SELECTOR = "[data-chat-running]";
		/** The visible label, carrying the localization's full sentence. */
		const TEXT_SELECTOR = "[data-text-shimmer]";
		/** The visually hidden copy of the bare "deep diving" phrase. */
		const STATUS_TEXT_SELECTOR = "[role=\"status\"]";
		/** Marks the icon node this plugin inserted. */
		const ICON_ATTRIBUTE = "data-dsh-deep-diving-skin-icon";
		/** The one CSS custom property the running line takes its colour from. */
		const COLOR_PROPERTY = "--dsw-alias-label-deep-diving";
		/** Keyframes name injected by this plugin. */
		const SPIN_KEYFRAMES = "dsh-deep-diving-skin-spin";
		/** Marks the stylesheet this plugin injected. */
		const STYLE_ATTRIBUTE = "data-dsh-deep-diving-skin-style";
		/** Ellipsis and whitespace ending the bare phrase. */
		const TRAILING_PUNCTUATION = /[.。…\s]+$/;
		/** Matches the built-in icon box so a replacement occupies the same slot. */
		const ICON_SIZE = "calc(14px + var(--dsh-content-font-delta, 0px))";
		function ensureStyleTag() {
			const existing = document.head.querySelector(`style[${STYLE_ATTRIBUTE}]`);
			if (existing !== null) return existing;
			const style = document.createElement("style");
			style.setAttribute(STYLE_ATTRIBUTE, "");
			style.textContent = `@keyframes ${SPIN_KEYFRAMES} { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`;
			document.head.append(style);
			return style;
		}
		function iconNode(content) {
			for (const child of content.children) if (child.hasAttribute(ICON_ATTRIBUTE)) return child;
			const icon = document.createElement("span");
			icon.setAttribute(ICON_ATTRIBUTE, "");
			icon.setAttribute("aria-hidden", "true");
			icon.style.display = "inline-block";
			icon.style.flex = "none";
			icon.style.backgroundRepeat = "no-repeat";
			icon.style.backgroundPosition = "center";
			icon.style.backgroundSize = "contain";
			content.prepend(icon);
			return icon;
		}
		/**
		* Accept a configured colour only when the browser parses it, so a typo in the
		* settings file shows the shipped red instead of an unset colour.
		* @param value - configured CSS colour.
		* @returns the configured colour, or the shipped default.
		*/
		function usableColor(value) {
			if (value.length === 0) return DEFAULT_SKIN.color;
			return (typeof CSS !== "undefined" && typeof CSS.supports === "function" ? CSS.supports("color", value) : true) ? value : DEFAULT_SKIN.color;
		}
		/**
		* Replace the bare phrase at the head of the visible label, keeping the
		* elapsed-time suffix the harness appends. React rewrites that text node on
		* every clock tick, so this is re-applied from the mutation observer.
		*/
		function patchText(text, heading, replacement, written) {
			const onScreen = text.textContent ?? "";
			const previous = written.get(text);
			const ours = previous !== void 0 && previous.written === onScreen;
			if (ours && previous.replacement === replacement) return;
			const current = ours ? previous.original : onScreen;
			if (heading === "" || !current.startsWith(heading)) return;
			const desired = `${replacement}${current.slice(heading.length)}`;
			if (desired === onScreen) return;
			written.set(text, {
				written: desired,
				original: current,
				replacement
			});
			text.textContent = desired;
		}
		/**
		* Start the skin: patch every running-status element now, on every
		* configuration change, and after every DOM mutation React commits.
		* @param source - the live configuration.
		* @returns the disposer that retracts every write.
		*/
		function startSkin(source) {
			const style = ensureStyleTag();
			const hiddenSvgs = /* @__PURE__ */ new Map();
			const tinted = /* @__PURE__ */ new Map();
			const written = /* @__PURE__ */ new Map();
			const iconStates = /* @__PURE__ */ new WeakMap();
			let stopped = false;
			let scheduled = false;
			const apply = () => {
				const config = source.getSnapshot();
				const icon = resolveIconSource(config.icon);
				const color = usableColor(config.color);
				const animation = config.spin ? `${SPIN_KEYFRAMES} ${String(config.spinSeconds)}s linear infinite` : "none";
				for (const element of document.querySelectorAll(RUNNING_SELECTOR)) {
					const text = element.querySelector(TEXT_SELECTOR);
					const content = text === null ? null : text.parentElement;
					if (text === null || content === null) continue;
					const svg = element.querySelector("svg");
					if (svg !== null) {
						if (!hiddenSvgs.has(svg)) hiddenSvgs.set(svg, svg.style.display);
						if (svg.style.display !== "none") svg.style.display = "none";
					}
					const node = iconNode(content);
					const appearance = `${icon}\u0000${animation}`;
					if (iconStates.get(node) !== appearance) {
						iconStates.set(node, appearance);
						node.style.backgroundImage = `url("${icon}")`;
						node.style.width = ICON_SIZE;
						node.style.height = ICON_SIZE;
						node.style.animation = animation;
					}
					if (!tinted.has(element)) tinted.set(element, element.style.getPropertyValue(COLOR_PROPERTY));
					if (element.style.getPropertyValue(COLOR_PROPERTY) !== color) element.style.setProperty(COLOR_PROPERTY, color);
					patchText(text, (element.querySelector(STATUS_TEXT_SELECTOR)?.textContent ?? "").replace(TRAILING_PUNCTUATION, ""), config.text, written);
				}
			};
			const schedule = () => {
				if (stopped || scheduled) return;
				scheduled = true;
				queueMicrotask(() => {
					scheduled = false;
					if (!stopped) apply();
				});
			};
			const observer = new MutationObserver(schedule);
			observer.observe(document.documentElement, {
				childList: true,
				subtree: true,
				characterData: true
			});
			const unsubscribe = source.subscribe(schedule);
			apply();
			return () => {
				stopped = true;
				observer.disconnect();
				unsubscribe();
				for (const [svg, display] of hiddenSvgs) if (svg.isConnected) svg.style.display = display;
				for (const [element, value] of tinted) {
					if (!element.isConnected) continue;
					if (value === "") element.style.removeProperty(COLOR_PROPERTY);
					else element.style.setProperty(COLOR_PROPERTY, value);
				}
				for (const [text, entry] of written) if (text.isConnected && text.textContent === entry.written) text.textContent = entry.original;
				for (const node of document.querySelectorAll(`[${ICON_ATTRIBUTE}]`)) node.remove();
				style.remove();
			};
		}
		//#endregion
		//#region src/client/store.ts
		/**
		* The live configuration the skin and the settings page share.
		*
		* The host document is authoritative; this module keeps one snapshot of it, an
		* observable source for the renderer's `hooks` compartment, and the two write
		* paths. A failed read leaves the shipped preset in place rather than blanking
		* the skin, because the plugin's job is to look like something.
		*/
		/**
		* Create the store for one plugin instance.
		* @returns the store over a fresh snapshot.
		*/
		function createSkinStore() {
			let snapshot = { ...DEFAULT_SKIN };
			const listeners = /* @__PURE__ */ new Set();
			const config = {
				getSnapshot: () => snapshot,
				subscribe: (listener) => {
					listeners.add(listener);
					return () => {
						listeners.delete(listener);
					};
				}
			};
			const publish = (next) => {
				snapshot = next;
				for (const listener of [...listeners]) listener();
				return next;
			};
			const request = async (method, body) => {
				const response = await fetch(SKIN_API_PATH, {
					method,
					...body === void 0 ? {} : {
						headers: { "content-type": "application/json" },
						body: JSON.stringify(body)
					}
				});
				const text = await response.text();
				let payload;
				try {
					payload = JSON.parse(text);
				} catch {
					throw new Error(`settings API answered HTTP ${String(response.status)} with a non-JSON body`);
				}
				if (!response.ok || payload.ok !== true) {
					const message = payload.error?.message;
					throw new Error(typeof message === "string" ? message : `settings API answered HTTP ${String(response.status)}`);
				}
				return publish(normalizeSkinConfig(payload.value));
			};
			return {
				config,
				async load() {
					try {
						await request("GET");
					} catch (error) {
						console.warn("dsh-deep-diving-skin: settings unavailable, keeping the shipped preset", error);
					}
				},
				save(patch) {
					return request("PUT", {
						...snapshot,
						...patch
					});
				},
				reset() {
					return request("PUT", { ...DEFAULT_SKIN });
				}
			};
		}
		//#endregion
		//#region src/client/index.tsx
		/** Services this half needs: the slot registry and the locale registry. */
		const inject = ["slots", "locale"];
		/**
		* Register the dictionaries, start the skin, and contribute the row's
		* configuration page.
		* @param ctx - client plugin context.
		*/
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(SKIN_NS, {
				zh,
				en
			}), "deep-diving-skin: dictionaries");
			const store = createSkinStore();
			ctx.effect(() => startSkin(store.config), "deep-diving-skin: running-status skin");
			store.load();
			ctx.slots.inject("plugins.row.config", () => ctx.slots.register({
				name: "plugins.row.config",
				key: SKIN_ROW_CONFIG_KEY,
				locale: SKIN_NS,
				inject: () => ({
					hooks: { config: store.config },
					save: store.save,
					reset: store.reset
				})
			}, SkinPanel));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map