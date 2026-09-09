"use client"

/**
 * Редактор на базе TipTap (набор расширений и тулбар в духе официального Simple Editor template).
 * @see https://tiptap.dev/docs/ui-components/templates/simple-editor
 */
import { useEffect, useRef, useState } from "react"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import TextAlign from "@tiptap/extension-text-align"
import Underline from "@tiptap/extension-underline"
import TaskList from "@tiptap/extension-task-list"
import TaskItem from "@tiptap/extension-task-item"
import Highlight from "@tiptap/extension-highlight"
import Subscript from "@tiptap/extension-subscript"
import Superscript from "@tiptap/extension-superscript"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Toggle } from "@/components/ui/toggle"
import { cn } from "@/lib/utils"
import { VideoEmbed } from "@/components/tiptap-templates/simple/extensions/video-embed"
import { ImageWithOverlay } from "@/components/tiptap-templates/simple/extensions/image-with-overlay"
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
  Plus,
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
  Crop,
} from "lucide-react"

export type SimpleEditorProps = {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  className?: string
}

export function SimpleEditor({ value, onChange, placeholder = "Начните ввод…", className }: SimpleEditorProps) {
  const [imageUploading, setImageUploading] = useState(false)
  const [videoUploading, setVideoUploading] = useState(false)
  const [posterUploading, setPosterUploading] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const selectedImageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const posterInputRef = useRef<HTMLInputElement>(null)
  const [imageEditorOpen, setImageEditorOpen] = useState(false)
  const [imageEditorImageUrl, setImageEditorImageUrl] = useState("")
  const [imageEditorImageEl, setImageEditorImageEl] = useState<HTMLImageElement | null>(null)
  const [imageEditorScale, setImageEditorScale] = useState(1)
  const [imageEditorWidth, setImageEditorWidth] = useState(1200)
  const [imageEditorHeight, setImageEditorHeight] = useState(630)
  const [imageEditorPanX, setImageEditorPanX] = useState(0)
  const [imageEditorPanY, setImageEditorPanY] = useState(0)
  const [imageEditorDragging, setImageEditorDragging] = useState(false)
  const imageEditorDragStartRef = useRef<{
    x: number
    y: number
    panX: number
    panY: number
  } | null>(null)
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
        ImageWithOverlay.configure({
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
        handlePaste: (_view, event) => {
          const files = event.clipboardData?.files
          if (!files?.length) return false
          const imageFile = Array.from(files).find((f) => f.type.startsWith("image/"))
          if (!imageFile) return false
          event.preventDefault()
          void uploadInlineImageFile(imageFile)
          return true
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
    document.cookie
      .split("; ")
      .find((row) => row.startsWith("auth_token="))
      ?.split("=")[1]

  const getSelectedImageAttrs = (): {
    src: string
    width: number
    align: "left" | "center" | "right"
  } | null => {
    if (!editor.isActive("image")) return null
    const attrs = editor.getAttributes("image") as {
      src?: string
      width?: number
      align?: "left" | "center" | "right"
    }
    const src = String(attrs.src ?? "").trim()
    if (!src) return null
    const width = Math.max(20, Math.min(100, Number(attrs.width ?? 100)))
    const align = attrs.align === "left" || attrs.align === "right" ? attrs.align : "center"
    return { src, width, align }
  }

  const selectedImage = getSelectedImageAttrs()

  const updateSelectedImageAttrs = (attrs: { src?: string; width?: number; align?: "left" | "center" | "right" }) => {
    if (!selectedImage) return false
    editor.chain().focus().updateAttributes("image", attrs).run()
    return true
  }

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
    editor
      .chain()
      .focus()
      .setVideoEmbed({ src: videoSrc, poster: poster?.trim() || null })
      .run()
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
    const selectedVideoEl = editor.view.dom.querySelector("figure.blog-video-embed.ProseMirror-selectednode video") as HTMLVideoElement | null
    if (!selectedVideoEl) return false
    selectedVideoEl.pause()
    selectedVideoEl.currentTime = 0
    selectedVideoEl.load()
    return true
  }

  const setVideoByUrl = () => {
    const selected = getSelectedVideoAttrs()
    const url = typeof window !== "undefined" ? window.prompt("URL видео (mp4/webm или стрим-ссылка)", selected?.src ?? "https://") : null
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

  const uploadInlineImageFile = async (file: File | null) => {
    if (!file) return
    setImageUploading(true)
    try {
      const localUrl = URL.createObjectURL(file)
      editor
        .chain()
        .focus()
        .insertContent({ type: "image", attrs: { src: localUrl } })
        .run()
      toast.success("Изображение добавлено локально")
    } catch {
      toast.error("Ошибка добавления изображения")
    } finally {
      setImageUploading(false)
      if (imageInputRef.current) imageInputRef.current.value = ""
    }
  }

  const replaceSelectedImageFile = async (file: File | null) => {
    if (!file || !selectedImage) return
    setImageUploading(true)
    try {
      const localUrl = URL.createObjectURL(file)
      updateSelectedImageAttrs({ src: localUrl })
      toast.success("Изображение обновлено локально")
    } catch {
      toast.error("Ошибка обновления изображения")
    } finally {
      setImageUploading(false)
      if (selectedImageInputRef.current) selectedImageInputRef.current.value = ""
    }
  }

  const replaceSelectedImageByUrl = () => {
    if (!selectedImage) return
    const url = typeof window !== "undefined" ? window.prompt("URL изображения", selectedImage.src || "https://") : null
    if (!url || !url.trim()) return
    updateSelectedImageAttrs({ src: url.trim() })
    toast.success("Изображение обновлено")
  }

  const removeSelectedImage = () => {
    if (!selectedImage) return
    editor.chain().focus().deleteSelection().run()
    toast.success("Изображение удалено")
  }

  const setSelectedImageAlign = (align: "left" | "center" | "right") => {
    if (!selectedImage) return
    updateSelectedImageAttrs({ align })
  }

  const setSelectedImageWidthDelta = (delta: number) => {
    if (!selectedImage) return
    const next = Math.max(20, Math.min(100, Math.round(selectedImage.width + delta)))
    updateSelectedImageAttrs({ width: next })
  }

  const openImageEditorFromSrc = async (src: string) => {
    try {
      const res = await fetch(src)
      if (!res.ok) {
        toast.error("Не удалось открыть изображение")
        return
      }
      const blob = await res.blob()
      const objectUrl = URL.createObjectURL(blob)
      const img = new Image()
      const loadedImage = await new Promise<HTMLImageElement | null>((resolve) => {
        img.onload = () => resolve(img)
        img.onerror = () => resolve(null)
        img.src = objectUrl
      })
      if (!loadedImage) {
        URL.revokeObjectURL(objectUrl)
        toast.error("Не удалось подготовить изображение")
        return
      }
      setImageEditorImageEl(loadedImage)
      setImageEditorImageUrl(objectUrl)
      setImageEditorScale(1)
      setImageEditorPanX(0)
      setImageEditorPanY(0)
      setImageEditorWidth(Math.min(Math.max(loadedImage.naturalWidth, 320), 2400))
      setImageEditorHeight(Math.min(Math.max(loadedImage.naturalHeight, 180), 2400))
      setImageEditorOpen(true)
    } catch {
      toast.error("Ошибка открытия изображения")
    }
  }

  const closeImageEditor = () => {
    setImageEditorOpen(false)
    if (imageEditorImageUrl) URL.revokeObjectURL(imageEditorImageUrl)
    setImageEditorImageUrl("")
    setImageEditorImageEl(null)
    setImageEditorScale(1)
    setImageEditorPanX(0)
    setImageEditorPanY(0)
    setImageEditorDragging(false)
    imageEditorDragStartRef.current = null
  }

  const applyImageEditor = async () => {
    if (!selectedImage || !imageEditorImageEl) return
    const widthPx = Math.max(100, Math.min(2400, Math.round(imageEditorWidth)))
    const heightPx = Math.max(100, Math.min(2400, Math.round(imageEditorHeight)))
    const sourceW = imageEditorImageEl.naturalWidth
    const sourceH = imageEditorImageEl.naturalHeight
    const targetAspect = widthPx / heightPx
    const sourceAspect = sourceW / sourceH
    const baseCropW = sourceAspect > targetAspect ? sourceH * targetAspect : sourceW
    const baseCropH = sourceAspect > targetAspect ? sourceH : sourceW / targetAspect
    const zoom = Math.max(1, Math.min(3, imageEditorScale))
    const cropW = baseCropW / zoom
    const cropH = baseCropH / zoom
    const maxOffsetX = Math.max(0, (baseCropW - cropW) / 2)
    const maxOffsetY = Math.max(0, (baseCropH - cropH) / 2)
    const sx = (sourceW - cropW) / 2 + imageEditorPanX * maxOffsetX
    const sy = (sourceH - cropH) / 2 + imageEditorPanY * maxOffsetY

    const canvas = document.createElement("canvas")
    canvas.width = widthPx
    canvas.height = heightPx
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      toast.error("Не удалось обработать изображение")
      return
    }
    ctx.drawImage(imageEditorImageEl, sx, sy, cropW, cropH, 0, 0, widthPx, heightPx)
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((value) => resolve(value), "image/webp", 0.92)
    })
    if (!blob) {
      toast.error("Не удалось создать файл")
      return
    }
    const localUrl = URL.createObjectURL(blob)
    updateSelectedImageAttrs({ src: localUrl })
    closeImageEditor()
    toast.success("Изображение обновлено локально")
  }

  const clampPan = (value: number) => Math.max(-1, Math.min(1, value))
  const handleImageEditorPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (imageEditorScale <= 1) return
    event.currentTarget.setPointerCapture(event.pointerId)
    setImageEditorDragging(true)
    imageEditorDragStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      panX: imageEditorPanX,
      panY: imageEditorPanY,
    }
  }
  const handleImageEditorPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!imageEditorDragging || !imageEditorDragStartRef.current) return
    const dragStart = imageEditorDragStartRef.current
    const container = event.currentTarget.getBoundingClientRect()
    const maxDxPx = (container.width * (imageEditorScale - 1)) / 2
    const maxDyPx = (container.height * (imageEditorScale - 1)) / 2
    const nextPanX = maxDxPx > 0 ? clampPan(dragStart.panX + (event.clientX - dragStart.x) / maxDxPx) : 0
    const nextPanY = maxDyPx > 0 ? clampPan(dragStart.panY + (event.clientY - dragStart.y) / maxDyPx) : 0
    setImageEditorPanX(nextPanX)
    setImageEditorPanY(nextPanY)
  }
  const handleImageEditorPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    setImageEditorDragging(false)
    imageEditorDragStartRef.current = null
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
  const mediaUploading = imageUploading || videoUploading || posterUploading
  const mediaUploadingLabel = imageUploading ? "Подготовка изображения..." : videoUploading ? "Загрузка видео..." : posterUploading ? "Загрузка постера..." : null

  return (
    <div className={cn("rounded-lg border border-border bg-card overflow-hidden", className)}>
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/40 px-1 py-1">
        <input
          ref={imageInputRef}
          type="file"
          className="sr-only"
          accept="image/jpeg,image/png,image/webp,image/gif"
          aria-hidden
          tabIndex={-1}
          onChange={(e) => void uploadInlineImageFile(e.target.files?.[0] ?? null)}
        />
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
        <input
          ref={selectedImageInputRef}
          type="file"
          className="sr-only"
          accept="image/jpeg,image/png,image/webp,image/gif"
          aria-hidden
          tabIndex={-1}
          onChange={(e) => void replaceSelectedImageFile(e.target.files?.[0] ?? null)}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().undo().run()}
          title="Отменить"
        >
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().redo().run()}
          title="Повторить"
        >
          <Redo2 className="h-4 w-4" />
        </Button>
        <Separator
          orientation="vertical"
          className="mx-0.5 h-6"
        />
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
        <Separator
          orientation="vertical"
          className="mx-0.5 h-6"
        />
        <Toggle
          size="sm"
          pressed={editor.isActive("bold")}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
          aria-label="Жирный"
        >
          <Bold className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("italic")}
          onPressedChange={() => editor.chain().focus().toggleItalic().run()}
          aria-label="Курсив"
        >
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
        <Toggle
          size="sm"
          pressed={editor.isActive("strike")}
          onPressedChange={() => editor.chain().focus().toggleStrike().run()}
          aria-label="Зачёркнутый"
        >
          <Strikethrough className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive("code")}
          onPressedChange={() => editor.chain().focus().toggleCode().run()}
          aria-label="Код"
        >
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
        <Toggle
          size="sm"
          pressed={editor.isActive("subscript")}
          onPressedChange={() => editor.chain().focus().toggleSubscript().run()}
          aria-label="Подстрочный"
        >
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
        <Separator
          orientation="vertical"
          className="mx-0.5 h-6"
        />
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
        <Separator
          orientation="vertical"
          className="mx-0.5 h-6"
        />
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
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title="Разделитель"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Separator
          orientation="vertical"
          className="mx-0.5 h-6"
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={setLink}
          title="Ссылка"
        >
          <Link2 className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          title="Загрузить изображение"
          disabled={mediaUploading}
          onClick={() => imageInputRef.current?.click()}
        >
          {imageUploading ? (
            <div className="relative w-4 h-4">
              <Loader2 className="size-4 inset-0 absolute animate-spin" />
            </div>
          ) : (
            <ImageIcon className="h-4 w-4" />
          )}
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
          {videoUploading ? (
            <div className="relative w-4 h-4">
              <Loader2 className="size-4 inset-0 absolute animate-spin" />
            </div>
          ) : (
            <Upload className="h-4 w-4" />
          )}
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
            <div className="relative w-4 h-4">
              <Loader2 className="size-4 inset-0 absolute animate-spin" />
            </div>
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
        {selectedImage ? (
          <>
            <Separator
              orientation="vertical"
              className="mx-0.5 h-6"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Crop/Zoom (локально)"
              onClick={() => void openImageEditorFromSrc(selectedImage.src)}
            >
              <Crop className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Шире"
              onClick={() => setSelectedImageWidthDelta(10)}
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Уже"
              onClick={() => setSelectedImageWidthDelta(-10)}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Выравнивание влево"
              onClick={() => setSelectedImageAlign("left")}
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Выравнивание по центру"
              onClick={() => setSelectedImageAlign("center")}
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Выравнивание вправо"
              onClick={() => setSelectedImageAlign("right")}
            >
              <AlignRight className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Заменить выбранное изображение файлом"
              onClick={() => selectedImageInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Заменить выбранное изображение по URL"
              onClick={replaceSelectedImageByUrl}
            >
              <Link2 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              title="Удалить выбранное изображение"
              onClick={removeSelectedImage}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        ) : null}
      </div>
      {mediaUploading ? (
        <div className="flex items-center gap-2 border-b border-border bg-muted/20 px-3 py-1.5 text-xs text-muted-foreground">
          <div className="relative h-3.5 w-3.5">
            <Loader2 className="size-3.5 inset-0 absolute animate-spin" />
          </div>
          <span>{mediaUploadingLabel}</span>
        </div>
      ) : null}
      <div className="border-b border-border bg-muted/20 px-3 py-1.5 text-xs text-muted-foreground">
        {selectedImage
          ? `Выбрано изображение: ${selectedImage.src} (${selectedImage.width}%, ${selectedImage.align})`
          : selectedVideo
            ? `Выбрано видео: ${selectedVideo.src}${selectedVideo.poster ? ` (постер: ${selectedVideo.poster})` : " (без постера)"}`
            : "Выделите изображение или видеоблок в редакторе, чтобы изменить медиа-параметры."}
      </div>
      <EditorContent
        editor={editor}
        className="tiptap-simple-editor max-h-[min(480px,55vh)] overflow-y-auto"
      />
      <Dialog
        open={imageEditorOpen}
        onOpenChange={(open) => (!open ? closeImageEditor() : setImageEditorOpen(true))}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Редактор изображения</DialogTitle>
            <DialogDescription>Настройте масштаб и размер. При масштабе больше 1x можно перетаскивать изображение.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="selected-image-width">Ширина, px</Label>
                <Input
                  id="selected-image-width"
                  type="number"
                  min={100}
                  max={2400}
                  value={imageEditorWidth}
                  onChange={(e) => setImageEditorWidth(Number(e.target.value) || 0)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="selected-image-height">Высота, px</Label>
                <Input
                  id="selected-image-height"
                  type="number"
                  min={100}
                  max={2400}
                  value={imageEditorHeight}
                  onChange={(e) => setImageEditorHeight(Number(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between text-sm">
                <Label>Масштаб</Label>
                <span className="text-muted-foreground">{imageEditorScale.toFixed(2)}x</span>
              </div>
              <Slider
                min={1}
                max={3}
                step={0.01}
                value={[imageEditorScale]}
                onValueChange={(value) => {
                  const next = value[0] ?? 1
                  setImageEditorScale(next)
                  if (next <= 1) {
                    setImageEditorPanX(0)
                    setImageEditorPanY(0)
                  }
                }}
              />
            </div>
            {imageEditorImageUrl ? (
              <div
                className="relative mx-auto overflow-hidden rounded-md border bg-muted/30"
                style={{
                  width: "100%",
                  maxWidth: "560px",
                  aspectRatio: `${Math.max(100, imageEditorWidth)} / ${Math.max(100, imageEditorHeight)}`,
                }}
                onPointerDown={handleImageEditorPointerDown}
                onPointerMove={handleImageEditorPointerMove}
                onPointerUp={handleImageEditorPointerUp}
                onPointerCancel={handleImageEditorPointerUp}
              >
                <img
                  src={imageEditorImageUrl}
                  alt="Предпросмотр перед применением"
                  className={`h-full w-full object-cover ${imageEditorScale > 1 ? "select-none" : ""}`}
                  draggable={false}
                  style={{
                    transform: `translate(${imageEditorPanX * ((imageEditorScale - 1) * 50)}%, ${imageEditorPanY * ((imageEditorScale - 1) * 50)}%) scale(${imageEditorScale})`,
                    cursor: imageEditorScale > 1 ? (imageEditorDragging ? "grabbing" : "grab") : "default",
                    touchAction: "none",
                  }}
                />
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={closeImageEditor}
            >
              Отмена
            </Button>
            <Button
              type="button"
              onClick={() => void applyImageEditor()}
            >
              Применить локально
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
