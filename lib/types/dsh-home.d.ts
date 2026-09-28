/**
 * Resolve the single-root harness home.
 * @param configured - explicit override, which outranks the environment.
 * @param env - environment mapping read for `DSH_HOME`.
 * @returns the normalized absolute harness home.
 */
export declare function resolveDshHome(configured?: string, env?: NodeJS.ProcessEnv): string;
