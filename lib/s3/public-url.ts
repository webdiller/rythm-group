import { getYaStorageEnv } from "@/lib/s3/env"

/**
 * Публичный URL объекта (path-style, как у Yandex Object Storage).
 * В БД храним только key; URL собираем на лету.
 */
export function getPublicObjectUrl(key: string): string {
  const { YA_ENDPOINT, YA_BUCKET_NAME } = getYaStorageEnv()
  const endpoint = YA_ENDPOINT.replace(/\/$/, "")
  const normalizedKey = key.replace(/^\//, "")
  return `${endpoint}/${YA_BUCKET_NAME}/${normalizedKey}`
}
