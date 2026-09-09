"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BlogCategoriesEditor } from "@/components/dashboard/BlogCategoriesEditor"
import { BlogPostsEditor } from "@/components/dashboard/BlogPostsEditor"

export function BlogEditor() {
	const [tab, setTab] = useState("categories")

	return (
		<Tabs
			value={tab}
			onValueChange={setTab}
			className="w-full"
		>
			<TabsList className="mb-6 grid w-full max-w-md grid-cols-2">
				<TabsTrigger value="categories">Категории</TabsTrigger>
				<TabsTrigger value="posts">Записи</TabsTrigger>
			</TabsList>
			<TabsContent value="categories">
				<BlogCategoriesEditor />
			</TabsContent>
			<TabsContent value="posts">
				<BlogPostsEditor />
			</TabsContent>
		</Tabs>
	)
}
