/**
 * Host-side settings API. The harness settings RPC addresses profile entries by
 * row id and has no renderer for a schema-generated form, so this plugin serves
 * its own configuration through a fenced route — the same shape
 * `dsh-better-sidebar` and `dsh-apollo` use.
 *
 * The exposed surface is a handful of cosmetic fields, so the security model
 * here is cross-site and DNS-rebinding defence rather than authentication: the
 * request must carry a loopback Host (or one the row config lists in
 * `trustedHosts`) and a same-origin browser marker. Worst case for a slipped
 * request is a changed icon.
 *
 * The handler reads and writes through {@link SkinRequest} / {@link SkinResponse}
 * rather than `IncomingMessage` / `ServerResponse`; Node's objects satisfy both,
 * and the narrow pair is what makes the route testable without a live socket.
 */
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-host-webserver'
import { SKIN_API_PATH, SKIN_API_PREFIX, skinConfigProblem } from './skin-config.ts'
import { readSkinConfig, writeSkinConfig } from './store.ts'

/** Largest accepted request body: a base64 icon data URI dominates it. */
export const MAX_BODY_BYTES = 4 * 1024 * 1024

/** The request surface this route reads. */
export interface SkinRequest {
  readonly method?: string | undefined
  readonly url?: string | undefined
  readonly headers: Readonly<Record<string, string | string[] | undefined>>
  [Symbol.asyncIterator](): AsyncIterator<string | Buffer>
}

/** The response surface this route writes. */
export interface SkinResponse {
  writeHead(status: number, headers: Record<string, string>): unknown
  end(body?: string): unknown
}

/** What the route needs from its composing row. */
export interface SkinRouteOptions {
  /** Reverse-proxy authorities additionally trusted, as `host` or `host:port`. */
  readonly trustedHosts: readonly string[]
  /** Absolute path of the settings document. */
  readonly configPath: string
}

function headerOf(req: SkinRequest, name: string): string | undefined {
  const value = req.headers[name]
  return typeof value === 'string' ? value : undefined
}

function parseAuthority(authority: string): URL | undefined {
  try {
    return new URL(`http://${authority}`)
  } catch {
    return undefined
  }
}

function isLoopbackHostname(hostname: string): boolean {
  if (hostname === 'localhost' || hostname === '[::1]') return true
  const parts = hostname.split('.')
  return parts.length === 4
    && parts[0] === '127'
    && parts.every(part => /^\d{1,3}$/.test(part) && Number(part) <= 255)
}

/**
 * Whether a request may read or write the settings document.
 * @param req - incoming request.
 * @param trustedHosts - reverse-proxy authorities additionally accepted.
 * @returns true for a loopback (or listed) Host with a same-origin browser marker.
 */
export function isTrustedApiRequest(req: SkinRequest, trustedHosts: readonly string[]): boolean {
  const host = headerOf(req, 'host')
  if (host === undefined) return false
  const hostUrl = parseAuthority(host)
  if (hostUrl === undefined) return false
  const trusted = trustedHosts.some((entry) => {
    const entryUrl = parseAuthority(entry)
    return entryUrl !== undefined && entryUrl.host === hostUrl.host
  })
  if (!isLoopbackHostname(hostUrl.hostname) && !trusted) return false
  if (headerOf(req, 'sec-fetch-site') === 'cross-site') return false
  const origin = headerOf(req, 'origin')
  if (origin === undefined) return true
  try {
    return new URL(origin).host === hostUrl.host
  } catch {
    return false
  }
}

function writeJson(res: SkinResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(body))
}

function writeError(res: SkinResponse, status: number, code: string, message: string): void {
  writeJson(res, status, { ok: false, error: { code, message } })
}

async function readJsonBody(req: SkinRequest): Promise<unknown> {
  const chunks: Buffer[] = []
  let total = 0
  for await (const chunk of req) {
    const buffer = typeof chunk === 'string' ? Buffer.from(chunk) : chunk
    total += buffer.length
    if (total > MAX_BODY_BYTES) throw new Error(`request body exceeds ${String(MAX_BODY_BYTES)} bytes`)
    chunks.push(buffer)
  }
  const text = Buffer.concat(chunks).toString('utf8').trim()
  if (text === '') throw new Error('empty request body')
  return JSON.parse(text)
}

/**
 * Serve one settings request.
 * @param req - incoming request.
 * @param res - response to write.
 * @param options - trusted authorities and the settings document path.
 */
export async function handleSkinRequest(
  req: SkinRequest,
  res: SkinResponse,
  options: SkinRouteOptions,
): Promise<void> {
  if (!isTrustedApiRequest(req, options.trustedHosts)) {
    writeError(res, 403, 'forbidden', 'forbidden')
    return
  }
  const pathname = new URL(req.url ?? '/', 'http://dsh.internal').pathname
  if (pathname !== SKIN_API_PATH) {
    writeError(res, 404, 'not-found', `unknown settings API path: ${pathname}`)
    return
  }
  if (req.method === 'GET') {
    writeJson(res, 200, { ok: true, value: readSkinConfig(options.configPath) })
    return
  }
  if (req.method === 'PUT') {
    let body: unknown
    try {
      body = await readJsonBody(req)
    } catch (error) {
      writeError(res, 400, 'bad-request', error instanceof Error ? error.message : String(error))
      return
    }
    const problem = skinConfigProblem(body)
    if (problem !== undefined) {
      writeError(res, 400, 'bad-request', problem)
      return
    }
    // Fields the body omits keep their stored value, so a partial write cannot
    // silently reset the rest of the configuration.
    const merged = { ...readSkinConfig(options.configPath), ...body as Record<string, unknown> }
    writeJson(res, 200, { ok: true, value: writeSkinConfig(options.configPath, merged) })
    return
  }
  writeError(res, 405, 'method-error', `method not allowed: ${String(req.method)}`)
}

/**
 * Register the fenced settings route on an already-resolved web server.
 * @param ctx - context carrying the `webServer` service.
 * @param options - trusted authorities and the settings document path.
 */
export function registerSkinRoutes(ctx: Context, options: SkinRouteOptions): void {
  ctx.effect(
    () => ctx.webServer.register({
      kind: 'prefix',
      path: SKIN_API_PREFIX,
      handler: (req, res) => handleSkinRequest(req, res, options),
    }),
    'deep-diving-skin: settings API',
  )
}
