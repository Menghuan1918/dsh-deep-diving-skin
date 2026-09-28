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
import type { Context } from '@deepseek-ai/cordis';
/** Largest accepted request body: a base64 icon data URI dominates it. */
export declare const MAX_BODY_BYTES: number;
/** The request surface this route reads. */
export interface SkinRequest {
    readonly method?: string | undefined;
    readonly url?: string | undefined;
    readonly headers: Readonly<Record<string, string | string[] | undefined>>;
    [Symbol.asyncIterator](): AsyncIterator<string | Buffer>;
}
/** The response surface this route writes. */
export interface SkinResponse {
    writeHead(status: number, headers: Record<string, string>): unknown;
    end(body?: string): unknown;
}
/** What the route needs from its composing row. */
export interface SkinRouteOptions {
    /** Reverse-proxy authorities additionally trusted, as `host` or `host:port`. */
    readonly trustedHosts: readonly string[];
    /** Absolute path of the settings document. */
    readonly configPath: string;
}
/**
 * Whether a request may read or write the settings document.
 * @param req - incoming request.
 * @param trustedHosts - reverse-proxy authorities additionally accepted.
 * @returns true for a loopback (or listed) Host with a same-origin browser marker.
 */
export declare function isTrustedApiRequest(req: SkinRequest, trustedHosts: readonly string[]): boolean;
/**
 * Serve one settings request.
 * @param req - incoming request.
 * @param res - response to write.
 * @param options - trusted authorities and the settings document path.
 */
export declare function handleSkinRequest(req: SkinRequest, res: SkinResponse, options: SkinRouteOptions): Promise<void>;
/**
 * Register the fenced settings route on an already-resolved web server.
 * @param ctx - context carrying the `webServer` service.
 * @param options - trusted authorities and the settings document path.
 */
export declare function registerSkinRoutes(ctx: Context, options: SkinRouteOptions): void;
