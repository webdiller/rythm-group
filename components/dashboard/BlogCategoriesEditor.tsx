"use client"

import type { ReactNode } from "react"
import { useEffect, useMemo, useState } from "react"
import { DndContext, type DragEndEvent, KeyboardSensor, MouseSensor, TouchSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core"
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { GripVertical, Plus, Pencil, Trash2 } from "lucide-react"

type Category = {
	id: number
	slug: string
	name_ru: string
	name_en: string
	order_index: number
	deleted_at: number | null
}

function SortableTableBody({ items, children }: { items: string[]; children: ReactNode }) {
	return (
		// @ts-ignore — @dnd-kit/sortable vs React 19 JSX: в части окружений TS2786, в части — нет; @ts-expect-error ломает сборку как «unused»
		<SortableContext
			items={items}
			strategy={verticalListSortingStrategy}
		>
			{children}
		</SortableContext>
	)
}

function SortableCategoryRow({ category, onEdit, onDelete }: { category: Category; onEdit: (c: Category) => void; onDelete: (id: number) => void }) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
		id: String(category.id),
	})

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.65 : 1,
	}

	return (
		<tr
			ref={setNodeRef}
			style={style}
			className="border-b border-border/60"
		>
			<td className="w-10 py-2 pr-2 align-middle">
				<button
					type="button"
					className="inline-flex cursor-grab touch-none rounded-md p-1.5 text-muted-foreground hover:bg-muted active:cursor-grabbing"
					aria-label="Перетащить для смены порядка"
					{...attributes}
					{...listeners}
				>
					<GripVertical className="h-4 w-4" />
				</button>
			</td>
			<td className="py-2 pr-4 font-mono">{category.slug}</td>
			<td className="py-2 pr-4">{category.name_ru}</td>
			<td className="py-2 pr-4">{category.name_en}</td>
			<td className="py-2 pr-4 text-muted-foreground tabular-nums">{category.order_index}</td>
			<td className="py-2">
				<div className="flex gap-1">
					<Button
						variant="ghost"
						size="icon"
						onClick={() => onEdit(category)}
						aria-label="Edit"
					>
						<Pencil className="h-4 w-4" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						onClick={() => onDelete(category.id)}
						aria-label="Delete"
					>
						<Trash2 className="h-4 w-4 text-destructive" />
					</Button>
				</div>
			</td>
		</tr>
	)
}

