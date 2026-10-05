import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { OwnerGuard } from "@/components/owner/OwnerGuard";
import { BillboardWizard } from "@/components/owner/BillboardWizard";

export const Route = createFileRoute("/billboards/new")({
  head: () => ({
    meta: [
      { title: "Add a billboard — Panorama" },
      { name: "description", content: "List a new outdoor advertising space with photos, pricing and availability." },
      { property: "og:title", content: "Add a billboard — Panorama" },
      { property: "og:description", content: "List a new outdoor advertising space on Panorama." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <OwnerGuard>
      <div className="mx-auto max-w-4xl px-4 py-10">
        <Link to="/my-billboards" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back to my billboards
        </Link>
        <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight">Add a billboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">Seven quick steps. You can save as a draft at the end.</p>
        <div className="mt-8">
          <BillboardWizard />
        </div>
      </div>
    </OwnerGuard>
  ),
});
