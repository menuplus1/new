import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/sign-in"] },
    sitemap: "https://menuplus.rest/sitemap.xml",
  };
}
