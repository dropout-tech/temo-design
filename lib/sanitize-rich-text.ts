// 作品內容區塊「文字」型別的富文本清洗（server 端專用）。
// Quill 編輯器輸出的 HTML 存進 DB 前，一律經過這裡消毒，避免存進任意 script/style 等危險標籤。
import sanitizeHtml from "sanitize-html"

export function sanitizeRichText(html: string): string {
  if (!html) return ""
  return sanitizeHtml(html, {
    allowedTags: ["p", "br", "strong", "em", "u", "s", "a", "ol", "ul", "li", "span"],
    // Quill 會把 color/size 直接掛在 strong/em/u/s/a 上（不一定包 span），
    // 所以 style/class 對所有行內格式標籤開放，值仍受下方白名單約束。
    allowedAttributes: {
      a: ["href", "target", "rel", "style", "class"],
      span: ["style", "class"],
      strong: ["style", "class"],
      em: ["style", "class"],
      u: ["style", "class"],
      s: ["style", "class"],
      p: ["class"],
      li: ["class", "data-list"],
      ol: ["class"],
      ul: ["class"],
    },
    allowedStyles: {
      "*": {
        color: [/^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/, /^#[0-9a-fA-F]{3,8}$/],
        "background-color": [/^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/, /^#[0-9a-fA-F]{3,8}$/],
      },
    },
    allowedClasses: {
      "*": [/^ql-(size|align)-/],
    },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { target: "_blank", rel: "noopener noreferrer" }),
    },
    // Quill 內部標記（<span class="ql-ui" contenteditable="false">）消毒後會剩無用空 span，一律剔除
    exclusiveFilter: (frame) =>
      frame.tag === "span" && !frame.text.trim(),
  })
}

/** Quill 空內容是 `<p><br></p>`；去掉所有標籤後若剩空字串就視為沒填。 */
export function richTextIsEmpty(html: string): boolean {
  if (!html) return true
  return html.replace(/<[^>]*>/g, "").trim() === ""
}
