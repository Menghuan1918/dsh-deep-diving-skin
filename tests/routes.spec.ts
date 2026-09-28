/**
 * The fenced settings API: the trust fence, the read/write paths, and the
 * request validation behind them. Fake request and response objects implement
 * the narrow surfaces the handler declares, so no socket is involved.
 */
import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  MAX_BODY_BYTES,
  handleSkinRequest,
  isTrustedApiRequest,
  type SkinRequest,
  type SkinResponse,
} from '../src/routes.ts'
import { DEFAULT_SKIN, SKIN_API_PATH } from '../src/skin-config.ts'
import { readSkinConfig, writeSkinConfig } from '../src/store.ts'

const tempDir = mkdtempSync(join(tmpdir(), 'dsh-deep-diving-skin-api-'))

interface Call {
  readonly method: string
  readonly url: string
  readonly headers: Record<string, string>
  readonly body?: string | readonly Buffer[]
}

function request(call: Call): SkinRequest {
  const chunks: (string | Buffer)[] = call.body === undefined
    ? []
    : Array.isArray(call.body) ? [...call.body] : [call.body as string]
  return {
    method: call.method,
    url: call.url,
    headers: call.headers,
    async *[Symbol.asyncIterator](): AsyncIterator<string | Buffer> {
      for (const chunk of chunks) yield chunk
    },
  }
}

interface Recorded {
  status: number
  body: string
}

function response(sink: Recorded): SkinResponse {
  return {
    writeHead(status) {
      sink.status = status
      return sink
    },
    end(body) {
      sink.body = body ?? ''
      return sink
    },
  }
}

async function call(call_: Partial<Call>, options: { trustedHosts?: readonly string[]; configPath: string }): Promise<Recorded> {
  const sink: Recorded = { status: 0, body: '' }
  await handleSkinRequest(
    request({
      method: call_.method ?? 'GET',
      url: call_.url ?? SKIN_API_PATH,
      headers: { host: '127.0.0.1:3080', ...call_.headers },
      ...call_.body === undefined ? {} : { body: call_.body },
    }),
    response(sink),
    { trustedHosts: options.trustedHosts ?? [], configPath: options.configPath },
  )
  return sink
}

function payload(sink: Recorded): { ok?: unknown; value?: unknown; error?: { message?: unknown } } {
  return JSON.parse(sink.body) as { ok?: unknown; value?: unknown; error?: { message?: unknown } }
}

describe('trust fence', () => {
  const base = { headers: { host: '127.0.0.1:3080' } }

  it('accepts loopback and listed authorities, rejects the rest', () => {
    expect(isTrustedApiRequest(request({ ...base, method: 'GET', url: '/' }), [])).toBe(true)
    expect(isTrustedApiRequest(request({ method: 'GET', url: '/', headers: { host: 'localhost:3080' } }), [])).toBe(true)
    expect(isTrustedApiRequest(request({ method: 'GET', url: '/', headers: { host: 'example.com' } }), [])).toBe(false)
    expect(isTrustedApiRequest(request({ method: 'GET', url: '/', headers: { host: 'example.com' } }), ['example.com'])).toBe(true)
    expect(isTrustedApiRequest(request({ method: 'GET', url: '/', headers: {} }), [])).toBe(false)
  })

  it('rejects cross-site and foreign-origin browser requests', () => {
    expect(isTrustedApiRequest(request({ method: 'GET', url: '/', headers: { ...base.headers, 'sec-fetch-site': 'cross-site' } }), [])).toBe(false)
    expect(isTrustedApiRequest(request({ method: 'GET', url: '/', headers: { ...base.headers, origin: 'http://evil.test' } }), [])).toBe(false)
    expect(isTrustedApiRequest(request({ method: 'GET', url: '/', headers: { ...base.headers, origin: 'http://127.0.0.1:3080' } }), [])).toBe(true)
  })
})

describe('settings API', () => {
  it('serves the stored configuration', async () => {
    const configPath = join(tempDir, 'read.json')
    writeSkinConfig(configPath, { ...DEFAULT_SKIN, text: '祈祷中' })
    const sink = await call({}, { configPath })

    expect(sink.status).toBe(200)
    expect(payload(sink)).toEqual({ ok: true, value: { ...DEFAULT_SKIN, text: '祈祷中' } })
  })

  it('persists a write and answers with the accepted value', async () => {
    const configPath = join(tempDir, 'write.json')
    const sink = await call(
      { method: 'PUT', body: JSON.stringify({ ...DEFAULT_SKIN, text: '少女祈祷中！', color: '#3366ff' }) },
      { configPath },
    )

    expect(sink.status).toBe(200)
    expect(readSkinConfig(configPath)).toEqual({ ...DEFAULT_SKIN, text: '少女祈祷中！', color: '#3366ff' })
  })

  it('keeps fields a partial write omits', async () => {
    const configPath = join(tempDir, 'partial.json')
    writeSkinConfig(configPath, { ...DEFAULT_SKIN, icon: 'https://example.com/a.svg' })
    const sink = await call({ method: 'PUT', body: JSON.stringify({ text: '祈祷中' }) }, { configPath })

    expect(sink.status).toBe(200)
    expect(readSkinConfig(configPath)).toEqual({ ...DEFAULT_SKIN, icon: 'https://example.com/a.svg', text: '祈祷中' })
  })

  it('refuses a body it cannot accept', async () => {
    const configPath = join(tempDir, 'rejected.json')
    const options = { configPath }

    const refused = await call({ method: 'PUT', body: JSON.stringify({ icon: 'javascript:alert(1)' }) }, options)
    expect(refused.status).toBe(400)
    expect(String(payload(refused).error?.message)).toContain('icon must be')

    expect((await call({ method: 'PUT', body: 'not json' }, options)).status).toBe(400)
    expect((await call({ method: 'PUT' }, options)).status).toBe(400)
    expect(readSkinConfig(configPath)).toEqual(DEFAULT_SKIN)
  })

  it('bounds the request body', async () => {
    const configPath = join(tempDir, 'huge.json')
    const oversized = Buffer.alloc(MAX_BODY_BYTES + 1, 0x61)
    const sink = await call({ method: 'PUT', body: [oversized] }, { configPath })

    expect(sink.status).toBe(400)
    expect(String(payload(sink).error?.message)).toContain('exceeds')
  })

  it('answers 403 before looking at the request', async () => {
    const configPath = join(tempDir, 'forbidden.json')
    const sink = await call({ headers: { host: 'example.com' } }, { configPath })

    expect(sink.status).toBe(403)
    expect(payload(sink).ok).toBe(false)
  })

  it('answers 404 and 405 outside the route contract', async () => {
    const configPath = join(tempDir, 'routing.json')

    expect((await call({ url: '/deep-diving-skin/api/other' }, { configPath })).status).toBe(404)
    expect((await call({ method: 'DELETE' }, { configPath })).status).toBe(405)
  })
})
