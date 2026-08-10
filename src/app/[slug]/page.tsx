import { notFound } from "next/navigation";
import { getMenu } from "@/lib/menu-data";
import { TenantMenu } from "@/components/TenantMenu";

export const dynamic = "force-dynamic";

export default async function TenantPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const data = await getMenu(slug);
  if (!data) notFound();
  return <TenantMenu data={data} table={sp.t ?? null} />;
}
