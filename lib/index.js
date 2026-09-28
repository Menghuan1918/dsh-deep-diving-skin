import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { homedir } from "node:os";
/** Route prefix the host half registers (loopback + same-origin fenced). */
const SKIN_API_PREFIX = "/deep-diving-skin/api";
/** Rotation period bounds, in seconds. */
const SPIN_SECONDS_MIN = .2;
/** The shipped defaults. */
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
/**
* Strict check behind a settings write. A write is rejected with a reason
* instead of being silently coerced, so the settings page can tell the user
* what is wrong with the value they just typed.
* @param value - raw request body.
* @returns the first problem found, or undefined when the body is writable.
*/
function skinConfigProblem(value) {
	if (typeof value !== "object" || value === null || Array.isArray(value)) return "expected a JSON object";
	const raw = value;
	if (raw.icon !== void 0) {
		if (typeof raw.icon !== "string") return "icon must be a string";
		if (raw.icon !== "" && !isIconSource(raw.icon)) return "icon must be empty, a data:image/* URI, an http(s) URL, or a / path (and at most 2 MiB)";
	}
	if (raw.text !== void 0) {
		if (typeof raw.text !== "string" || raw.text.length === 0 || raw.text.length > 200) return `text must be a non-empty string of at most ${String(200)} characters`;
	}
	if (raw.color !== void 0 && (typeof raw.color !== "string" || !isColorValue(raw.color))) return `color must be a non-empty CSS color of at most ${String(64)} characters`;
	if (raw.spin !== void 0 && typeof raw.spin !== "boolean") return "spin must be a boolean";
	if (raw.spinSeconds !== void 0 && (typeof raw.spinSeconds !== "number" || !Number.isFinite(raw.spinSeconds))) return "spinSeconds must be a number";
}
//#endregion
//#region src/dsh-home.ts
/**
* Harness-home resolution, copied from `@deepseek-ai/dsh-home-paths`'
* `resolveDshHome` (`$DSH_HOME` over `~/.dsh`, `~` expanded, relative paths
* resolved against the process directory). Copied rather than depended on so
* the host half runs with no install-time dependency edge outside the harness
* itself; keep it in step with that package when the rule changes.
*/
/** Directory name of the default harness home under the operating-system home. */
const DSH_HOME_DIR_NAME = ".dsh";
/** Environment variable overriding the default harness home. */
const DSH_HOME_ENV = "DSH_HOME";
function expandHomePath(path) {
	if (path === "~") return homedir();
	if (path.startsWith("~/") || path.startsWith("~\\")) return join(homedir(), path.slice(2));
	return path;
}
/**
* Resolve the single-root harness home.
* @param configured - explicit override, which outranks the environment.
* @param env - environment mapping read for `DSH_HOME`.
* @returns the normalized absolute harness home.
*/
function resolveDshHome(configured, env = process.env) {
	const fromEnv = env[DSH_HOME_ENV];
	const base = fromEnv !== void 0 && fromEnv.trim().length > 0 ? fromEnv : join(homedir(), DSH_HOME_DIR_NAME);
	return resolve(expandHomePath(configured ?? base));
}
//#endregion
//#region src/store.ts
/**
* This plugin's settings document. One plain JSON file under the harness home,
* owned by this plugin alone: the harness settings RPC serves profile entries
* by row id, and a plugin-owned document keeps the icon blob out of the profile
* patch while surviving a browser change.
*/
/** File name of the settings document under the harness home. */
const SETTINGS_FILE_NAME = "deep-diving-skin.json";
/**
* Absolute path of the settings document.
* @param home - harness home; defaults to the process environment's.
* @returns the document path.
*/
function skinConfigPath(home = resolveDshHome()) {
	return join(home, SETTINGS_FILE_NAME);
}
/**
* Read the settings document. A missing, unreadable, or malformed document
* resolves to the defaults field by field, so there is always a usable
* usable configuration.
* @param file - absolute document path.
* @returns the stored configuration, or the defaults.
*/
function readSkinConfig(file) {
	try {
		return normalizeSkinConfig(JSON.parse(readFileSync(file, "utf8")));
	} catch {
		return { ...DEFAULT_SKIN };
	}
}
/**
* Replace the settings document with a normalized configuration.
* @param file - absolute document path.
* @param value - configuration to persist.
* @returns the normalized value that was written.
*/
function writeSkinConfig(file, value) {
	const normalized = normalizeSkinConfig(value);
	mkdirSync(dirname(file), { recursive: true });
	writeFileSync(file, `${JSON.stringify(normalized, null, 2)}\n`);
	return normalized;
}
//#endregion
//#region src/routes.ts
/** Largest accepted request body: a base64 icon data URI dominates it. */
const MAX_BODY_BYTES = 4194304;
function headerOf(req, name) {
	const value = req.headers[name];
	return typeof value === "string" ? value : void 0;
}
function parseAuthority(authority) {
	try {
		return new URL(`http://${authority}`);
	} catch {
		return;
	}
}
function isLoopbackHostname(hostname) {
	if (hostname === "localhost" || hostname === "[::1]") return true;
	const parts = hostname.split(".");
	return parts.length === 4 && parts[0] === "127" && parts.every((part) => /^\d{1,3}$/.test(part) && Number(part) <= 255);
}
/**
* Whether a request may read or write the settings document.
* @param req - incoming request.
* @param trustedHosts - reverse-proxy authorities additionally accepted.
* @returns true for a loopback (or listed) Host with a same-origin browser marker.
*/
function isTrustedApiRequest(req, trustedHosts) {
	const host = headerOf(req, "host");
	if (host === void 0) return false;
	const hostUrl = parseAuthority(host);
	if (hostUrl === void 0) return false;
	const trusted = trustedHosts.some((entry) => {
		const entryUrl = parseAuthority(entry);
		return entryUrl !== void 0 && entryUrl.host === hostUrl.host;
	});
	if (!isLoopbackHostname(hostUrl.hostname) && !trusted) return false;
	if (headerOf(req, "sec-fetch-site") === "cross-site") return false;
	const origin = headerOf(req, "origin");
	if (origin === void 0) return true;
	try {
		return new URL(origin).host === hostUrl.host;
	} catch {
		return false;
	}
}
function writeJson(res, status, body) {
	res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
	res.end(JSON.stringify(body));
}
function writeError(res, status, code, message) {
	writeJson(res, status, {
		ok: false,
		error: {
			code,
			message
		}
	});
}
async function readJsonBody(req) {
	const chunks = [];
	let total = 0;
	for await (const chunk of req) {
		const buffer = typeof chunk === "string" ? Buffer.from(chunk) : chunk;
		total += buffer.length;
		if (total > 4194304) throw new Error(`request body exceeds ${String(MAX_BODY_BYTES)} bytes`);
		chunks.push(buffer);
	}
	const text = Buffer.concat(chunks).toString("utf8").trim();
	if (text === "") throw new Error("empty request body");
	return JSON.parse(text);
}
/**
* Serve one settings request.
* @param req - incoming request.
* @param res - response to write.
* @param options - trusted authorities and the settings document path.
*/
async function handleSkinRequest(req, res, options) {
	if (!isTrustedApiRequest(req, options.trustedHosts)) {
		writeError(res, 403, "forbidden", "forbidden");
		return;
	}
	const pathname = new URL(req.url ?? "/", "http://dsh.internal").pathname;
	if (pathname !== "/deep-diving-skin/api/config") {
		writeError(res, 404, "not-found", `unknown settings API path: ${pathname}`);
		return;
	}
	if (req.method === "GET") {
		writeJson(res, 200, {
			ok: true,
			value: readSkinConfig(options.configPath)
		});
		return;
	}
	if (req.method === "PUT") {
		let body;
		try {
			body = await readJsonBody(req);
		} catch (error) {
			writeError(res, 400, "bad-request", error instanceof Error ? error.message : String(error));
			return;
		}
		const problem = skinConfigProblem(body);
		if (problem !== void 0) {
			writeError(res, 400, "bad-request", problem);
			return;
		}
		const merged = {
			...readSkinConfig(options.configPath),
			...body
		};
		writeJson(res, 200, {
			ok: true,
			value: writeSkinConfig(options.configPath, merged)
		});
		return;
	}
	writeError(res, 405, "method-error", `method not allowed: ${String(req.method)}`);
}
/**
* Register the fenced settings route on an already-resolved web server.
* @param ctx - context carrying the `webServer` service.
* @param options - trusted authorities and the settings document path.
*/
function registerSkinRoutes(ctx, options) {
	ctx.effect(() => ctx.webServer.register({
		kind: "prefix",
		path: SKIN_API_PREFIX,
		handler: (req, res) => handleSkinRequest(req, res, options)
	}), "deep-diving-skin: settings API");
}
//#endregion
//#region src/index.ts
/** Cordis plugin name. The profile row id is declared by cordis.patch.yml. */
const name = "dsh-deep-diving-skin";
/**
* Register the settings API the browser half reads and writes.
* @param ctx - host plugin context.
* @param config - row configuration.
*/
function apply(ctx, config) {
	const trustedHosts = (config?.trustedHosts ?? []).filter((entry) => typeof entry === "string");
	const configPath = skinConfigPath();
	ctx.inject(["webServer"], (webCtx) => {
		registerSkinRoutes(webCtx, {
			trustedHosts,
			configPath
		});
	});
}
//#endregion
export { apply, name };
