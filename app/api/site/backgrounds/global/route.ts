import { createBackgroundRouteHandlers } from "@/lib/server/background-route-handlers"

export const runtime = "nodejs"

export const { POST, DELETE } = createBackgroundRouteHandlers({
  kind: "global",
  requireLandscape: false,
  orientationError: "Изображение для общего фона должно быть вертикальным (9:16)",
  resize: { width: 1080, height: 1920 },
})
