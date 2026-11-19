import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LinkForm } from "@/components/admin/link-form";
import { requireAdmin } from "@/lib/auth";
import { SITE_HOST } from "@/lib/env";
import type { Link } from "@/lib/types";

export const metadata: Metadata = { title: "Edit link" };

export default async function EditLink({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase } = await requireAdmin();
  const { data: link } = await supabase.from("links").select("*").eq("id", id).maybeSingle<Link>();
  if (!link) notFound();
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold">Edit link</h1>
      <LinkForm link={link} host={SITE_HOST} />
    </div>
  );
}
