import type { Metadata } from "next";
import { LinkForm } from "@/components/admin/link-form";
import { SITE_HOST } from "@/lib/env";

export const metadata: Metadata = { title: "Create link" };

export default function NewLink() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-semibold">Create a link</h1>
      <LinkForm host={SITE_HOST} />
    </div>
  );
}
