import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function maintenanceHtml(telegramUrl: string | null): string {
  const telegramButton =
    telegramUrl && telegramUrl.trim().length > 0
      ? `<a href="${telegramUrl}" style="display:inline-block;padding:12px 28px;background:#E61B00;color:#FAFAFA;text-decoration:none;border-radius:8px;font-size:0.95rem;font-weight:600;">Telegram</a>`
      : ""

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex" />
  <title>Сайт временно недоступен</title>
  <style>
    :root {
      color-scheme: dark;
      --background: #0A0A0F;
      --foreground: #FAFAFA;
      --primary: #E61B00;
      --muted-foreground: #A1A1AA;
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--background);
      color: var(--foreground);
      font-family: system-ui, -apple-system, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      text-align: center;
      padding: 24px;
    }
    img { display: block; }
    h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 8px; }
    p { color: var(--muted-foreground); margin-bottom: 32px; }
  </style>
</head>
<body>
  <img src="/api/site/logo" width="48" height="48" style="border-radius:8px;margin-bottom:24px" alt="Logo" />
  <h1>Сайт временно недоступен</h1>
  <p>Site temporarily unavailable</p>
  ${telegramButton}
</body>
</html>`
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Protect /dashboard routes (except /dashboard/login)
  if (pathname.startsWith("/dashboard") && pathname !== "/dashboard/login") {
    const token = request.cookies.get("auth_token")?.value

    if (!token) {
      const url = new URL("/dashboard/login", request.url)
      return NextResponse.redirect(url)
    }
  }

  // Pass through protected routes without maintenance check
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/api")) {
    return NextResponse.next()
  }

  // Public routes: check maintenance mode
  return fetch(`${request.nextUrl.origin}/api/internal/site-status`)
    .then((res) => res.json())
    .then((data: { site_published: boolean; telegram_url: string | null }) => {
      if (data.site_published === false) {
        return new Response(maintenanceHtml(data.telegram_url), {
          status: 503,
          headers: {
            "Retry-After": "3600",
            "Content-Type": "text/html; charset=utf-8",
          },
        })
      }
      return NextResponse.next()
    })
    .catch(() => NextResponse.next())
}

export const config = {
  matcher: ["/dashboard/:path*", "/", "/blog/:path*", "/wishlists/:path*", "/affiliate/:path*"],
}
