"use client"

import { useRef, useState } from "react"
import { NodeViewWrapper } from "@tiptap/react"
import { AlignCenter, AlignLeft, AlignRight, Crop, ImageIcon, Link2, Minus, Plus, Trash2, Upload } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"

type ImageNodeViewProps = {
  node: {
    attrs?: {
      src?: string
      alt?: string | null
      title?: string | null
      width?: number
      align?: "left" | "center" | "right"
    }
  }
  updateAttributes: (attrs: { src?: string; alt?: string | null; title?: string | null; width?: number; align?: "left" | "center" | "right" }) => void
  deleteNode: () => void
  selected: boolean
}

export function ImageNodeView({ node, updateAttributes, deleteNode, selected }: ImageNodeViewProps) {
  const src = String(node.attrs?.src ?? "").trim()
  const width = Math.max(20, Math.min(100, Number(node.attrs?.width ?? 100)))
  const align = (node.attrs?.align ?? "center") as "left" | "center" | "right"
  const inputRef = useRef<HTMLInputElement>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editorImageUrl, setEditorImageUrl] = useState("")
  const [editorImageEl, setEditorImageEl] = useState<HTMLImageElement | null>(null)
  const [editorScale, setEditorScale] = useState(1)
  const [editorWidth, setEditorWidth] = useState(1200)
  const [editorHeight, setEditorHeight] = useState(630)
  const [editorPanX, setEditorPanX] = useState(0)
  const [editorPanY, setEditorPanY] = useState(0)
  const [editorDragging, setEditorDragging] = useState(false)
  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null)

  const openEditorForFile = async (file: File | null) => {
    if (!file) return
    const objectUrl = URL.createObjectURL(file)
    const img = new Image()
    const loadedImage = await new Promise<HTMLImageElement | null>((resolve) => {
      img.onload = () => resolve(img)
      img.onerror = () => resolve(null)
      img.src = objectUrl
    })
    if (!loadedImage) {
      URL.revokeObjectURL(objectUrl)
      toast.error("Не удалось открыть изображение")
      if (inputRef.current) inputRef.current.value = ""
      return
    }
    setEditorImageEl(loadedImage)
    setEditorImageUrl(objectUrl)
    setEditorScale(1)
    setEditorPanX(0)
    setEditorPanY(0)
    setEditorWidth(Math.min(Math.max(loadedImage.naturalWidth, 320), 2400))
    setEditorHeight(Math.min(Math.max(loadedImage.naturalHeight, 180), 2400))
    setEditorOpen(true)
  }

  const closeEditor = () => {
    setEditorOpen(false)
    if (editorImageUrl) URL.revokeObjectURL(editorImageUrl)
    setEditorImageUrl("")
    setEditorImageEl(null)
    setEditorScale(1)
    setEditorPanX(0)
    setEditorPanY(0)
    setEditorDragging(false)
    dragStartRef.current = null
    if (inputRef.current) inputRef.current.value = ""
  }

  const reopenEditorFromCurrent = async () => {
    if (!src) return
    try {
      const res = await fetch(src)
      if (!res.ok) {
        toast.error("Не удалось открыть изображение")
        return
      }
      const blob = await res.blob()
      const ext = blob.type.includes("png") ? "png" : blob.type.includes("webp") ? "webp" : "jpg"
      await openEditorForFile(new File([blob], `inline-edit.${ext}`, { type: blob.type || "image/jpeg" }))
    } catch {
      toast.error("Ошибка открытия изображения")
    }
  }

  const applyLocalImage = async () => {
    if (!editorImageEl) return
    const widthPx = Math.max(100, Math.min(2400, Math.round(editorWidth)))
    const heightPx = Math.max(100, Math.min(2400, Math.round(editorHeight)))
    const sourceW = editorImageEl.naturalWidth
    const sourceH = editorImageEl.naturalHeight
    const targetAspect = widthPx / heightPx
    const sourceAspect = sourceW / sourceH
    const baseCropW = sourceAspect > targetAspect ? sourceH * targetAspect : sourceW
    const baseCropH = sourceAspect > targetAspect ? sourceH : sourceW / targetAspect
    const zoom = Math.max(1, Math.min(3, editorScale))
    const cropW = baseCropW / zoom
    const cropH = baseCropH / zoom
    const maxOffsetX = Math.max(0, (baseCropW - cropW) / 2)
    const maxOffsetY = Math.max(0, (baseCropH - cropH) / 2)
    const sx = (sourceW - cropW) / 2 + editorPanX * maxOffsetX
    const sy = (sourceH - cropH) / 2 + editorPanY * maxOffsetY

    const canvas = document.createElement("canvas")
    canvas.width = widthPx
    canvas.height = heightPx
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      toast.error("Не удалось обработать изображение")
      return
    }
    ctx.drawImage(editorImageEl, sx, sy, cropW, cropH, 0, 0, widthPx, heightPx)
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((value) => resolve(value), "image/webp", 0.92)
    })
    if (!blob) {
      toast.error("Не удалось создать файл")
      return
    }
    const localUrl = URL.createObjectURL(blob)
    updateAttributes({ src: localUrl })
    closeEditor()
    toast.success("Изображение обновлено локально")
  }

  const replaceByUrl = () => {
    const url = typeof window !== "undefined" ? window.prompt("URL изображения", src || "https://") : null
    if (!url || !url.trim()) return
    updateAttributes({ src: url.trim() })
    toast.success("Изображение обновлено")
  }
  const clampPan = (value: number) => Math.max(-1, Math.min(1, value))
  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (editorScale <= 1) return
    event.currentTarget.setPointerCapture(event.pointerId)
    setEditorDragging(true)
    dragStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      panX: editorPanX,
      panY: editorPanY,
    }
  }
  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!editorDragging || !dragStartRef.current) return
    const dragStart = dragStartRef.current
    const container = event.currentTarget.getBoundingClientRect()
    const maxDxPx = (container.width * (editorScale - 1)) / 2
    const maxDyPx = (container.height * (editorScale - 1)) / 2
    const nextPanX = maxDxPx > 0 ? clampPan(dragStart.panX + (event.clientX - dragStart.x) / maxDxPx) : 0
    const nextPanY = maxDyPx > 0 ? clampPan(dragStart.panY + (event.clientY - dragStart.y) / maxDyPx) : 0
    setEditorPanX(nextPanX)
    setEditorPanY(nextPanY)
  }
  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId)
    setEditorDragging(false)
    dragStartRef.current = null
  }

  const setAlign = (nextAlign: "left" | "center" | "right") => {
    updateAttributes({ align: nextAlign })
  }

  const setWidthDelta = (delta: number) => {
    const next = Math.max(20, Math.min(100, Math.round(width + delta)))
    updateAttributes({ width: next })
  }

  return (
    <NodeViewWrapper
      as="figure"
      data-inline-image="true"
      className={`blog-inline-image group relative my-4 overflow-hidden rounded-lg border border-border bg-muted/20 ${selected ? "ring-2 ring-primary/50" : ""}`}
      style={{
        width: `${width}%`,
        marginLeft: align === "left" ? "0" : align === "center" ? "auto" : "auto",
        marginRight: align === "right" ? "0" : align === "center" ? "auto" : "auto",
      }}
    >
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        accept="image/jpeg,image/png,image/webp,image/gif"
        aria-hidden
        tabIndex={-1}
        onChange={(e) => void openEditorForFile(e.target.files?.[0] ?? null)}
      />
      <div className="absolute top-2 right-2 z-20 flex items-center gap-1 rounded-md border border-border/70 bg-background/90 p-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          title="Уменьшить"
          onClick={() => setWidthDelta(-10)}
        >
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          title="Увеличить"
          onClick={() => setWidthDelta(10)}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          title="Влево"
          onClick={() => setAlign("left")}
        >
          <AlignLeft className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          title="По центру"
          onClick={() => setAlign("center")}
        >
          <AlignCenter className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          title="Вправо"
          onClick={() => setAlign("right")}
        >
          <AlignRight className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          title="Редактировать (crop/zoom)"
          onClick={() => void reopenEditorFromCurrent()}
        >
          <Crop className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          title="Заменить файлом"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          title="Заменить по URL"
          onClick={replaceByUrl}
        >
          <Link2 className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive hover:text-destructive"
          title="Удалить изображение"
          onClick={() => deleteNode()}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
      <img
        src={src}
        alt={String(node.attrs?.alt ?? "")}
        className="w-full bg-muted/20"
        draggable={false}
      />
      <figcaption className="mt-1 text-[11px] text-muted-foreground">
        <ImageIcon className="mr-1 inline h-3 w-3" />
        {width}% • {align} • нажмите на иконку Crop для расширенного редактирования
      </figcaption>
      <Dialog
        open={editorOpen}
        onOpenChange={(open) => (!open ? closeEditor() : setEditorOpen(true))}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Редактор изображения</DialogTitle>
            <DialogDescription>Масштабируйте и перетаскивайте изображение. Изменения сохраняются локально до сохранения статьи.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="inline-image-width">Ширина, px</Label>
                <Input
                  id="inline-image-width"
                  type="number"
                  min={100}
                  max={2400}
                  value={editorWidth}
                  onChange={(e) => setEditorWidth(Number(e.target.value) || 0)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="inline-image-height">Высота, px</Label>
                <Input
                  id="inline-image-height"
                  type="number"
                  min={100}
                  max={2400}
                  value={editorHeight}
                  onChange={(e) => setEditorHeight(Number(e.target.value) || 0)}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between text-sm">
                <Label>Масштаб</Label>
                <span className="text-muted-foreground">{editorScale.toFixed(2)}x</span>
              </div>
              <Slider
                min={1}
                max={3}
                step={0.01}
                value={[editorScale]}
                onValueChange={(value) => {
                  const next = value[0] ?? 1
                  setEditorScale(next)
                  if (next <= 1) {
                    setEditorPanX(0)
                    setEditorPanY(0)
                  }
                }}
              />
            </div>
            {editorImageUrl ? (
              <div
                className="relative mx-auto overflow-hidden rounded-md border bg-muted/30"
                style={{
                  width: "100%",
                  maxWidth: "560px",
                  aspectRatio: `${Math.max(100, editorWidth)} / ${Math.max(100, editorHeight)}`,
                }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              >
                <img
                  src={editorImageUrl}
                  alt="Предпросмотр"
                  className={`h-full w-full object-cover ${editorScale > 1 ? "select-none" : ""}`}
                  draggable={false}
                  style={{
                    transform: `translate(${editorPanX * ((editorScale - 1) * 50)}%, ${editorPanY * ((editorScale - 1) * 50)}%) scale(${editorScale})`,
                    cursor: editorScale > 1 ? (editorDragging ? "grabbing" : "grab") : "default",
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
              onClick={closeEditor}
            >
              Отмена
            </Button>
            <Button
              type="button"
              onClick={() => void applyLocalImage()}
            >
              Применить локально
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </NodeViewWrapper>
  )
}
