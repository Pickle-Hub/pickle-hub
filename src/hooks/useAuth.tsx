import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
};

type AuthState = {
  loading: boolean;
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async (uid: string | undefined) => {
    if (!uid) {
      setProfile(null);
      setIsAdmin(false);
      return;
    }
    const [{ data: p }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email, phone_number").eq("id", uid).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", uid),
    ]);
    setProfile((p as Profile) ?? null);
    setIsAdmin(Boolean(roles?.some((r: { role: string }) => r.role === "admin")));
  };

  useEffect(() => {
  let active = true;

  console.log("AUTH PROVIDER STARTED");

  const { data: sub } = supabase.auth.onAuthStateChange((event, next) => {
    console.log("AUTH EVENT:", event);
    console.log("AUTH SESSION:", next);

    if (!active) return;

    setSession(next);

    setTimeout(() => {
      void load(next?.user?.id);
    }, 0);
  });

  void supabase.auth.getSession().then(async ({ data, error }) => {
    console.log("GET SESSION:", data.session);
    console.log("GET SESSION ERROR:", error);

    if (!active) return;

    setSession(data.session);

    await load(data.session?.user?.id);

    setLoading(false);
  });

  return () => {
    active = false;
    sub.subscription.unsubscribe();
  };
}, []);

  const value: AuthState = {
    loading,
    session,
    user: session?.user ?? null,
    profile,
    isAdmin,
    refreshProfile: () => load(session?.user?.id),
    signOut: async () => {
      await supabase.auth.signOut();
      setProfile(null);
      setIsAdmin(false);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
