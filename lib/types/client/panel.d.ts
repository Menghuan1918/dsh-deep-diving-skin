/**
 * The plugin's configuration page, registered at `plugins.row.config` so it
 * opens from the plugin's row on the Plugins page (a left-sidebar panel in
 * DSH 0.2.x). The same component answers `view: 'summary'` with the one-line
 * description that page shows for a row without one.
 */
import { type ReactNode } from 'react';
import type { InjectFace, PropsLocale, PropsRuntime } from '@deepseek-ai/dsh-client-ui-slots';
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
    /** Persist the shipped preset and republish it. */
    readonly reset: () => Promise<SkinConfig>;
}
/** Complete props of the registered page. */
export type SkinPanelProps = PropsRuntime<'plugins.row.config'> & InjectFace<SkinInjected> & PropsLocale<typeof SKIN_NS>;
/** Read one file as a data URI. */
export declare function toDataUrl(file: File): Promise<string>;
/**
 * Render the plugin's row configuration page.
 * @param props - composed slot props and the injected settings face.
 * @returns the settings form, or the row's one-line description.
 */
export declare function SkinPanel({ view, useConfig, t, save, reset }: SkinPanelProps): ReactNode;
