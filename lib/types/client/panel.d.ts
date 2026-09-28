/**
 * The plugin's settings page. One component serves both registration sites:
 * the Plugins page asks for `view: 'summary'` (its one-line description) or
 * `view: 'page'` (the form), and the Settings section renders the form alone.
 * Styling comes from the injected `dds-` stylesheet in `styles.ts`.
 */
import { type ReactNode } from 'react';
import type { InjectFace, PropsLocale } from '@deepseek-ai/dsh-client-ui-slots';
import { SKIN_NS, type SkinConfig } from '../skin-config.ts';
import type { ObservableSource } from './patcher.ts';
/** The business face this registration injects. */
export interface SkinInjected {
    /** Bare sources bound to `use<Name>` selector hooks. */
    readonly hooks: {
        readonly config: ObservableSource<SkinConfig>;
    };
    /** Persist a configuration and republish it. */
    readonly save: (patch: Partial<SkinConfig>) => Promise<SkinConfig>;
    /** Persist the shipped defaults and republish them. */
    readonly reset: () => Promise<SkinConfig>;
}
/**
 * Props this component reads. `view` is absent when the Settings section
 * mounts it — that host always wants the form — so it stays optional rather
 * than being re-typed per slot.
 */
export type SkinPanelProps = {
    readonly view?: 'summary' | 'page' | undefined;
} & InjectFace<SkinInjected> & PropsLocale<typeof SKIN_NS>;
/** Read one file as a data URI. */
export declare function toDataUrl(file: File): Promise<string>;
/**
 * Render the settings form.
 * @param props - the slot props plus the injected settings face.
 * @returns the row's one-line description, or the form.
 */
export declare function SkinPanel({ view, useConfig, t, save, reset }: SkinPanelProps): ReactNode;
