import type { Metadata } from "next";
import { BulkForm } from "@/components/admin/bulk-form";
import { SITE_HOST } from "@/lib/env";

export const metadata: Metadata = { title: "Bulk create" };

export default function Import() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold">Bulk create links</h1>
      <p className="mt-1 text-sm text-muted">Shorten up to 200 links at once.</p>
      <div className="mt-6">
        <BulkForm host={SITE_HOST} />
      </div>
    </div>
  );
}
