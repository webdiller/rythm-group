"use client"

import { NodeViewWrapper } from "@tiptap/react"
import ReactPlayer from "react-player"

type VideoEmbedNodeViewProps = {
  node: {
    attrs?: {
      src?: string
      poster?: string | null
    }
  }
  selected: boolean
}

export function VideoEmbedNodeView({ node, selected }: VideoEmbedNodeViewProps) {
  const src = String(node.attrs?.src ?? "").trim()
  const poster = node.attrs?.poster ? String(node.attrs.poster) : null

  return (
    <NodeViewWrapper
      as="figure"
      data-video-embed="true"
      data-video-src={src}
      {...(poster ? { "data-video-poster": poster } : {})}
      className={`blog-video-embed my-4 overflow-hidden rounded-lg border border-border bg-black ${selected ? "ring-2 ring-primary/50" : ""}`}
    >
      <div className="aspect-video w-full">
        <ReactPlayer
          src={src}
          controls
          width="100%"
          height="100%"
          light={poster || false}
          playsInline
        />
      </div>
    </NodeViewWrapper>
  )
}
