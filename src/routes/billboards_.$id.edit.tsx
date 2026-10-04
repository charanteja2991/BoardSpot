import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { OwnerGuard } from "@/components/owner/OwnerGuard";
import { BillboardWizard, type WizardInitial } from "@/components/owner/BillboardWizard";
import { fetchOwnerAvailability, fetchOwnerBillboard } from "@/lib/owner-queries";

export const Route = createFileRoute("/billboards_/$id/edit")({
  head: () => ({
    meta: [
      { title: "Edit billboard — Panorama" },
      { name: "description", content: "Update the details, photos, pricing and availability of your billboard listing." },
      { property: "og:title", content: "Edit billboard — Panorama" },
      { property: "og:description", content: "Update your billboard listing on Panorama." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <OwnerGuard>
      <EditBillboardPage />
    </OwnerGuard>
  ),
});

function EditBillboardPage() {
  const { id } = Route.useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ["owner-billboard", id],
    queryFn: async () => {
      const [billboard, availability] = await Promise.all([fetchOwnerBillboard(id), fetchOwnerAvailability(id)]);
      return { billboard, availability };
    },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Link to="/my-billboards" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to my billboards
      </Link>

      {isLoading ? (
        <div className="mt-20 flex justify-center">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      ) : error || !data?.billboard ? (
        <p className="mt-10 rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
          This listing isn't available, or it doesn't belong to your account.
        </p>
      ) : (
        <>
          <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight">Edit “{data.billboard.title}”</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Change any step, then save as a draft or publish your updates.
          </p>
          <div className="mt-8">
            <BillboardWizard initial={toInitial(data.billboard, data.availability, id)} />
          </div>
        </>
      )}
    </div>
  );
}

function toInitial(
  b: NonNullable<Awaited<ReturnType<typeof fetchOwnerBillboard>>>,
  availability: Awaited<ReturnType<typeof fetchOwnerAvailability>>,
  id: string,
): WizardInitial {
  const images = [...(b.billboard_images ?? [])]
    .sort((a, z) => (a.sort_order ?? 0) - (z.sort_order ?? 0))
    .map((img) => ({ id: img.id, url: img.url, storage_path: img.storage_path, alt_text: img.alt_text }));

  return {
    id,
    values: {
      title: b.title,
      description: b.description,
      billboard_type: b.billboard_type,
      address: b.address,
      area: b.area,
      city: b.city,
      state: b.state,
      country: b.country,
      latitude: b.latitude,
      longitude: b.longitude,
      width: Number(b.width),
      height: Number(b.height),
      dimension_unit: b.dimension_unit,
      is_illuminated: b.is_illuminated,
      price: Number(b.price),
      currency: b.currency,
      price_period: b.price_period,
      availability: b.availability,
      status: b.status,
    },
    images,
    availability: availability.map((slot) => ({
      id: slot.id,
      start_date: slot.start_date,
      end_date: slot.end_date,
      is_available: slot.is_available,
      note: slot.note,
    })),
  };
}
