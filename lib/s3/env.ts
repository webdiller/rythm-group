import { z } from "zod"

export const YaStorageEnvSchema = z.object({
	YA_STORAGE_ID: z.string().min(1),
	YA_STORAGE_SECRET: z.string().min(1),
	YA_BUCKET_NAME: z.string().min(1),
	YA_REGION: z.string().min(1),
	YA_ENDPOINT: z.string().url(),
})

export type YaStorageEnv = z.infer<typeof YaStorageEnvSchema>

let cached: YaStorageEnv | null = null

/** Ленивый parse — не падаем на `next build`, если env ещё нет. */
export function getYaStorageEnv(): YaStorageEnv {
	if (cached) return cached
	const parsed = YaStorageEnvSchema.safeParse({
		YA_STORAGE_ID: process.env.YA_STORAGE_ID,
		YA_STORAGE_SECRET: process.env.YA_STORAGE_SECRET,
		YA_BUCKET_NAME: process.env.YA_BUCKET_NAME,
		YA_REGION: process.env.YA_REGION,
		YA_ENDPOINT: process.env.YA_ENDPOINT,
	})
	if (!parsed.success) {
		const details = parsed.error.flatten().fieldErrors
		throw new Error(`Invalid Yandex Object Storage env: ${JSON.stringify(details)}`)
	}
	cached = parsed.data
	return cached
}
