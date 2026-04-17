"use client"

/**
 * Редактор на базе TipTap (набор расширений и тулбар в духе официального Simple Editor template).
 * @see https://tiptap.dev/docs/ui-components/templates/simple-editor
 */
import { useEffect, useRef, useState } from "react"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Image from "@tiptap/extension-image"
import Placeholder from "@tiptap/extension-placeholder"
import TextAlign from "@tiptap/extension-text-align"
import Underline from "@tiptap/extension-underline"
import TaskList from "@tiptap/extension-task-list"
import TaskItem from "@tiptap/extension-task-item"
import Highlight from "@tiptap/extension-highlight"
import Subscript from "@tiptap/extension-subscript"
import Superscript from "@tiptap/extension-superscript"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Toggle } from "@/components/ui/toggle"
import { cn } from "@/lib/utils"
import { VideoEmbed } from "@/components/tiptap-templates/simple/extensions/video-embed"
import { toast } from "sonner"
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  Film,
  Italic,
  ImageIcon,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Redo2,
  SquareCode,
  Strikethrough,
  Subscript as SubIcon,
  Superscript as SupIcon,
  Trash2,
  Underline as UnderlineIcon,
  Undo2,
  Upload,
  Loader2,
  RotateCcw,
} from "lucide-react"

export type SimpleEditorProps = {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  className?: string
}