export function BlogCategoriesEditor() {
	const [rows, setRows] = useState<Category[]>([])
	const [loading, setLoading] = useState(false)
	const [dialogOpen, setDialogOpen] = useState(false)
	const [editing, setEditing] = useState<Category | null>(null)
	const [deleteId, setDeleteId] = useState<number | null>(null)
	const [form, setForm] = useState({
		slug: "",
		name_ru: "",
		name_en: "",
		order_index: 0,
	})
	const [savingOrder, setSavingOrder] = useState(false)
	const [savingForm, setSavingForm] = useState(false)
	const [deleting, setDeleting] = useState(false)

	const getToken = () =>
		document.cookie
			.split("; ")
			.find((row) => row.startsWith("auth_token="))
			?.split("=")[1]

	const load = async () => {
		setLoading(true)
		try {
			const res = await fetch("/api/content/blog/categories?includeDeleted=1", {
				headers: { Authorization: `Bearer ${getToken() ?? ""}` },
			})
			if (!res.ok) throw new Error("load")
			const json = (await res.json()) as { data?: Category[] }
			setRows(json.data ?? [])
		} catch {
			toast.error("Не удалось загрузить категории")
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		void load()
	}, [])

	const activeRows = useMemo(() => [...rows.filter((r) => !r.deleted_at)].sort((a, b) => a.order_index - b.order_index || a.id - b.id), [rows])

	const sortableIds = useMemo(() => activeRows.map((c) => String(c.id)), [activeRows])

	const sensors = useSensors(useSensor(MouseSensor, { activationConstraint: { distance: 8 } }), useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }))

	const handleDragEnd = async (event: DragEndEvent) => {
		const { active, over } = event
		if (!over || active.id === over.id) return

		const oldIndex = activeRows.findIndex((c) => String(c.id) === String(active.id))
		const newIndex = activeRows.findIndex((c) => String(c.id) === String(over.id))
		if (oldIndex < 0 || newIndex < 0) return

		const newOrderIds = arrayMove(
			activeRows.map((c) => c.id),
			oldIndex,
			newIndex,
		)

		setRows((prev) =>
			prev.map((r) => {
				if (r.deleted_at) return r
				const idx = newOrderIds.indexOf(r.id)
				if (idx === -1) return r
				return { ...r, order_index: idx }
			}),
		)

		setSavingOrder(true)
		try {
			const token = getToken()
			const results = await Promise.all(
				newOrderIds.map((id, i) =>
					fetch(`/api/content/blog/categories/${id}`, {
						method: "PATCH",
						headers: {
							"Content-Type": "application/json",
							Authorization: `Bearer ${token ?? ""}`,
						},
						body: JSON.stringify({ order_index: i }),
					}),
				),
			)
			if (results.some((r) => !r.ok)) {
				toast.error("Не удалось сохранить порядок")
				void load()
				return
			}
			toast.success("Порядок сохранён")
		} finally {
			setSavingOrder(false)
		}
	}

	const openCreate = () => {
		setEditing(null)
		setForm({
			slug: "",
			name_ru: "",
			name_en: "",
			order_index: rows.filter((r) => !r.deleted_at).length,
		})
		setDialogOpen(true)
	}

	const openEdit = (c: Category) => {
		setEditing(c)
		setForm({
			slug: c.slug,
			name_ru: c.name_ru,
			name_en: c.name_en,
			order_index: c.order_index,
		})
		setDialogOpen(true)
	}

	const save = async () => {
		const token = getToken()
		if (savingForm) return
		setSavingForm(true)
		try {
			if (editing) {
				const res = await fetch(`/api/content/blog/categories/${editing.id}`, {
					method: "PATCH",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token ?? ""}`,
					},
					body: JSON.stringify({
						slug: form.slug,
						name_ru: form.name_ru,
						name_en: form.name_en,
						order_index: form.order_index,
					}),
				})
				if (!res.ok) {
					const err = (await res.json().catch(() => ({}))) as { error?: string }
					toast.error(err.error ?? "Не удалось сохранить")
					return
				}
				toast.success("Категория обновлена")
			} else {
				const res = await fetch("/api/content/blog/categories", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
						Authorization: `Bearer ${token ?? ""}`,
					},
					body: JSON.stringify({
						slug: form.slug,
						name_ru: form.name_ru,
						name_en: form.name_en,
						order_index: form.order_index,
					}),
				})
				if (!res.ok) {
					const err = (await res.json().catch(() => ({}))) as { error?: string }
					toast.error(err.error ?? "Не удалось создать")
					return
				}
				toast.success("Категория создана")
			}
			setDialogOpen(false)
			void load()
		} catch {
			toast.error("Ошибка сети")
		} finally {
			setSavingForm(false)
		}
	}

	const confirmDelete = async () => {
		if (deleteId == null) return
		if (deleting) return
		setDeleting(true)
		const token = getToken()
		try {
			const res = await fetch(`/api/content/blog/categories/${deleteId}?confirm=true`, {
				method: "DELETE",
				headers: { Authorization: `Bearer ${token ?? ""}` },
			})
			if (!res.ok) {
				toast.error("Не удалось удалить")
				return
			}
			toast.success("Категория и записи помечены удалёнными")
			setDeleteId(null)
			void load()
		} catch {
			toast.error("Ошибка сети")
		} finally {
			setDeleting(false)
		}
	}

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0">
				<div>
					<CardTitle>Категории блога</CardTitle>
					<p className="mt-1 text-xs text-muted-foreground">Перетащите строки за иконку слева, чтобы изменить порядок на сайте.</p>
				</div>
				<Dialog
					open={dialogOpen}
					onOpenChange={setDialogOpen}
				>
					<Button
						size="sm"
						onClick={openCreate}
					>
						<Plus className="mr-2 h-4 w-4" />
						Добавить
					</Button>
					<DialogContent className="max-w-lg">
						<DialogHeader>
							<DialogTitle>{editing ? "Редактировать категорию" : "Новая категория"}</DialogTitle>
						</DialogHeader>
						<div className="grid gap-4 py-2">
							<div className="grid gap-2">
								<Label htmlFor="bc-slug">Slug (латиница, kebab-case)</Label>
								<Input
									id="bc-slug"
									value={form.slug}
									onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
									placeholder="news"
								/>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="bc-nameru">Название RU</Label>
								<Input
									id="bc-nameru"
									value={form.name_ru}
									onChange={(e) => setForm((f) => ({ ...f, name_ru: e.target.value }))}
								/>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="bc-nameen">Название EN</Label>
								<Input
									id="bc-nameen"
									value={form.name_en}
									onChange={(e) => setForm((f) => ({ ...f, name_en: e.target.value }))}
								/>
							</div>
							<div className="grid gap-2">
								<Label htmlFor="bc-order">Порядок (число)</Label>
								<Input
									id="bc-order"
									type="number"
									value={form.order_index}
									onChange={(e) => setForm((f) => ({ ...f, order_index: Number(e.target.value) || 0 }))}
								/>
							</div>
							<div className="flex items-center justify-between gap-2">
								<Button
									type="button"
									variant="outline"
									onClick={() =>
										setForm((f) => ({
											...f,
											slug: "game-updates",
											name_ru: "Обновления игр",
											name_en: "Game updates",
										}))
									}
								>
									Пример заполнения
								</Button>
								<Button
									onClick={() => void save()}
									disabled={savingForm}
								>
									{savingForm ? "Сохранение..." : "Сохранить"}
								</Button>
							</div>
						</div>
					</DialogContent>
				</Dialog>
			</CardHeader>
			<CardContent>
				{loading ? (
					<p className="text-sm text-muted-foreground">Загрузка…</p>
				) : (
					<div className="overflow-x-auto">
						<DndContext
							sensors={sensors}
							collisionDetection={closestCenter}
							onDragEnd={(e) => void handleDragEnd(e)}
						>
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b text-left text-muted-foreground">
										<th
											className="w-10 pb-2 pr-2"
											aria-hidden
										/>
										<th className="pb-2 pr-4">Slug</th>
										<th className="pb-2 pr-4">RU</th>
										<th className="pb-2 pr-4">EN</th>
										<th className="pb-2 pr-4">Порядок</th>
										<th className="pb-2"> </th>
									</tr>
								</thead>
								<SortableTableBody items={sortableIds}>
									<tbody>
										{activeRows.map((c) => (
											<SortableCategoryRow
												key={c.id}
												category={c}
												onEdit={openEdit}
												onDelete={setDeleteId}
											/>
										))}
									</tbody>
								</SortableTableBody>
							</table>
						</DndContext>
						{savingOrder ? <p className="mt-2 text-xs text-muted-foreground">Сохранение порядка…</p> : null}
						{activeRows.length === 0 ? <p className="mt-4 text-muted-foreground">Нет категорий. Добавьте первую или выполните seed БД.</p> : null}
					</div>
				)}

				<AlertDialog
					open={deleteId != null}
					onOpenChange={(o) => !o && setDeleteId(null)}
				>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Удалить категорию?</AlertDialogTitle>
							<AlertDialogDescription>Категория и все её записи будут скрыты (soft delete). Публичный сайт перестанет их показывать.</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Отмена</AlertDialogCancel>
							<AlertDialogAction
								onClick={() => void confirmDelete()}
								disabled={deleting}
							>
								{deleting ? "Удаление..." : "Удалить"}
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</CardContent>
		</Card>
	)
}
