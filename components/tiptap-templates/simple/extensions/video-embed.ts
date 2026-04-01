import { mergeAttributes, Node } from "@tiptap/core"

export type VideoEmbedAttrs = {
  src: string
  poster?: string | null
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    videoEmbed: {
      setVideoEmbed: (attrs: VideoEmbedAttrs) => ReturnType
      unsetVideoEmbed: () => ReturnType
    }
  }
}

export const VideoEmbed = Node.create({
  name: "videoEmbed",
  group: "block",
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      src: { default: "" },
      poster: { default: null },
    }
  },

  parseHTML() {
    return [
      { tag: "figure[data-video-embed]" },
      { tag: "video[data-video-embed]" },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const src = String(HTMLAttributes.src ?? "")
    const poster = HTMLAttributes.poster ? String(HTMLAttributes.poster) : null
    return [
      "figure",
      mergeAttributes(
        {
          "data-video-embed": "true",
          "data-video-src": src,
          ...(poster ? { "data-video-poster": poster } : {}),
          class: "blog-video-embed my-4",
        },
        HTMLAttributes,
      ),
      [
        "video",
        {
          "data-video-embed": "true",
          src,
          ...(poster ? { poster } : {}),
          controls: "true",
          preload: "metadata",
          playsinline: "true",
          class: "w-full rounded-lg border border-border bg-black",
        },
      ],
    ]
  },

  addCommands() {
    return {
      setVideoEmbed:
        (attrs) =>
        ({ chain }) =>
          chain().insertContent({ type: this.name, attrs }).run(),
      unsetVideoEmbed:
        () =>
        ({ state, tr, dispatch }) => {
          let changed = false
          state.doc.descendants((node, pos) => {
            if (node.type.name === this.name) {
              tr.delete(pos, pos + node.nodeSize)
              changed = true
              return false
            }
            return true
          })
          if (changed && dispatch) dispatch(tr)
          return changed
        },
    }
  },
})
