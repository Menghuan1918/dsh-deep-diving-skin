/** Simplified Chinese dictionary. */
export declare const zh: {
    readonly summary: "把「深度求索中，用时 …」那一行换成你自己的图标、文本和颜色（默认：旋转太极 + 少女祈祷中 + 红色）。";
    readonly title: "运行状态皮肤";
    readonly intro: "这些设置只作用于会话正在运行时的那一行状态提示，改完点保存即时生效。";
    readonly iconLabel: "图标";
    readonly iconHint: "支持 SVG 与动图（GIF / WebP / PNG）。上传的文件会转成 data URI 存进配置。";
    readonly iconUpload: "选择图片文件";
    readonly iconTooLarge: "图片太大（{kb} KB），上限 {limit} KB。";
    readonly iconIsData: "当前使用上传的图片（约 {kb} KB）。";
    readonly iconClear: "清除图标";
    readonly iconUrlLabel: "或填写图片地址";
    readonly iconUrlPlaceholder: "https://example.com/icon.svg，或 /assets/icon.svg";
    readonly iconPreview: "预览";
    readonly textLabel: "文本";
    readonly textHint: "只替换「深度求索中」这几个字，后面的「用时 …」原样保留。";
    readonly colorLabel: "颜色";
    readonly colorHint: "只作用于这一行文字。";
    readonly spinLabel: "旋转图标";
    readonly spinSecondsLabel: "旋转周期（秒）";
    readonly spinSecondsHint: "0.2 – 60 秒转一圈。";
    readonly save: "保存";
    readonly saving: "保存中…";
    readonly saved: "已保存";
    readonly saveFailed: "保存失败：";
    readonly resetAll: "恢复全部默认";
    readonly resetting: "恢复中…";
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
