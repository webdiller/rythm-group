import Image from "@tiptap/extension-image"
import { ReactNodeViewRenderer } from "@tiptap/react"
import { ImageNodeView } from "@/components/tiptap-templates/simple/extensions/image-node-view"

export const ImageWithOverlay = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: 100,
        parseHTML: (element) => {
          const value = element.getAttribute("data-image-width")
          const numeric = Number(value ?? 100)
          return Number.isFinite(numeric) ? Math.max(20, Math.min(100, numeric)) : 100
        },
        renderHTML: (attributes) => ({
          "data-image-width": String(attributes.width ?? 100),
        }),
      },
      align: {
        default: "center",
        parseHTML: (element) => {
          const value = element.getAttribute("data-image-align")
          return value === "left" || value === "right" ? value : "center"
        },
        renderHTML: (attributes) => ({
          "data-image-align": String(attributes.align ?? "center"),
        }),
      },
    }
  },
  renderHTML({ HTMLAttributes }) {
    const width = Math.max(20, Math.min(100, Number(HTMLAttributes.width ?? 100)))
    const align = HTMLAttributes.align === "left" || HTMLAttributes.align === "right" ? HTMLAttributes.align : "center"
    const style = [`width:${width}%`, "height:auto", "display:block", align === "left" ? "margin-left:0;margin-right:auto" : "", align === "right" ? "margin-left:auto;margin-right:0" : "", align === "center" ? "margin-left:auto;margin-right:auto" : ""].filter(Boolean).join(";")
    return ["img", { ...HTMLAttributes, style, class: "rounded-lg border border-border my-2" }]
  },
  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView)
  },
})
