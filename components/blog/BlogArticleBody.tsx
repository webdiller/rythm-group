import parse, { type HTMLReactParserOptions, type Element } from "html-react-parser"
import ReactPlayer from "react-player"

type BlogArticleBodyProps = {
  html: string
  className?: string
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
      return (
        <div className="my-6 overflow-hidden rounded-xl border border-border/60 bg-black shadow-sm">
          <div className="aspect-video w-full">
            <ReactPlayer
              src={src}
              controls
              width="100%"
              height="100%"
              light={poster || undefined}
              playsInline
            />
          </div>
        </div>
      )
    },
  }

  return (
    <div className={`blog-article-body max-w-none ${className ?? ""}`}>
      {parse(html, options)}
    </div>
  )
}
