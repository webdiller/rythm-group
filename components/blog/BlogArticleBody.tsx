import parse, { type HTMLReactParserOptions, type Element } from "html-react-parser"
import { useState } from "react"
import ReactPlayer from "react-player"

type BlogArticleBodyProps = {
  html: string
  className?: string
}

type BlogInlineVideoProps = {
  src: string
  poster?: string
}

function BlogInlineVideo({ src, poster }: BlogInlineVideoProps) {
  const [playing, setPlaying] = useState(false)

  return (
    <div
      className="my-6 overflow-hidden rounded-xl border border-border/60 bg-black shadow-sm"
      onClick={() => {
        if (!playing) setPlaying(true)
      }}
    >
      <div className="aspect-video w-full">
        <ReactPlayer
          src={src}
          controls
          playing={playing}
          width="100%"
          height="100%"
          light={poster || undefined}
          playsInline
        />
      </div>
    </div>
  )
}

/** Контент статьи (в продакшене HTML должен проходить санитизацию на сервере — ТЗ п. 3.3). */
export function BlogArticleBody({ html, className }: BlogArticleBodyProps) {
  const options: HTMLReactParserOptions = {
    replace(domNode) {
      if (domNode.type !== "tag") return undefined
      const el = domNode as Element
      if (el.name !== "video") return undefined
      const src = el.attribs?.src
      if (!src) return undefined
      const poster = el.attribs?.poster
      return <BlogInlineVideo src={src} poster={poster} />
    },
  }

  return (
    <div className={`blog-article-body max-w-none ${className ?? ""}`}>
      {parse(html, options)}
    </div>
  )
}
