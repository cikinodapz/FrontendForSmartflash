import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SmartFlash v0: AI-Powered Adaptive Learning Platform",
    short_name: "SmartFlash",
    description:
      "Revolutionary AI-powered flashcard platform with adaptive learning, real-time collaboration, and advanced analytics",
    start_url: "/",
    display: "standalone",
    background_color: "#0f0f23",
    theme_color: "#6366f1",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    categories: ["education", "productivity", "social"],
    orientation: "portrait-primary",
    scope: "/",
    lang: "id",
    dir: "ltr",
    prefer_related_applications: false,
    shortcuts: [
      {
        name: "Quick Study",
        short_name: "Study",
        description: "Start studying immediately",
        url: "/study/quick",
        icons: [{ src: "/icon-192x192.png", sizes: "192x192" }],
      },
      {
        name: "Create Deck",
        short_name: "Create",
        description: "Create new flashcard deck",
        url: "/create",
        icons: [{ src: "/icon-192x192.png", sizes: "192x192" }],
      },
    ],
  }
}
