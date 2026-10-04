import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole, ProfileRow } from "@/lib/domain";

type AuthGate = {
  open: boolean;
  title: string;
  description: string;
};

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  profile: ProfileRow | null;
  roles: AppRole[];
  loading: boolean;
  isAdmin: boolean;
  isOwner: boolean;
  gate: AuthGate;
  /**
   * Runs `action` when signed in. Otherwise opens the contextual auth prompt
   * and replays the action right after a successful sign-in.
   */
  requireAuth: (options: { title: string; description: string }, action: () => void) => void;
  closeGate: () => void;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const CLOSED_GATE: AuthGate = { open: false, title: "", description: "" };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [gate, setGate] = useState<AuthGate>(CLOSED_GATE);
  const pendingAction = useRef<(() => void) | null>(null);

  const loadIdentity = useCallback(async (userId: string) => {
    const [{ data: profileData }, { data: roleData }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);
    setProfile(profileData ?? null);
    setRoles((roleData ?? []).map((r) => r.role as AppRole));
  }, []);

  useEffect(() => {
    let active = true;

    const { data: subscription } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      if (nextSession?.user) {
        setTimeout(() => void loadIdentity(nextSession.user.id), 0);
      } else {
        setProfile(null);
        setRoles([]);
      }
      if (event === "SIGNED_IN") {
        setGate(CLOSED_GATE);
        const action = pendingAction.current;
        pendingAction.current = null;
        if (action) setTimeout(action, 120);
      }
    });

    void supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session?.user) await loadIdentity(data.session.user.id);
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [loadIdentity]);

  const requireAuth: AuthContextValue["requireAuth"] = useCallback(
    (options, action) => {
      if (session?.user) {
        action();
        return;
      }
      pendingAction.current = action;
      setGate({ open: true, title: options.title, description: options.description });
    },
    [session],
  );

  const closeGate = useCallback(() => {
    pendingAction.current = null;
    setGate(CLOSED_GATE);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (session?.user) await loadIdentity(session.user.id);
  }, [session, loadIdentity]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setRoles([]);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      roles,
      loading,
      isAdmin: roles.includes("admin"),
      isOwner: roles.includes("owner"),
      gate,
      requireAuth,
      closeGate,
      refreshProfile,
      signOut,
    }),
    [session, profile, roles, loading, gate, requireAuth, closeGate, refreshProfile, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
