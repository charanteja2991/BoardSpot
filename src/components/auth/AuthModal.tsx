import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AuthForm } from "@/components/auth/AuthForm";
import { useAuth } from "@/lib/auth";

/**
 * Contextual auth prompt. Never blocks browsing — it only appears when a
 * visitor triggers an action that needs an account, and the original action
 * replays automatically after sign-in.
 */
export function AuthModal() {
  const { gate, closeGate } = useAuth();

  return (
    <Dialog open={gate.open} onOpenChange={(open) => !open && closeGate()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl">{gate.title || "Create an account"}</DialogTitle>
          <DialogDescription>{gate.description}</DialogDescription>
        </DialogHeader>
        <AuthForm
          defaultMode="signup"
          redirectPath={typeof window !== "undefined" ? window.location.pathname + window.location.search : "/"}
        />
      </DialogContent>
    </Dialog>
  );
}
