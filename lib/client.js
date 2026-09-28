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
		/** The shipped defaults. */
		const DEFAULT_SKIN = {
			icon: "",
			text: "少女祈祷中",
			color: "#e60012",
			shimmerColor: "",
			spin: true,
			spinSeconds: 3
		};
		/**
		* Derive the sweep colour from the text colour, so the shipped look never
		* falls back to the theme's own shimmer blue. Uses `color-mix`, which the
		* theme's own sheets already rely on; a browser without it drops the
		* declaration and keeps whatever the theme provided.
		* @param color - the already-validated text colour.
		* @returns a translucent tint of that colour.
		*/
		function derivedShimmerColor(color) {
			return `color-mix(in oklab, ${color} 55%, transparent)`;
		}
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
				shimmerColor: typeof raw.shimmerColor === "string" && (raw.shimmerColor === "" || isColorValue(raw.shimmerColor)) ? raw.shimmerColor : DEFAULT_SKIN.shimmerColor,
				spin: typeof raw.spin === "boolean" ? raw.spin : DEFAULT_SKIN.spin,
				spinSeconds: clampSpinSeconds(raw.spinSeconds)
			};
		}
		//#endregion
		//#region src/client/locales.ts
		/** Simplified Chinese dictionary. */
		const zh = {
			"nav": "运行状态",
			"summary": "替换运行中那行状态提示的图标、文本与颜色。",
			"title": "运行状态提示",
			"intro": "这些设置只作用于会话运行时的那行状态提示，保存后立即生效。",
			"iconLabel": "图标",
			"iconHint": "支持 SVG、GIF、WebP、PNG。上传的文件会转成 data URI 存进配置。",
			"iconUpload": "选择图片文件",
			"iconTooLarge": "图片太大（{kb} KB），上限 {limit} KB。",
			"iconIsData": "当前使用上传的图片（约 {kb} KB）。",
			"iconClear": "清除图标",
			"iconUrlLabel": "图片地址",
			"iconUrlPlaceholder": "https://example.com/icon.svg 或 /assets/icon.svg",
			"iconPreview": "图标预览",
			"textLabel": "文本",
			"textHint": "替换「深度求索中」，后面的「用时 …」保持不变。",
			"colorLabel": "颜色",
			"colorHint": "作用于这一行文字。",
			"shimmerLabel": "高亮扫光",
			"shimmerHint": "扫过文字的那道亮带的颜色。留空则跟随上面的颜色。",
			"shimmerFollow": "跟随文本颜色",
			"spinLabel": "旋转图标",
			"spinSecondsLabel": "旋转周期（秒）",
			"spinSecondsHint": "0.2 – 60 秒转一圈。",
			"save": "保存",
			"saving": "保存中…",
			"saved": "已保存",
			"saveFailed": "保存失败：",
			"resetAll": "恢复默认"
		};
		/** English dictionary, key-identical to the Chinese source of truth. */
		const en = {
			"nav": "Running status",
			"summary": "Replace the icon, text and colour of the running-status line.",
			"title": "Running-status line",
			"intro": "These settings apply to the status line shown while a session runs, and take effect as soon as they are saved.",
			"iconLabel": "Icon",
			"iconHint": "SVG, GIF, WebP and PNG are supported. An uploaded file is stored as a data URI.",
			"iconUpload": "Choose an image file",
			"iconTooLarge": "Image is too large ({kb} KB); the limit is {limit} KB.",
			"iconIsData": "Using the uploaded image (about {kb} KB).",
			"iconClear": "Clear icon",
			"iconUrlLabel": "Image URL",
			"iconUrlPlaceholder": "https://example.com/icon.svg or /assets/icon.svg",
			"iconPreview": "Icon preview",
			"textLabel": "Text",
			"textHint": "Replaces 「深度求索中」; the 「用时 …」 suffix is kept as is.",
			"colorLabel": "Colour",
			"colorHint": "Applies to this line's text only.",
			"shimmerLabel": "Highlight sweep",
			"shimmerHint": "Colour of the band that sweeps across the text. Empty follows the colour above.",
			"shimmerFollow": "Follow the text colour",
			"spinLabel": "Rotate the icon",
			"spinSecondsLabel": "Rotation period (seconds)",
			"spinSecondsHint": "0.2 – 60 seconds per turn.",
			"save": "Save",
			"saving": "Saving…",
			"saved": "Saved",
			"saveFailed": "Save failed: ",
			"resetAll": "Reset to defaults"
		};
		//#endregion
		//#region src/client/art.ts
		/**
		* The default icon: a yin-yang as a self-contained SVG data URI.
		* Geometry (viewBox 0 0 100 100):
		*
		* - outer disc r=49, white with a dark rim;
		* - the filled half is bounded by the outer circle's LEFT arc from (50,1) to
		*   (50,99) and returns through two half-radius circles — the lower one
		*   (r=24.5, centre (50,74.5)) bulging right, the upper one (centre
		*   (50,25.5)) bulging left, which is the classic S;
		* - each lobe carries its counter-coloured eye at its circle's centre.
		*/
		/** The default icon markup. Kept as markup so the data URI is generated safely. */
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
		* The plugin's settings page. One component serves both registration sites:
		* the Plugins page asks for `view: 'summary'` (its one-line description) or
		* `view: 'page'` (the form), and the Settings section renders the form alone.
		* Styling comes from the injected `dds-` stylesheet in `styles.ts`.
		*/
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
		* The colour a picker shows for a field that may be empty. An empty sweep
		* follows the text colour, so the picker shows that rather than a placeholder.
		*/
		function pickerColor(value, fallback) {
			return /^#[0-9a-fA-F]{6}$/.test(value) ? value : fallback;
		}
		/**
		* Render the settings form.
		* @param props - the slot props plus the injected settings face.
		* @returns the row's one-line description, or the form.
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
			const busy = state.kind === "saving";
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: "dds-page",
				children: [
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dds-field",
						children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							className: "dds-card-title",
							children: t("title")
						}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
							className: "dds-hint",
							children: t("intro")
						})]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						className: "dds-card",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "dds-label",
								children: t("iconLabel")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dds-row",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "dds-preview",
										children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)("img", {
											className: "dds-preview-image",
											src: resolveIconSource(draft.icon),
											alt: t("iconPreview")
										})
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
										className: "dds-picker",
										type: "file",
										accept: "image/svg+xml,image/gif,image/webp,image/png",
										onChange: onFile
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
										className: "dds-button",
										type: "button",
										disabled: busy || draft.icon === "",
										onClick: () => {
											edit({ icon: "" });
										},
										children: t("iconClear")
									})
								]
							}),
							draft.icon.startsWith("data:") ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: "dds-hint",
								children: t("iconIsData", { kb: kilobytes(draft.icon.length) })
							}) : /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
								className: "dds-field",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "dds-hint",
									children: t("iconUrlLabel")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									className: "dds-input",
									type: "text",
									value: draft.icon,
									placeholder: t("iconUrlPlaceholder"),
									onChange: (event) => {
										edit({ icon: event.target.value });
									}
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: "dds-hint",
								children: t("iconHint")
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						className: "dds-card",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
								className: "dds-field",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "dds-label",
									children: t("textLabel")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									className: "dds-input",
									type: "text",
									value: draft.text,
									onChange: (event) => {
										edit({ text: event.target.value });
									}
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
								className: "dds-hint",
								children: t("textHint")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dds-field",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "dds-label",
										children: t("colorLabel")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "dds-row",
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											className: "dds-color",
											type: "color",
											"aria-label": t("colorLabel"),
											value: hexColor(draft.color),
											onChange: (event) => {
												edit({ color: event.target.value });
											}
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
											className: "dds-input",
											type: "text",
											value: draft.color,
											onChange: (event) => {
												edit({ color: event.target.value });
											}
										})]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
										className: "dds-hint",
										children: t("colorHint")
									})
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: "dds-field",
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: "dds-label",
										children: t("shimmerLabel")
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: "dds-row",
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
												className: "dds-color",
												type: "color",
												"aria-label": t("shimmerLabel"),
												value: pickerColor(draft.shimmerColor, hexColor(draft.color)),
												onChange: (event) => {
													edit({ shimmerColor: event.target.value });
												}
											}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
												className: "dds-input",
												type: "text",
												value: draft.shimmerColor,
												placeholder: t("shimmerFollow"),
												onChange: (event) => {
													edit({ shimmerColor: event.target.value });
												}
											}),
											draft.shimmerColor === "" ? null : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
												className: "dds-button",
												type: "button",
												disabled: busy,
												onClick: () => {
													edit({ shimmerColor: "" });
												},
												children: t("shimmerFollow")
											})
										]
									}),
									/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
										className: "dds-hint",
										children: t("shimmerHint")
									})
								]
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						className: "dds-card",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
								className: "dds-row",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: draft.spin,
									onChange: (event) => {
										edit({ spin: event.target.checked });
									}
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "dds-label",
									children: t("spinLabel")
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("label", {
								className: "dds-row",
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: "dds-hint",
									children: t("spinSecondsLabel")
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("input", {
									className: "dds-input dds-input-number",
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
								className: "dds-hint",
								children: t("spinSecondsHint")
							})
						]
					}),
					/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
						className: "dds-actions",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								className: "dds-button dds-button-primary",
								type: "button",
								disabled: busy,
								onClick: () => {
									commit(() => save(draft));
								},
								children: busy ? t("saving") : t("save")
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
								className: "dds-button",
								type: "button",
								disabled: busy,
								onClick: () => {
									setDraft({ ...DEFAULT_SKIN });
									commit(() => reset());
								},
								children: t("resetAll")
							}),
							state.kind === "saved" ? /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: "dds-status dds-status-ok",
								children: t("saved")
							}) : null,
							state.kind === "failed" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: "dds-status dds-status-error",
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
		* DSH renders the running indicator inline in `ChatView` rather than through a
		* slot, and its copy belongs to a locale namespace another plugin already owns
		* (`LocaleRuntime.register` throws on an occupied (namespace, locale)). A
		* browser plugin therefore has exactly one lever: edit the rendered element.
		* This module owns that edit and nothing else.
		*
		* The element it targets, as the running build renders it:
		*
		*   <div data-chat-running>
		*     <span role="status" …>深度求索中...</span>            ← the bare phrase, read (never written)
		*     <span class="…_runningDivider" …></span>
		*     <span class="…_runningContent">
		*       <span class="…_runningIcon"><svg …/></span>          ← hidden while the skin is on
		*       <span class="…_runningText" data-shimmer>            ← the shimmer root
		*         <span class="…_content"><span class="…_text">深度求索中，用时 2分24秒...</span></span>
		*         <span class="…_decoration"><span class="…_sweep"><span class="…_content …_highlight">
		*           <span class="…_text" data-shimmer-text="深度求索中，用时 2分24秒..."></span>
		*
		* The label exists twice: once as the visible span's text, and once as the
		* `data-shimmer-text` attribute of the highlight copy, which CSS paints with
		* `content: attr(data-shimmer-text)`. Both are rewritten, so the sweep cannot
		* draw the old phrase over the new one.
		*
		* Every step is a no-op when the markup is not what it expects, so a changed
		* layout degrades to "the skin does nothing" rather than a broken page.
		*/
		/** The running-status element. */
		const RUNNING_SELECTOR = "[data-chat-running]";
		/** The shimmer root: its parent is the row holding the icon and the label. */
		const SHIMMER_SELECTOR = "[data-shimmer]";
		/** The attribute the highlight copy paints its text from. */
		const SHIMMER_TEXT_ATTRIBUTE = "data-shimmer-text";
		/** The visually hidden copy of the bare "deep diving" phrase. */
		const STATUS_TEXT_SELECTOR = "[role=\"status\"]";
		/** Marks the icon node this plugin inserted. */
		const ICON_ATTRIBUTE = "data-dsh-deep-diving-skin-icon";
		/** The CSS custom property the running line takes its colour from. */
		const COLOR_PROPERTY = "--dsw-alias-label-deep-diving";
		/** The CSS custom property the sweep band paints with. */
		const SHIMMER_COLOR_PROPERTY = "--dsw-alias-label-shimmer";
		/** Keyframes name injected by this plugin. */
		const SPIN_KEYFRAMES = "dsh-deep-diving-skin-spin";
		/**
		* Marks the keyframes sheet this plugin injected. Deliberately NOT the
		* attribute `styles.ts` uses for the page stylesheet: two owners sharing one
		* attribute is how the keyframes silently went missing once already.
		*/
		const STYLE_ATTRIBUTE$1 = "data-dsh-deep-diving-skin-spin";
		/** Ellipsis and whitespace ending the bare phrase. */
		const TRAILING_PUNCTUATION = /[.。…\s]+$/;
		/** Matches the built-in icon box so a replacement occupies the same slot. */
		const ICON_SIZE = "calc(14px + var(--dsh-content-font-delta, 0px))";
		function ensureStyleTag() {
			const existing = document.head.querySelector(`style[${STYLE_ATTRIBUTE$1}]`);
			if (existing !== null) return existing;
			const style = document.createElement("style");
			style.setAttribute(STYLE_ATTRIBUTE$1, "");
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
		* The row holding the built-in icon and the label: the nearest ancestor of the
		* icon that is a direct child of the running element, else the shimmer root's
		* parent.
		* @param element - running-status element.
		* @param svg - the built-in icon glyph, when present.
		* @returns the row to insert the replacement icon into.
		*/
		function contentRow(element, svg) {
			if (svg !== null) {
				let node = svg.parentElement;
				while (node !== null && node.parentElement !== element) node = node.parentElement;
				if (node !== null) return node;
			}
			const shimmer = element.querySelector(SHIMMER_SELECTOR);
			return shimmer === null ? null : shimmer.parentElement;
		}
		/**
		* Accept a configured colour only when the browser parses it, so a typo in the
		* settings file shows the default instead of an unset colour.
		* @param value - configured CSS colour.
		* @returns the configured colour, or the shipped default.
		*/
		function usableColor(value) {
			if (value.length === 0) return DEFAULT_SKIN.color;
			return (typeof CSS !== "undefined" && typeof CSS.supports === "function" ? CSS.supports("color", value) : true) ? value : DEFAULT_SKIN.color;
		}
		/**
		* Replace the bare phrase at the head of one string, keeping the elapsed-time
		* suffix. React rewrites both copies on every clock tick, so this is re-applied
		* from the mutation observer.
		* @param node - element the value belongs to.
		* @param heading - localized phrase to replace, as the harness wrote it.
		* @param replacement - configured text.
		* @param read - read the current value.
		* @param write - write a replaced value.
		* @param written - records of this plugin's own writes, for idempotence and restore.
		*/
		function patchSlot(node, heading, replacement, read, write, written) {
			const onScreen = read();
			const previous = written.get(node);
			const ours = previous !== void 0 && previous.written === onScreen;
			if (ours && previous.replacement === replacement) return;
			const current = ours ? previous.original : onScreen;
			if (heading === "" || !current.startsWith(heading)) return;
			const desired = `${replacement}${current.slice(heading.length)}`;
			if (desired === onScreen) return;
			written.set(node, {
				written: desired,
				original: current,
				replacement
			});
			write(desired);
		}
		/**
		* Start the skin: patch every running-status element now, on every
		* configuration change, and after every DOM mutation React commits.
		* @param source - the live configuration.
		* @returns the disposer that retracts every write.
		*/
		function startSkin(source) {
			const style = ensureStyleTag();
			const hidden = /* @__PURE__ */ new Map();
			const tinted = /* @__PURE__ */ new Map();
			const writtenText = /* @__PURE__ */ new Map();
			const writtenAttribute = /* @__PURE__ */ new Map();
			const iconStates = /* @__PURE__ */ new WeakMap();
			let stopped = false;
			let scheduled = false;
			const apply = () => {
				const config = source.getSnapshot();
				const icon = resolveIconSource(config.icon);
				const color = usableColor(config.color);
				const shimmer = config.shimmerColor === "" ? derivedShimmerColor(color) : usableColor(config.shimmerColor);
				const animation = config.spin ? `${SPIN_KEYFRAMES} ${String(config.spinSeconds)}s linear infinite` : "none";
				for (const element of document.querySelectorAll(RUNNING_SELECTOR)) {
					const svg = element.querySelector("svg");
					const content = contentRow(element, svg);
					if (content === null) continue;
					if (svg !== null) {
						const box = svg.parentElement ?? svg;
						const target = box === content ? svg : box;
						if (!hidden.has(target)) hidden.set(target, target.style.display);
						if (target.style.display !== "none") target.style.display = "none";
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
					let original = tinted.get(element);
					if (original === void 0) {
						original = {
							color: element.style.getPropertyValue(COLOR_PROPERTY),
							shimmer: element.style.getPropertyValue(SHIMMER_COLOR_PROPERTY)
						};
						tinted.set(element, original);
					}
					if (element.style.getPropertyValue(COLOR_PROPERTY) !== color) element.style.setProperty(COLOR_PROPERTY, color);
					if (element.style.getPropertyValue(SHIMMER_COLOR_PROPERTY) !== shimmer) element.style.setProperty(SHIMMER_COLOR_PROPERTY, shimmer);
					const status = element.querySelector(STATUS_TEXT_SELECTOR);
					const heading = (status?.textContent ?? "").replace(TRAILING_PUNCTUATION, "");
					for (const target of [element, ...element.querySelectorAll("*")]) {
						if (target === status || target.closest(STATUS_TEXT_SELECTOR) !== null) continue;
						if (target.childElementCount === 0) patchSlot(target, heading, config.text, () => target.textContent ?? "", (next) => {
							target.textContent = next;
						}, writtenText);
						if (target.hasAttribute(SHIMMER_TEXT_ATTRIBUTE)) patchSlot(target, heading, config.text, () => target.getAttribute(SHIMMER_TEXT_ATTRIBUTE) ?? "", (next) => {
							target.setAttribute(SHIMMER_TEXT_ATTRIBUTE, next);
						}, writtenAttribute);
					}
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
				for (const [target, display] of hidden) if (target.isConnected) target.style.display = display;
				for (const [element, value] of tinted) {
					if (!element.isConnected) continue;
					if (value.color === "") element.style.removeProperty(COLOR_PROPERTY);
					else element.style.setProperty(COLOR_PROPERTY, value.color);
					if (value.shimmer === "") element.style.removeProperty(SHIMMER_COLOR_PROPERTY);
					else element.style.setProperty(SHIMMER_COLOR_PROPERTY, value.shimmer);
				}
				for (const [target, entry] of writtenText) if (target.isConnected && target.textContent === entry.written) target.textContent = entry.original;
				for (const [target, entry] of writtenAttribute) if (target.isConnected && target.getAttribute(SHIMMER_TEXT_ATTRIBUTE) === entry.written) target.setAttribute(SHIMMER_TEXT_ATTRIBUTE, entry.original);
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
		* paths. A failed read leaves the defaults in place rather than blanking
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
						console.warn("dsh-deep-diving-skin: settings unavailable, keeping the defaults", error);
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
		//#region src/client/styles.ts
		/**
		* The settings page's stylesheet, injected as one `<style>` tag at plugin
		* activation. Every value is a DSH semantic token, so the page follows the
		* active light/dark theme and any user token overrides without a second
		* definition. Class names are prefixed `dds-` and live nowhere else.
		*
		* Token pairings (fill/foreground, card fill/stroke, focus ring) are copied
		* from the shipped components that already use them, so this page cannot drift
		* from the rest of the settings surface.
		*/
		/** Marks the injected stylesheet; also the removal handle. */
		const STYLE_ATTRIBUTE = "data-dsh-deep-diving-skin-style";
		const CSS$1 = `
.dds-page { display: flex; flex-direction: column; gap: 12px; max-width: 640px; }
.dds-card {
  display: flex; flex-direction: column; gap: 10px; padding: 14px 16px;
  background: var(--dsw-alias-settings-card-fill);
  border: 0.5px solid var(--dsw-alias-settings-card-stroke);
  border-radius: var(--dsw-radius-xl);
}
.dds-card-title { font: var(--dsw-font-s-strong-14); color: var(--dsw-alias-label-primary); }
.dds-field { display: flex; flex-direction: column; gap: 4px; }
.dds-label { font: var(--dsw-font-xs-strong-13); color: var(--dsw-alias-label-primary); }
.dds-hint { margin: 0; font: var(--dsw-font-xxs-12); color: var(--dsw-alias-label-tertiary); }
.dds-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.dds-input {
  box-sizing: border-box; width: 100%; padding: 6px 10px;
  font: var(--dsw-font-s-14); color: var(--dsw-alias-label-primary);
  background: var(--dsw-alias-bg-layer-1);
  border: 0.5px solid var(--dsw-alias-border-l2);
  border-radius: var(--dsw-radius-md);
}
.dds-input::placeholder { color: var(--dsw-alias-label-caption); }
.dds-input:focus-visible {
  outline: 2px solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary));
  outline-offset: 1px;
}
.dds-input-number { width: 96px; }
.dds-color {
  width: 44px; height: 32px; padding: 2px; flex: none; cursor: pointer;
  background: var(--dsw-alias-bg-layer-1);
  border: 0.5px solid var(--dsw-alias-border-l2);
  border-radius: var(--dsw-radius-md);
}
.dds-preview {
  display: inline-flex; align-items: center; justify-content: center; flex: none;
  width: 36px; height: 36px; overflow: hidden;
  background: var(--dsw-alias-bg-layer-2);
  border-radius: var(--dsw-radius-md);
}
.dds-preview-image { width: 26px; height: 26px; object-fit: contain; }
.dds-picker { font: var(--dsw-font-xs-13); color: var(--dsw-alias-label-secondary); }
.dds-button {
  font: var(--dsw-font-xs-strong-13); padding: 5px 12px; cursor: pointer;
  color: var(--dsw-alias-label-primary); background: transparent;
  border: 0.5px solid var(--dsw-alias-border-l2);
  border-radius: var(--dsw-radius-md);
}
.dds-button:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover); }
.dds-button:focus-visible {
  outline: 2px solid var(--dsw-focus-ring-color, var(--dsw-alias-state-business-primary));
  outline-offset: 1px;
}
.dds-button:disabled { opacity: 0.5; cursor: default; }
.dds-button-primary {
  color: var(--dsw-alias-label-primary-foreground);
  background: var(--dsw-alias-button-primary-fill);
  border-color: transparent;
}
.dds-button-primary:hover:not(:disabled) { background: var(--dsw-alias-button-primary-hover); }
.dds-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.dds-status { font: var(--dsw-font-xxs-12); }
.dds-status-ok { color: var(--dsw-alias-state-success-primary); }
.dds-status-error { color: var(--dsw-alias-state-error-primary); }
`;
		/**
		* Install the stylesheet once.
		* @returns the disposer removing the tag this call owns, or nothing when one already existed.
		*/
		function installStyles() {
			if (document.head.querySelector(`style[data-dsh-deep-diving-skin-style]`) !== null) return () => {};
			const tag = document.createElement("style");
			tag.setAttribute(STYLE_ATTRIBUTE, "");
			tag.textContent = CSS$1;
			document.head.append(tag);
			return () => {
				tag.remove();
			};
		}
		//#endregion
		//#region src/client/index.tsx
		/** Services this half needs: the slot registry and the locale registry. */
		const inject = ["slots", "locale"];
		/** Section key of this plugin's page inside the Settings dialog. */
		const SETTINGS_SECTION_ID = "deep-diving-skin";
		/** Nav position of that section; after the shipped ones, so their order stays put. */
		const SETTINGS_SECTION_ORDER = 60;
		/**
		* Register the dictionaries, install the stylesheet, start the skin, and
		* contribute the settings page to both of its seats.
		* @param ctx - client plugin context.
		*/
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(SKIN_NS, {
				zh,
				en
			}), "deep-diving-skin: dictionaries");
			const t = ctx.locale.bind(SKIN_NS);
			const store = createSkinStore();
			const injected = () => ({
				hooks: { config: store.config },
				save: store.save,
				reset: store.reset
			});
			ctx.effect(() => installStyles(), "deep-diving-skin: settings stylesheet");
			ctx.effect(() => startSkin(store.config), "deep-diving-skin: running-status skin");
			store.load();
			ctx.slots.inject("plugins.row.config", () => ctx.slots.register({
				name: "plugins.row.config",
				key: SKIN_ROW_CONFIG_KEY,
				locale: SKIN_NS,
				inject: injected
			}, SkinPanel));
			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: SETTINGS_SECTION_ID,
				order: SETTINGS_SECTION_ORDER,
				label: () => t("nav"),
				locale: SKIN_NS,
				inject: injected
			}, SkinPanel));
		}
		//#endregion
		exports.SETTINGS_SECTION_ID = SETTINGS_SECTION_ID;
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map