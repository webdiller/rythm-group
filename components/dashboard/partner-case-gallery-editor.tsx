"use client"

import { useEffect, useState } from "react"
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { GripVertical, Trash2 } from "lucide-react"
import { toast } from "sonner"
import {
  getPartnerGalleryOriginalSrc,
  getPartnerGalleryThumbnailSrc,
  parsePartnerCaseGalleryJson,
  serializePartnerCaseGallery,
  type PartnerCaseGalleryImage,
} from "@/lib/s3/partner-gallery-url"

function GalleryUploadSkeleton() {
  return (
    <div
      className="flex items-center gap-3 rounded-md border border-border bg-muted/20 p-2"
      aria-hidden
    >
      <Skeleton className="bg-black/30 h-4 w-4 shrink-0 rounded" />
      <Skeleton className="bg-black/30 h-14 w-20 shrink-0 rounded" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="bg-black/30 h-3 w-24" />
        <Skeleton className="bg-black/30 h-3 w-32" />
      </div>
      <Skeleton className="bg-black/30 h-9 w-9 shrink-0 rounded-md" />
    </div>
  )
}

function SortableGalleryItem({
  image,
  disabled,
  onDelete,
}: {
  image: PartnerCaseGalleryImage
  disabled?: boolean
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: image.id,
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  }
  const thumbSrc = getPartnerGalleryThumbnailSrc(image.thumbnailKey)
  const originalSrc = getPartnerGalleryOriginalSrc(image.originalKey)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-md border border-border bg-muted/20 p-2"
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground hover:text-foreground"
        aria-label="Перетащить"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="h-14 w-20 overflow-hidden rounded border border-border bg-muted">
        {thumbSrc ? (
          <img
            src={thumbSrc}
            alt=""
            width={image.thumbnailWidth}
            height={image.thumbnailHeight}
            className="h-full w-full object-cover"
          />
        ) : null}
      </div>
      <div className="min-w-0 flex-1 text-xs text-muted-foreground">
        <p className="truncate font-medium text-foreground">
          {image.width}×{image.height}
        </p>
        <p className="truncate">thumb {image.thumbnailWidth}×{image.thumbnailHeight}</p>
        {originalSrc ? (
          <a
            href={originalSrc}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            original
          </a>
        ) : null}
      </div>
      <Button
        type="button"
        variant="outline"
        size="icon"
        disabled={disabled}
        onClick={onDelete}
        aria-label="Удалить"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

type PartnerCaseGalleryEditorProps = {
  partnerId: number
  initialGalleryJson: string | null | undefined
  onGalleryJsonChange?: (caseGalleryJson: string) => void
}

export function PartnerCaseGalleryEditor({
  partnerId,
  initialGalleryJson,
  onGalleryJsonChange,
}: PartnerCaseGalleryEditorProps) {
  const [images, setImages] = useState<PartnerCaseGalleryImage[]>(() =>
    parsePartnerCaseGalleryJson(initialGalleryJson),
  )
  const [uploadingCount, setUploadingCount] = useState(0)
  const [busy, setBusy] = useState(false)
  const uploading = uploadingCount > 0

  const commitImages = (next: PartnerCaseGalleryImage[]) => {
    setImages(next)
    onGalleryJsonChange?.(serializePartnerCaseGallery(next))
  }

  useEffect(() => {
    setImages(parsePartnerCaseGalleryJson(initialGalleryJson))
  }, [initialGalleryJson, partnerId])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const getToken = () =>
    document.cookie.split("; ").find((row) => row.startsWith("auth_token="))?.split("=")[1]

  const handleUpload = async (fileList: FileList | null) => {
    const files = fileList ? Array.from(fileList) : []
    if (files.length === 0) return
    const maxSizeBytes = 15 * 1024 * 1024
    const tooLarge = files.find((file) => file.size > maxSizeBytes)
    if (tooLarge) {
      toast.error("Каждый файл не должен превышать 15 МБ")
      return
    }
    setUploadingCount(files.length)
    try {
      const token = getToken()
      const formData = new FormData()
      for (const file of files) {
        formData.append("file", file)
      }
      formData.append("partnerId", String(partnerId))
      const res = await fetch("/api/content/partners/gallery", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      })
      if (!res.ok) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null
        toast.error(err?.error ?? "Не удалось загрузить изображения")
        return
      }
      const json = (await res.json()) as {
        data?: { images?: PartnerCaseGalleryImage[]; uploaded?: PartnerCaseGalleryImage[] }
      }
      const next = json.data?.images ?? []
      commitImages(next)
      const count = json.data?.uploaded?.length ?? files.length
      toast.success(
        count === 1 ? "Изображение добавлено в галерею" : `Добавлено изображений: ${count}`,
      )
    } catch {
      toast.error("Не удалось загрузить изображения")
    } finally {
      setUploadingCount(0)
    }
  }

  const handleDelete = async (imageId: string) => {
    setBusy(true)
    try {
      const token = getToken()
      const res = await fetch("/api/content/partners/gallery", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ partnerId, imageId }),
      })
      if (!res.ok) {
        toast.error("Не удалось удалить изображение")
        return
      }
      const json = (await res.json()) as { data?: { images?: PartnerCaseGalleryImage[] } }
      commitImages(json.data?.images ?? [])
      toast.success("Изображение удалено")
    } catch {
      toast.error("Не удалось удалить изображение")
    } finally {
      setBusy(false)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = images.findIndex((item) => item.id === active.id)
    const newIndex = images.findIndex((item) => item.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    const previous = images
    const next = arrayMove(images, oldIndex, newIndex)
    setImages(next)
    setBusy(true)
    try {
      const token = getToken()
      const res = await fetch("/api/content/partners/gallery", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          partnerId,
          imageIds: next.map((item) => item.id),
        }),
      })
      if (!res.ok) {
        setImages(previous)
        toast.error("Не удалось сохранить порядок")
        return
      }
      const json = (await res.json()) as { data?: { images?: PartnerCaseGalleryImage[] } }
      commitImages(json.data?.images ?? next)
    } catch {
      setImages(previous)
      toast.error("Не удалось сохранить порядок")
    } finally {
      setBusy(false)
    }
  }

  const showEmptyHint = images.length === 0 && uploadingCount === 0

  return (
    <div className="space-y-3 rounded-md border border-border p-3">
      <div>
        <Label>Галерея детальной страницы кейса</Label>
        <p className="text-xs text-muted-foreground">
          Дополнительные изображения только для открытой страницы кейса. Original — до 2560px (WebP),
          thumbnail — JPG до 20 КБ. Порядок меняется перетаскиванием.
        </p>
      </div>
      <Input
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        disabled={uploading || busy}
        onChange={(e) => {
          void handleUpload(e.target.files)
          e.target.value = ""
        }}
      />
      {showEmptyHint ? (
        <p className="text-xs text-muted-foreground">Пока нет изображений в галерее.</p>
      ) : (
        <div className="space-y-2">
          {images.length > 0 ? (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              {/* @ts-expect-error — occasional TS2786 between @dnd-kit/sortable and React 19 type packages */}
              <SortableContext items={images.map((item) => item.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {images.map((image) => (
                    <SortableGalleryItem
                      key={image.id}
                      image={image}
                      disabled={busy || uploading}
                      onDelete={() => void handleDelete(image.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          ) : null}
          {uploadingCount > 0 ? (
            <div className="space-y-2" aria-busy="true" aria-label="Загрузка изображений">
              {Array.from({ length: uploadingCount }, (_, index) => (
                <GalleryUploadSkeleton key={`upload-skeleton-${index}`} />
              ))}
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
