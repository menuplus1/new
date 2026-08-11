import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getMenu } from "@/lib/menu-data";
import { can } from "@/lib/plans";
import { TenantMenu } from "@/components/TenantMenu";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ t?: string; tpl?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getMenu(slug);
  if (!data) return {};
  const r = data.restaurant;
  if (!can(r.plan, "seo")) return { title: r.name };
  const title = r.seo.title || `${r.name} — المنيو`;
  const description = r.seo.description || r.tagline || `منيو ${r.name}`;
  const image = r.covers.find((c) => !c.startsWith("linear-gradient")) || r.logo_url || undefined;
  return {
    title,
    description,
    openGraph: { title, description, type: "website", ...(image ? { images: [image] } : {}) },
  };
}

export default async function TenantPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const data = await getMenu(slug);
  if (!data) notFound();
  const r = data.restaurant;

  const jsonLd = can(r.plan, "seo")
    ? {
        "@context": "https://schema.org",
        "@type": "Restaurant",
        name: r.name,
        ...(r.seo.description || r.tagline ? { description: r.seo.description || r.tagline } : {}),
        ...(r.logo_url ? { image: r.logo_url } : {}),
        servesCuisine: "Middle Eastern",
        url: `https://menuplus.rest/${r.slug}`,
      }
    : null;

  return (
    <>
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}
      <TenantMenu data={data} table={sp.t ?? null} tpl={sp.tpl ? Number(sp.tpl) : undefined} />
    </>
  );
}
