import type { MetadataRoute } from "next";
import { listSlugs } from "@/lib/menu-data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await listSlugs();
  return [
    { url: "https://menuplus.rest", priority: 1 },
    ...slugs.map((s) => ({ url: `https://menuplus.rest/${s}`, priority: 0.8 })),
  ];
}
