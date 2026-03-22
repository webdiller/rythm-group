type BlogArticleBodyProps = {
  html: string
  className?: string
}

/** Контент статьи (в продакшене HTML должен проходить санитизацию на сервере — ТЗ п. 3.3). */
export function BlogArticleBody({ html, className }: BlogArticleBodyProps) {
  return (
    <div
      className={`blog-article-body max-w-none ${className ?? ""}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
