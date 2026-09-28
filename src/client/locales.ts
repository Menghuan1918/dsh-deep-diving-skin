/**
 * `deep-diving-skin` namespace dictionaries. The Chinese dictionary is the
 * key-set source of truth; the English one is checked against it.
 */
import type {} from '@deepseek-ai/dsh-client-ui-slots'

/** Simplified Chinese dictionary. */
export const zh = {
  'summary': '把「深度求索中，用时 …」那一行换成你自己的图标、文本和颜色（默认：旋转太极 + 少女祈祷中 + 红色）。',
  'title': '运行状态皮肤',
  'intro': '这些设置只作用于会话正在运行时的那一行状态提示，改完点保存即时生效。',
  'iconLabel': '图标',
  'iconHint': '支持 SVG 与动图（GIF / WebP / PNG）。上传的文件会转成 data URI 存进配置。',
  'iconUpload': '选择图片文件',
  'iconTooLarge': '图片太大（{kb} KB），上限 {limit} KB。',
  'iconIsData': '当前使用上传的图片（约 {kb} KB）。',
  'iconClear': '清除图标',
  'iconUrlLabel': '或填写图片地址',
  'iconUrlPlaceholder': 'https://example.com/icon.svg，或 /assets/icon.svg',
  'iconPreview': '预览',
  'textLabel': '文本',
  'textHint': '只替换「深度求索中」这几个字，后面的「用时 …」原样保留。',
  'colorLabel': '颜色',
  'colorHint': '只作用于这一行文字。',
  'spinLabel': '旋转图标',
  'spinSecondsLabel': '旋转周期（秒）',
  'spinSecondsHint': '0.2 – 60 秒转一圈。',
  'save': '保存',
  'saving': '保存中…',
  'saved': '已保存',
  'saveFailed': '保存失败：',
  'resetAll': '恢复全部默认',
  'resetting': '恢复中…',
} as const

/** Dictionary key union of the namespace. */
export type SkinLocaleKey = keyof typeof zh

/** English dictionary, key-identical to the Chinese source of truth. */
export const en: Record<SkinLocaleKey, string> = {
  'summary': 'Replace the 「深度求索中，用时 …」 line with your own icon, text and colour (defaults: spinning taiji + 少女祈祷中 + red).',
  'title': 'Running-status skin',
  'intro': 'These settings only affect the status line shown while a session runs. Save applies them immediately.',
  'iconLabel': 'Icon',
  'iconHint': 'SVG and animated images (GIF / WebP / PNG) are supported. An uploaded file is stored as a data URI.',
  'iconUpload': 'Choose an image file',
  'iconTooLarge': 'Image is too large ({kb} KB); the limit is {limit} KB.',
  'iconIsData': 'Using the uploaded image (about {kb} KB).',
  'iconClear': 'Clear icon',
  'iconUrlLabel': 'Or enter an image URL',
  'iconUrlPlaceholder': 'https://example.com/icon.svg, or /assets/icon.svg',
  'iconPreview': 'Preview',
  'textLabel': 'Text',
  'textHint': 'Replaces only the 「深度求索中」 phrase; the elapsed-time suffix is kept verbatim.',
  'colorLabel': 'Colour',
  'colorHint': 'Applies to this line\'s text only.',
  'spinLabel': 'Rotate the icon',
  'spinSecondsLabel': 'Rotation period (seconds)',
  'spinSecondsHint': '0.2 – 60 seconds per turn.',
  'save': 'Save',
  'saving': 'Saving…',
  'saved': 'Saved',
  'saveFailed': 'Save failed: ',
  'resetAll': 'Reset everything',
  'resetting': 'Resetting…',
}

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Running-status skin settings copy. */
    'deep-diving-skin': SkinLocaleKey
  }
}
