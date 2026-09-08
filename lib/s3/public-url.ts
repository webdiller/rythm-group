import { getYaStorageEnv } from "@/lib/s3/env"
import { getPublicObjectUrlFromBase } from "@/lib/s3/public-url.shared"

/**
 * Публичный URL объекта (path-style, как у Yandex Object Storage).
 * В БД храним только key; URL собираем на лету (server).
 */
export function getPublicObjectUrl(key: string): string {
  const { YA_ENDPOINT, YA_BUCKET_NAME } = getYaStorageEnv()
  const base = `${YA_ENDPOINT.replace(/\/$/, "")}/${YA_BUCKET_NAME}`
  return getPublicObjectUrlFromBase(base, key)
}
