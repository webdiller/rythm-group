import { createBackgroundRouteHandlers } from "@/lib/server/background-route-handlers"

export const runtime = "nodejs"

export const { POST, DELETE } = createBackgroundRouteHandlers({
  kind: "hero",
  requireLandscape: true,
  orientationError: "Изображение для hero должно быть горизонтальным (16:9)",
})
