import { createFileRoute } from "@tanstack/react-router";
import { AuthForm } from "@/components/auth/AuthForm";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    redirect: typeof search.redirect === "string" ? search.redirect : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in — Panorama Billboard Marketplace" },
      {
        name: "description",
        content: "Sign in or create a Panorama account to save billboards and send booking requests.",
      },
      { property: "og:title", content: "Sign in — Panorama Billboard Marketplace" },
      {
        property: "og:description",
        content: "Sign in or create a Panorama account to save billboards and send booking requests.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { redirect } = Route.useSearch();
  const safe = redirect && redirect.startsWith("/") ? redirect : "/";
  return (
    <div className="mx-auto w-full max-w-md px-4 py-16">
      <h1 className="font-display text-2xl font-semibold">Welcome to Panorama</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Browsing is open to everyone. An account is only needed to save spaces, request bookings or list a billboard.
      </p>
      <div className="mt-6 rounded-2xl border border-border bg-card p-6">
        <AuthForm defaultMode="signin" redirectPath={safe} />
      </div>
    </div>
  );
}
