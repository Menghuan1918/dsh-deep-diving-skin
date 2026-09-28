/**
 * Harness-home resolution, copied from `@deepseek-ai/dsh-home-paths`'
 * `resolveDshHome` (`$DSH_HOME` over `~/.dsh`, `~` expanded, relative paths
 * resolved against the process directory). Copied rather than depended on so
 * the host half runs with no install-time dependency edge outside the harness
 * itself; keep it in step with that package when the rule changes.
 */
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'

/** Directory name of the default harness home under the operating-system home. */
const DSH_HOME_DIR_NAME = '.dsh'
/** Environment variable overriding the default harness home. */
const DSH_HOME_ENV = 'DSH_HOME'

function expandHomePath(path: string): string {
  if (path === '~') return homedir()
  if (path.startsWith('~/') || path.startsWith('~\\')) return join(homedir(), path.slice(2))
  return path
}

/**
 * Resolve the single-root harness home.
 * @param configured - explicit override, which outranks the environment.
 * @param env - environment mapping read for `DSH_HOME`.
 * @returns the normalized absolute harness home.
 */
export function resolveDshHome(configured?: string, env: NodeJS.ProcessEnv = process.env): string {
  const fromEnv = env[DSH_HOME_ENV]
  const base = fromEnv !== undefined && fromEnv.trim().length > 0 ? fromEnv : join(homedir(), DSH_HOME_DIR_NAME)
  return resolve(expandHomePath(configured ?? base))
}
