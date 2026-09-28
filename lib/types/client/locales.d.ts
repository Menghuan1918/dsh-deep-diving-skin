/** Simplified Chinese dictionary. */
export declare const zh: {
    readonly nav: "运行状态";
    readonly summary: "替换运行中那行状态提示的图标、文本与颜色。";
    readonly title: "运行状态提示";
    readonly intro: "这些设置只作用于会话运行时的那行状态提示，保存后立即生效。";
    readonly iconLabel: "图标";
    readonly iconHint: "支持 SVG、GIF、WebP、PNG。上传的文件会转成 data URI 存进配置。";
    readonly iconUpload: "选择图片文件";
    readonly iconTooLarge: "图片太大（{kb} KB），上限 {limit} KB。";
    readonly iconIsData: "当前使用上传的图片（约 {kb} KB）。";
    readonly iconClear: "清除图标";
    readonly iconUrlLabel: "图片地址";
    readonly iconUrlPlaceholder: "https://example.com/icon.svg 或 /assets/icon.svg";
    readonly iconPreview: "图标预览";
    readonly textLabel: "文本";
    readonly textHint: "替换「深度求索中」，后面的「用时 …」保持不变。";
    readonly colorLabel: "颜色";
    readonly colorHint: "作用于这一行文字。";
    readonly spinLabel: "旋转图标";
    readonly spinSecondsLabel: "旋转周期（秒）";
    readonly spinSecondsHint: "0.2 – 60 秒转一圈。";
    readonly save: "保存";
    readonly saving: "保存中…";
    readonly saved: "已保存";
    readonly saveFailed: "保存失败：";
    readonly resetAll: "恢复默认";
};
/** Dictionary key union of the namespace. */
export type SkinLocaleKey = keyof typeof zh;
/** English dictionary, key-identical to the Chinese source of truth. */
export declare const en: Record<SkinLocaleKey, string>;
declare module '@deepseek-ai/dsh-client-ui-slots' {
    interface LocaleNamespaceMap {
        /** Running-status skin settings copy. */
        'deep-diving-skin': SkinLocaleKey;
    }
}
