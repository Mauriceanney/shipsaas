import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ShipSaaS Boilerplate",
    short_name: "ShipSaaS",
    description:
      "Complete ShipSaaS boilerplate with authentication, database, AI integration, and modern tooling",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
