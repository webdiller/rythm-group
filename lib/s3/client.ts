import { S3Client } from "@aws-sdk/client-s3"
import { getYaStorageEnv } from "@/lib/s3/env"

let client: S3Client | null = null

/**
 * Singleton S3Client для Yandex Object Storage.
 * forcePathStyle — рекомендуемый режим для Yandex.
 */
export function getS3Client(): S3Client {
  if (client) return client
  const env = getYaStorageEnv()
  client = new S3Client({
    region: env.YA_REGION,
    endpoint: env.YA_ENDPOINT,
    credentials: {
      accessKeyId: env.YA_STORAGE_ID,
      secretAccessKey: env.YA_STORAGE_SECRET,
    },
    forcePathStyle: true,
  })
  return client
}

export function getS3Bucket(): string {
  return getYaStorageEnv().YA_BUCKET_NAME
}
