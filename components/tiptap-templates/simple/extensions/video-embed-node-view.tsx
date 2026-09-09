"use client"

import { useRef, useState } from "react"
import { NodeViewWrapper } from "@tiptap/react"
import ReactPlayer from "react-player"
import { ImageIcon, RotateCcw, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"

type VideoEmbedNodeViewProps = {
  node: {
    attrs?: {
      src?: string
      poster?: string | null
    }
  }
  updateAttributes: (attrs: { src?: string; poster?: string | null }) => void
  deleteNode: () => void
  selected: boolean
}

export function VideoEmbedNodeView({ node, updateAttributes, deleteNode, selected }: VideoEmbedNodeViewProps) {
  const src = String(node.attrs?.src ?? "").trim()
  const poster = node.attrs?.poster ? String(node.attrs.poster) : null
  const [posterUploading, setPosterUploading] = useState(false)
  const [showVideoPlayer, setShowVideoPlayer] = useState(false)
  const [playerResetKey, setPlayerResetKey] = useState(0)
  const posterInputRef = useRef<HTMLInputElement>(null)

  const getToken = () =>
    document.cookie
      .split("; ")
      .find((row) => row.startsWith("auth_token="))
      ?.split("=")[1]

  const uploadPosterFile = async (file: File | null) => {
    if (!file) return
    setPosterUploading(true)
    const token = getToken()
    const fd = new FormData()
    fd.append("file", file)
    try {
      const res = await fetch("/api/content/blog/upload", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: fd,
      })
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string }
        toast.error(err.error ?? "Не удалось загрузить постер")
        return
      }
      const json = (await res.json()) as { data?: { url?: string } }
      const nextPoster = json.data?.url
      if (!nextPoster) {
        toast.error("Не удалось получить URL постера")
        return
      }
      updateAttributes({ poster: nextPoster })
      setShowVideoPlayer(false)
      setPlayerResetKey((key) => key + 1)
      toast.success("Постер загружен")
    } catch {
      toast.error("Ошибка загрузки постера")
    } finally {
      setPosterUploading(false)
      if (posterInputRef.current) posterInputRef.current.value = ""
    }
  }

  const removePoster = () => {
    updateAttributes({ poster: null })
    toast.success("Постер удалён")
  }

  const togglePosterPreview = () => {
    if (!poster) return
    setShowVideoPlayer((prev) => !prev)
    setPlayerResetKey((key) => key + 1)
    toast.success(showVideoPlayer ? "Постер снова отображается" : "Показ видео включён")
  }

  return (
    <NodeViewWrapper
      as="figure"
      data-video-embed="true"
      data-video-src={src}
      {...(poster ? { "data-video-poster": poster } : {})}
      className={`blog-video-embed group relative my-4 overflow-hidden rounded-lg border border-border bg-black ${selected ? "ring-2 ring-primary/50" : ""}`}
    >
      <input
        ref={posterInputRef}
        type="file"
        className="sr-only"
        accept="image/jpeg,image/png,image/webp,image/gif"
        aria-hidden
        tabIndex={-1}
        onChange={(e) => void uploadPosterFile(e.target.files?.[0] ?? null)}
      />
      <div className="absolute top-2 right-2 z-20 flex items-center gap-1 rounded-md border border-border/70 bg-background/90 p-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          title={poster ? (showVideoPlayer ? "Показать постер" : "Показать видео") : "У видео нет постера"}
          disabled={!poster || posterUploading}
          onClick={togglePosterPreview}
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          title="Загрузить постер"
          disabled={posterUploading}
          onClick={() => posterInputRef.current?.click()}
        >
          <Upload className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          title={poster ? "Удалить постер" : "У видео нет постера"}
          disabled={!poster || posterUploading}
          onClick={removePoster}
        >
          <ImageIcon className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive"
          title="Удалить видео"
          disabled={posterUploading}
          onClick={() => deleteNode()}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="aspect-video w-full">
        <ReactPlayer
          key={`${src}-${poster ?? "none"}-${playerResetKey}`}
          src={src}
          controls
          width="100%"
          height="100%"
          light={poster && !showVideoPlayer ? poster : false}
          playsInline
          onClickPreview={() => setShowVideoPlayer(true)}
        />
      </div>
    </NodeViewWrapper>
  )
}