export function SimpleEditor({ value, onChange, placeholder = "Начните ввод…", className }: SimpleEditorProps) {
  const [videoUploading, setVideoUploading] = useState(false)
  const [posterUploading, setPosterUploading] = useState(false)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const posterInputRef = useRef<HTMLInputElement>(null)
  const editor = useEditor(
    {
      immediatelyRender: false,
      shouldRerenderOnTransaction: true,
      extensions: [
        StarterKit.configure({
          heading: { levels: [1, 2, 3] },
          bulletList: { keepMarks: true },
          orderedList: { keepMarks: true },
        }),
        Underline,
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            class: "text-primary underline underline-offset-2",
            rel: "noopener noreferrer",
            target: "_blank",
          },
        }),
        Image.configure({
          HTMLAttributes: { class: "rounded-lg border border-border max-w-full h-auto my-2" },
        }),
        Placeholder.configure({ placeholder }),
        TextAlign.configure({ types: ["heading", "paragraph"] }),
        Highlight.configure({ multicolor: false }),
        Subscript,
        Superscript,
        TaskList,
        TaskItem.configure({ nested: true }),
        VideoEmbed,
      ],
      content: value || "<p></p>",
      editorProps: {
        attributes: {
          class: cn(
            "max-w-none min-h-[220px] px-3 py-2 text-sm leading-relaxed outline-none text-foreground",
            "focus:outline-none [&_p]:my-2 [&_ul]:my-2 [&_ol]:my-2",
            "[&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:text-lg [&_h3]:font-semibold",
            "[&_ul:not([data-type])]:list-disc [&_ol]:list-decimal [&_ul:not([data-type])]:pl-6 [&_ol]:pl-6",
            "[&_ul:not([data-type])_ul]:list-[circle] [&_ul:not([data-type])_ul]:pl-6",
            "[&_ul[data-type=taskList]]:list-none [&_ul[data-type=taskList]]:pl-0",
            "[&_li[data-type=taskItem]]:flex [&_li[data-type=taskItem]]:items-start [&_li[data-type=taskItem]]:gap-2",
            "[&_li[data-type=taskItem]_label]:inline-flex [&_li[data-type=taskItem]_label]:cursor-pointer [&_li[data-type=taskItem]_label]:items-start [&_li[data-type=taskItem]_label]:gap-2",
            "[&_li[data-type=taskItem]_input]:mt-0.5 [&_li[data-type=taskItem]_input]:size-4 [&_li[data-type=taskItem]_input]:shrink-0 [&_li[data-type=taskItem]_input]:accent-primary",
            "[&_li[data-type=taskItem]_>div]:min-w-0 [&_li[data-type=taskItem]_>div]:flex-1",
            "[&_blockquote]:my-3 [&_blockquote]:border-l-4 [&_blockquote]:border-primary/50 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground",
            "[&_a]:text-primary",
          ),
        },
      },
      onUpdate: ({ editor: ed }) => {
        onChange(ed.getHTML())
      },
    },
    [],
  )

  useEffect(() => {
    if (!editor) return
    const cur = editor.getHTML()
    if (value === cur) return
    editor.commands.setContent(value || "<p></p>", { emitUpdate: false })
  }, [editor, value])

  if (!editor) {
    return <div className="text-sm text-muted-foreground">Загрузка редактора…</div>
  }

  const setLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined
    const url = typeof window !== "undefined" ? window.prompt("URL ссылки", prev ?? "https://") : null
    if (url === null) return
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
  }

  const getToken = () =>
    document.cookie.split("; ").find((row) => row.startsWith("auth_token="))?.split("=")[1]

  const getSelectedVideoAttrs = (): { src: string; poster: string | null } | null => {
    if (!editor.isActive("videoEmbed")) return null
    const attrs = editor.getAttributes("videoEmbed") as { src?: string; poster?: string | null }
    const src = String(attrs.src ?? "").trim()
    if (!src) return null
    return {
      src,
      poster: attrs.poster ? String(attrs.poster) : null,
    }
  }

  const insertVideo = (src: string, poster?: string | null) => {
    const videoSrc = src.trim()
    if (!videoSrc) return
    editor.chain().focus().setVideoEmbed({ src: videoSrc, poster: poster?.trim() || null }).run()
  }

  const replaceSelectedVideoSrc = (src: string) => {
    const selected = getSelectedVideoAttrs()
    if (!selected) return false
    const videoSrc = src.trim()
    if (!videoSrc) return false
    editor
      .chain()
      .focus()
      .updateAttributes("videoEmbed", { src: videoSrc, poster: selected.poster ?? null })
      .run()
    return true
  }

  const setSelectedVideoPoster = (poster: string | null) => {
    const selected = getSelectedVideoAttrs()
    if (!selected) return false
    editor
      .chain()
      .focus()
      .updateAttributes("videoEmbed", { src: selected.src, poster: poster?.trim() || null })
      .run()
    return true
  }

  const resetSelectedVideoPreviewToPoster = () => {
    const selected = getSelectedVideoAttrs()
    if (!selected) return false
    const selectedVideoEl = editor.view.dom.querySelector(
      "figure.blog-video-embed.ProseMirror-selectednode video",
    ) as HTMLVideoElement | null
    if (!selectedVideoEl) return false
    selectedVideoEl.pause()
    selectedVideoEl.currentTime = 0
    selectedVideoEl.load()
    return true
  }

  const setVideoByUrl = () => {
    const selected = getSelectedVideoAttrs()
    const url = typeof window !== "undefined"
      ? window.prompt("URL видео (mp4/webm или стрим-ссылка)", selected?.src ?? "https://")
      : null
    if (!url || !url.trim()) return
    if (selected) {
      replaceSelectedVideoSrc(url)
      toast.success("Видео обновлено")
      return
    }
    const poster = typeof window !== "undefined" ? window.prompt("URL постера (необязательно)", "") : null
    insertVideo(url, poster)
    toast.success("Видео добавлено")
  }

  const uploadVideoFile = async (file: File | null) => {
    if (!file) return
    setVideoUploading(true)
    const token = getToken()
    const fd = new FormData()
    fd.append("file", file)
    try {
      const res = await fetch("/api/content/blog/upload/video", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: fd,
      })
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string }
        toast.error(err.error ?? "Не удалось загрузить видео")
        return
      }
      const json = (await res.json()) as { data?: { url?: string } }
      const url = json.data?.url
      if (!url) {
        toast.error("Не удалось получить URL видео")
        return
      }
      if (replaceSelectedVideoSrc(url)) {
        toast.success("Видео обновлено")
      } else {
        insertVideo(url)
        toast.success("Видео загружено")
      }
    } catch {
      toast.error("Ошибка загрузки видео")
    } finally {
      setVideoUploading(false)
      if (videoInputRef.current) videoInputRef.current.value = ""
    }
  }

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
      const posterUrl = json.data?.url
      if (!posterUrl) {
        toast.error("Не удалось получить URL постера")
        return
      }
      const selectedVideo = getSelectedVideoAttrs()
      if (!selectedVideo) {
        toast.error("Выделите нужный видеоблок в редакторе")
        return
      }
      setSelectedVideoPoster(posterUrl)
      toast.success("Постер загружен")
    } catch {
      toast.error("Ошибка загрузки постера")
    } finally {
      setPosterUploading(false)
      if (posterInputRef.current) posterInputRef.current.value = ""
    }
  }

  // const addImage = () => {
  //   const url = typeof window !== "undefined" ? window.prompt("URL изображения", "https://") : null
  //   if (!url) return
  //   editor.chain().focus().setImage({ src: url }).run()
  // }

  const selectedVideo = getSelectedVideoAttrs()
  const mediaUploading = videoUploading || posterUploading
  const mediaUploadingLabel = videoUploading
    ? "Загрузка видео..."
    : posterUploading
      ? "Загрузка постера..."
      : null

  return (
    <div className={cn("rounded-lg border border-border bg-card overflow-hidden", className)}>
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/40 px-1 py-1">
        <input
          ref={videoInputRef}
          type="file"
          className="sr-only"
          accept="video/mp4,video/webm"
          aria-hidden
          tabIndex={-1}
          onChange={(e) => void uploadVideoFile(e.target.files?.[0] ?? null)}
        />
        <input
          ref={posterInputRef}
          type="file"
          className="sr-only"
          accept="image/jpeg,image/png,image/webp,image/gif"
          aria-hidden
          tabIndex={-1}
          onChange={(e) => void uploadPosterFile(e.target.files?.[0] ?? null)}
        />
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => editor.chain().focus().undo().run()} title="Отменить">
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => editor.chain().focus().redo().run()} title="Повторить">
          <Redo2 className="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" className="mx-0.5 h-6" />
        <Toggle
          size="sm"
          pressed={editor.isActive("heading", { level: 1 })}
          onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          aria-label="Заголовок 1"
        >
          <Heading1 className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("heading", { level: 2 })}
          onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          aria-label="Заголовок 2"
        >
          <Heading2 className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("heading", { level: 3 })}
          onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          aria-label="Заголовок 3"
        >
          <Heading3 className="h-4 w-4" />
        </Toggle>
        <Separator orientation="vertical" className="mx-0.5 h-6" />
        <Toggle size="sm" pressed={editor.isActive("bold")} onPressedChange={() => editor.chain().focus().toggleBold().run()} aria-label="Жирный">
          <Bold className="h-4 w-4" />
        </Toggle>
        <Toggle size="sm" pressed={editor.isActive("italic")} onPressedChange={() => editor.chain().focus().toggleItalic().run()} aria-label="Курсив">
          <Italic className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("underline")}
          onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
          aria-label="Подчёркнутый"
        >
          <UnderlineIcon className="h-4 w-4" />
        </Toggle>
        <Toggle size="sm" pressed={editor.isActive("strike")} onPressedChange={() => editor.chain().focus().toggleStrike().run()} aria-label="Зачёркнутый">
          <Strikethrough className="h-4 w-4" />
        </Toggle>
        <Toggle size="sm" pressed={editor.isActive("code")} onPressedChange={() => editor.chain().focus().toggleCode().run()} aria-label="Код">
          <Code className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("highlight")}
          onPressedChange={() => editor.chain().focus().toggleHighlight().run()}
          aria-label="Выделение"
        >
          <Highlighter className="h-4 w-4" />
        </Toggle>
        <Toggle size="sm" pressed={editor.isActive("subscript")} onPressedChange={() => editor.chain().focus().toggleSubscript().run()} aria-label="Подстрочный">
          <SubIcon className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("superscript")}
          onPressedChange={() => editor.chain().focus().toggleSuperscript().run()}
          aria-label="Надстрочный"
        >
          <SupIcon className="h-4 w-4" />
        </Toggle>
        <Separator orientation="vertical" className="mx-0.5 h-6" />
        <Toggle
          size="sm"
          pressed={editor.isActive({ textAlign: "left" })}
          onPressedChange={() => editor.chain().focus().setTextAlign("left").run()}
          aria-label="Влево"
        >
          <AlignLeft className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive({ textAlign: "center" })}
          onPressedChange={() => editor.chain().focus().setTextAlign("center").run()}
          aria-label="По центру"
        >
          <AlignCenter className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive({ textAlign: "right" })}
          onPressedChange={() => editor.chain().focus().setTextAlign("right").run()}
          aria-label="Вправо"
        >
          <AlignRight className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive({ textAlign: "justify" })}
          onPressedChange={() => editor.chain().focus().setTextAlign("justify").run()}
          aria-label="По ширине"
        >
          <AlignJustify className="h-4 w-4" />
        </Toggle>
        <Separator orientation="vertical" className="mx-0.5 h-6" />
        <Toggle
          size="sm"
          pressed={editor.isActive("bulletList")}
          onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
          aria-label="Маркированный список"
        >
          <List className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("orderedList")}
          onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
          aria-label="Нумерованный список"
        >
          <ListOrdered className="h-4 w-4" />
        </Toggle>
        {/* <Toggle
          size="sm"
          pressed={editor.isActive("taskList")}
          onPressedChange={() => editor.chain().focus().toggleTaskList().run()}
          aria-label="Чеклист"
        >
          <ListTodo className="h-4 w-4" />
        </Toggle> */}
        <Toggle
          size="sm"
          pressed={editor.isActive("blockquote")}
          onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
          aria-label="Цитата"
        >
          <Quote className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("codeBlock")}
          onPressedChange={() => editor.chain().focus().toggleCodeBlock().run()}
          aria-label="Блок кода"
        >
          <SquareCode className="h-4 w-4" />
        </Toggle>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Разделитель">
          <Minus className="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" className="mx-0.5 h-6" />
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={setLink} title="Ссылка">
          <Link2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={setVideoByUrl}
          title="Видео по URL"
          disabled={mediaUploading}
        >
          <Film className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title={selectedVideo ? "Вернуть отображение постера" : "Сначала выделите видео"}
          disabled={!selectedVideo || mediaUploading}
          onClick={() => {
            if (!resetSelectedVideoPreviewToPoster()) {
              toast.error("Не удалось вернуть отображение постера")
              return
            }
            toast.success("Постер снова отображается")
          }}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Загрузить видео (mp4/webm, до 100MB)"
          disabled={mediaUploading}
          onClick={() => videoInputRef.current?.click()}
        >
          {videoUploading ? <div className="relative w-4 h-4"><Loader2 className="size-4 inset-0 absolute animate-spin" /></div> : <Upload className="h-4 w-4" />}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title={selectedVideo ? "Загрузить постер для выбранного видео" : "Сначала выделите видео в редакторе"}
          disabled={mediaUploading || !selectedVideo}
          onClick={() => posterInputRef.current?.click()}
        >
          {posterUploading ? (
            <div className="relative w-4 h-4"><Loader2 className="size-4 inset-0 absolute animate-spin" /></div>
          ) : (
            <ImageIcon className="h-4 w-4" />
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title={selectedVideo?.poster ? "Удалить постер у выбранного видео" : "У выбранного видео нет постера"}
          disabled={mediaUploading || !selectedVideo?.poster}
          onClick={() => {
            if (!setSelectedVideoPoster(null)) return
            toast.success("Постер удалён")
          }}
        >
          <ImageIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Удалить выбранное видео"
          disabled={!selectedVideo || mediaUploading}
          onClick={() => editor.chain().focus().unsetSelectedVideoEmbed().run()}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      {mediaUploading ? (
        <div className="flex items-center gap-2 border-b border-border bg-muted/20 px-3 py-1.5 text-xs text-muted-foreground">
          <div className="relative h-3.5 w-3.5"><Loader2 className="size-3.5 inset-0 absolute animate-spin" /></div>
          <span>{mediaUploadingLabel}</span>
        </div>
      ) : null}
      <div className="border-b border-border bg-muted/20 px-3 py-1.5 text-xs text-muted-foreground">
        {selectedVideo
          ? `Выбрано видео: ${selectedVideo.src}${selectedVideo.poster ? ` (постер: ${selectedVideo.poster})` : " (без постера)"}`
          : "Выделите видеоблок в редакторе, чтобы заменить видео/постер или удалить их."}
      </div>
      <EditorContent editor={editor} className="tiptap-simple-editor max-h-[min(480px,55vh)] overflow-y-auto" />
    </div>
  )
}
