import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { LayoutDashboard, LogOut, Megaphone, Menu, Plus, Building2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const navLink = "rounded-lg px-3 py-2 text-muted-foreground transition hover:text-foreground";
const navActive = { className: "rounded-lg px-3 py-2 text-foreground" };

export function SiteHeader() {
  const { user, signOut, requireAuth, isOwner, isAdmin } = useAuth();
  const showOwnerNav = Boolean(user) && (isOwner || isAdmin);
  const [open, setOpen] = useState(false);

  const signInPrompt = () =>
    requireAuth(
      {
        title: "Sign in to Panorama",
        description: "Save billboards, send booking requests and manage your listings.",
      },
      () => {},
    );

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-brand text-primary-foreground">
            <Megaphone className="size-4" />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">Panorama</span>
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-1 text-sm font-medium md:flex">
          <Link to="/browse" search={{}} className={navLink} activeProps={navActive}>
            Browse billboards
          </Link>

          {showOwnerNav ? (
            <>
              <Link to="/dashboard" className={navLink} activeProps={navActive}>
                Dashboard
              </Link>
              <Link to="/my-billboards" className={navLink} activeProps={navActive}>
                My billboards
              </Link>
              <Button size="sm" asChild className="ml-1">
                <Link to="/billboards/new">
                  <Plus className="mr-1.5 size-4" /> Add billboard
                </Link>
              </Button>
            </>
          ) : null}

          {user ? (
            <Link to="/my-requests" className={navLink} activeProps={navActive}>
              My requests
            </Link>
          ) : null}

          {user ? (
            <button
              type="button"
              onClick={() => void signOut()}
              className="ml-1 rounded-lg border border-border px-3 py-2 transition hover:border-brand/40"
            >
              Sign out
            </button>
          ) : (
            <button
              type="button"
              onClick={signInPrompt}
              className="rounded-lg bg-accent px-4 py-2 font-semibold text-accent-foreground transition hover:brightness-95"
            >
              Sign in
            </button>
          )}
        </nav>

        {/* Mobile navigation */}
        <div className="md:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Open menu">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetHeader>
                <SheetTitle className="font-display">Menu</SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-1 text-sm font-medium">
                <Link to="/browse" search={{}} className={navLink} onClick={() => setOpen(false)}>
                  Browse billboards
                </Link>

                {showOwnerNav ? (
                  <>
                    <Link to="/dashboard" className={navLink} onClick={() => setOpen(false)}>
                      <span className="inline-flex items-center gap-2">
                        <LayoutDashboard className="size-4" /> Dashboard
                      </span>
                    </Link>
                    <Link to="/my-billboards" className={navLink} onClick={() => setOpen(false)}>
                      <span className="inline-flex items-center gap-2">
                        <Building2 className="size-4" /> My billboards
                      </span>
                    </Link>
                    <Link to="/billboards/new" className={navLink} onClick={() => setOpen(false)}>
                      <span className="inline-flex items-center gap-2">
                        <Plus className="size-4" /> Add billboard
                      </span>
                    </Link>
                  </>
                ) : null}

                {user ? (
                  <Link to="/my-requests" className={navLink} onClick={() => setOpen(false)}>
                    My requests
                  </Link>
                ) : null}

                <div className="mt-4 border-t border-border pt-4">
                  {user ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setOpen(false);
                        void signOut();
                      }}
                    >
                      <LogOut className="mr-2 size-4" /> Sign out
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      onClick={() => {
                        setOpen(false);
                        signInPrompt();
                      }}
                    >
                      Sign in
                    </Button>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-border bg-card">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Panorama — outdoor advertising marketplace.</p>
        <Link to="/browse" search={{}} className="font-medium text-brand hover:text-brand-dark">
          Browse available billboards
        </Link>
      </div>
    </footer>
  );
}
