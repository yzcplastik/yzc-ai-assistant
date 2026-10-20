
import type { MetadataRoute } from "next"

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PLASTVIT Depo Stok",
    short_name: "PLASTVIT",
    description: "PLASTVIT depo ve stok yönetim sistemi",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1e3a4c",
    lang: "tr",
    icons: [
      {
        src: "/plastvit-icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/plastvit-icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  }
}
