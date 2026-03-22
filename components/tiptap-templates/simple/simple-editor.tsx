"use client"

/**
 * Редактор на базе TipTap (набор расширений и тулбар в духе официального Simple Editor template).
 * @see https://tiptap.dev/docs/ui-components/templates/simple-editor
 */
import { useEffect } from "react"
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
  ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  ListTodo,
  Minus,
  Quote,
  Redo2,
  SquareCode,
  Strikethrough,
  Subscript as SubIcon,
  Superscript as SupIcon,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react"

export type SimpleEditorProps = {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  className?: string
}

export function SimpleEditor({ value, onChange, placeholder = "Начните ввод…", className }: SimpleEditorProps) {
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
      ],
      content: value || "<p></p>",
      editorProps: {
        attributes: {
          class: cn(
            "max-w-none min-h-[220px] px-3 py-2 text-sm leading-relaxed outline-none text-foreground",
            "focus:outline-none [&_p]:my-2 [&_ul]:my-2 [&_ol]:my-2",
            "[&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:text-lg [&_h3]:font-semibold",
            "[&_ul[data-type=taskList]]:list-none [&_ul[data-type=taskList]]:pl-0",
            "[&_li[data-type=taskItem]]:flex [&_li[data-type=taskItem]]:gap-2 [&_a]:text-primary",
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

  // const addImage = () => {
  //   const url = typeof window !== "undefined" ? window.prompt("URL изображения", "https://") : null
  //   if (!url) return
  //   editor.chain().focus().setImage({ src: url }).run()
  // }

  return (
    <div className={cn("rounded-lg border border-border bg-card overflow-hidden", className)}>
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/40 px-1 py-1">
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
        <Toggle
          size="sm"
          pressed={editor.isActive("taskList")}
          onPressedChange={() => editor.chain().focus().toggleTaskList().run()}
          aria-label="Чеклист"
        >
          <ListTodo className="h-4 w-4" />
        </Toggle>
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
        {/* <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={addImage} title="Изображение по URL">
          <ImageIcon className="h-4 w-4" />
        </Button> */}
      </div>
      <EditorContent editor={editor} className="tiptap-simple-editor max-h-[min(480px,55vh)] overflow-y-auto" />
    </div>
  )
}
