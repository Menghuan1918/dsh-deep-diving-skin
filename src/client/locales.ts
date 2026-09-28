/**
 * `deep-diving-skin` namespace dictionaries. The Chinese dictionary is the
 * key-set source of truth; the English one is checked against it.
 */
import type {} from '@deepseek-ai/dsh-client-ui-slots'

/** Simplified Chinese dictionary. */
export const zh = {
  'nav': '运行状态',
  'summary': '替换运行中那行状态提示的图标、文本与颜色。',
  'title': '运行状态提示',
  'intro': '这些设置只作用于会话运行时的那行状态提示，保存后立即生效。',
  'iconLabel': '图标',
  'iconHint': '支持 SVG、GIF、WebP、PNG。上传的文件会转成 data URI 存进配置。',
  'iconUpload': '选择图片文件',
  'iconTooLarge': '图片太大（{kb} KB），上限 {limit} KB。',
  'iconIsData': '当前使用上传的图片（约 {kb} KB）。',
  'iconClear': '清除图标',
  'iconUrlLabel': '图片地址',
  'iconUrlPlaceholder': 'https://example.com/icon.svg 或 /assets/icon.svg',
  'iconPreview': '图标预览',
  'textLabel': '文本',
  'textHint': '替换「深度求索中」，后面的「用时 …」保持不变。',
  'colorLabel': '颜色',
  'colorHint': '作用于这一行文字。',
  'shimmerLabel': '高亮扫光',
  'shimmerHint': '扫过文字的那道亮带的颜色。留空则跟随上面的颜色。',
  'shimmerFollow': '跟随文本颜色',
  'spinLabel': '旋转图标',
  'spinSecondsLabel': '旋转周期（秒）',
  'spinSecondsHint': '0.2 – 60 秒转一圈。',
  'save': '保存',
  'saving': '保存中…',
  'saved': '已保存',
  'saveFailed': '保存失败：',
  'resetAll': '恢复默认',
} as const

/** Dictionary key union of the namespace. */
export type SkinLocaleKey = keyof typeof zh

/** English dictionary, key-identical to the Chinese source of truth. */
export const en: Record<SkinLocaleKey, string> = {
  'nav': 'Running status',
  'summary': 'Replace the icon, text and colour of the running-status line.',
  'title': 'Running-status line',
  'intro': 'These settings apply to the status line shown while a session runs, and take effect as soon as they are saved.',
  'iconLabel': 'Icon',
  'iconHint': 'SVG, GIF, WebP and PNG are supported. An uploaded file is stored as a data URI.',
  'iconUpload': 'Choose an image file',
  'iconTooLarge': 'Image is too large ({kb} KB); the limit is {limit} KB.',
  'iconIsData': 'Using the uploaded image (about {kb} KB).',
  'iconClear': 'Clear icon',
  'iconUrlLabel': 'Image URL',
  'iconUrlPlaceholder': 'https://example.com/icon.svg or /assets/icon.svg',
  'iconPreview': 'Icon preview',
  'textLabel': 'Text',
  'textHint': 'Replaces 「深度求索中」; the 「用时 …」 suffix is kept as is.',
  'colorLabel': 'Colour',
  'colorHint': 'Applies to this line\'s text only.',
  'shimmerLabel': 'Highlight sweep',
  'shimmerHint': 'Colour of the band that sweeps across the text. Empty follows the colour above.',
  'shimmerFollow': 'Follow the text colour',
  'spinLabel': 'Rotate the icon',
  'spinSecondsLabel': 'Rotation period (seconds)',
  'spinSecondsHint': '0.2 – 60 seconds per turn.',
  'save': 'Save',
  'saving': 'Saving…',
  'saved': 'Saved',
  'saveFailed': 'Save failed: ',
  'resetAll': 'Reset to defaults',
}

declare module '@deepseek-ai/dsh-client-ui-slots' {
  interface LocaleNamespaceMap {
    /** Running-status skin settings copy. */
    'deep-diving-skin': SkinLocaleKey
  }
}
