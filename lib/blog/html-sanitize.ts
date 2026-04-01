import sanitizeHtml from "sanitize-html"

const ALLOWED_TAGS = sanitizeHtml.defaults.allowedTags.concat([
  "h1",
  "h2",
  "h3",
  "h4",
  "img",
  "video",
  "source",
  "span",
  "figure",
  "figcaption",
  /** TipTap task list */
  "input",
  "label",
])

const ALLOWED_ATTRIBUTES: sanitizeHtml.IOptions["allowedAttributes"] = {
  ...sanitizeHtml.defaults.allowedAttributes,
  a: ["href", "name", "target", "rel"],
  img: ["src", "alt", "title", "width", "height", "loading"],
  video: [
    "src",
    "poster",
    "controls",
    "preload",
    "playsinline",
    "class",
    "data-video-embed",
    "data-video-src",
    "data-video-poster",
  ],
  source: ["src", "type"],
  figure: ["class", "data-video-embed", "data-video-src", "data-video-poster"],
  ul: ["data-type", "class"],
  ol: ["data-type", "class"],
  li: ["data-type", "data-checked", "class"],
  input: ["type", "checked", "class", "disabled"],
  label: ["class", "contenteditable"],
  "*": ["class"],
}

/**
 * Серверная санитизация HTML из TipTap перед сохранением и при выводе (двойная защита).
 */
export function sanitizeBlogHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowProtocolRelative: false,
  })
}
