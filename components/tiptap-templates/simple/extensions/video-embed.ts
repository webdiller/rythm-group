import { mergeAttributes, Node } from "@tiptap/core"

export type VideoEmbedAttrs = {
  src: string
  poster?: string | null
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    videoEmbed: {
      setVideoEmbed: (attrs: VideoEmbedAttrs) => ReturnType
      unsetSelectedVideoEmbed: () => ReturnType
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
      src: {
        default: "",
        parseHTML: (element) =>
          element.getAttribute("data-video-src") ??
          element.getAttribute("src") ??
          "",
      },
      poster: {
        default: null,
        parseHTML: (element) =>
          element.getAttribute("data-video-poster") ??
          element.getAttribute("poster") ??
          null,
      },
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
      mergeAttributes({
        "data-video-embed": "true",
        "data-video-src": src,
        ...(poster ? { "data-video-poster": poster } : {}),
        class: "blog-video-embed my-4",
      }),
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
      unsetSelectedVideoEmbed:
        () =>
        ({ state, chain }) => {
          const { $from } = state.selection
          const node = $from.nodeAfter ?? $from.nodeBefore
          if (!node || node.type.name !== this.name) {
            return false
          }
          return chain().deleteSelection().run()
        },
    }
  },
})
