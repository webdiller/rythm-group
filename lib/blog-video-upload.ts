const MAX_VIDEO_BYTES = 100 * 1024 * 1024

export const ALLOWED_VIDEO_UPLOAD_MIMES = new Set(["video/mp4", "video/webm"])

export function assertVideoUploadSizeAndMime(size: number, mime: string) {
  if (size > MAX_VIDEO_BYTES) {
    throw new Error("FILE_TOO_LARGE")
  }
  if (!ALLOWED_VIDEO_UPLOAD_MIMES.has(mime)) {
    throw new Error("MIME_NOT_ALLOWED")
  }
}
