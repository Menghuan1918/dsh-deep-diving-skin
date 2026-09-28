import { type SkinConfig } from '../skin-config.ts';
/** The running-status element. */
export declare const RUNNING_SELECTOR = "[data-chat-running]";
/** A read-only observable source: the shape the renderer's `hooks` compartment binds. */
export interface ObservableSource<T> {
    /** @returns the current value, by reference until it changes. */
    getSnapshot(): T;
    /**
     * Observe value replacements.
     * @param listener - invoked after each change.
     * @returns the disposer removing this listener.
     */
    subscribe(listener: () => void): () => void;
}
/**
 * Start the skin: patch every running-status element now, on every
 * configuration change, and after every DOM mutation React commits.
 * @param source - the live configuration.
 * @returns the disposer that retracts every write.
 */
export declare function startSkin(source: ObservableSource<SkinConfig>): () => void;
