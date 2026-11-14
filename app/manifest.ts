import type { MetadataRoute } from "next";
import { PALETTE } from "@/lib/palette";
import { SITE } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.legalName,
    short_name: SITE.name,
    description: SITE.description,
    start_url: "/",
    display: "standalone",
    background_color: PALETTE.void,
    theme_color: PALETTE.void,
    icons: [
      { src: "/icon/small", sizes: "32x32", type: "image/png" },
      { src: "/icon/medium", sizes: "192x192", type: "image/png" },
      { src: "/icon/large", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
