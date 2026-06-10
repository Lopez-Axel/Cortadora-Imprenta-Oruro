import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Optimización de Cortes",
    short_name: "Cortes",
    description: "Optimizador de cortes para imprenta",
    start_url: "/",
    display: "standalone",
    background_color: "#F8FAFC",
    theme_color: "#1E40AF",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  }
}
