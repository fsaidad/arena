import type { MetadataRoute } from "next";

import { siteUrl } from "@/shared/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/organizer/", "/api/"] },
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
  };
}
