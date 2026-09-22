"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

export type AppRole = "admin" | "client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  isAdmin: boolean;
  loading: boolean;
  authError: string | null;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null; role: AppRole | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  role: null,
  isAdmin: false,
  loading: true,
  authError: null,
  signIn: async () => ({ error: null, role: null }),
  signOut: async () => {},
});

async function getUserRole(userId: string): Promise<AppRole> {
  const { data, error } = await supabase
    .from("profiles")
    .select("role, disabled_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw error;
  if (data?.disabled_at) throw new Error("Ce compte est désactivé.");
  return data?.role === "admin" ? "admin" : "client";
}

export function roleHome(role: AppRole | null) {
  return role === "admin" ? "/admin" : "/client/mon-compte";
}

export function safeNextForRole(next: string | null, role: AppRole | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return roleHome(role);
  }

  if (role === "admin" && next.startsWith("/admin")) return next;
  if (role === "client" && next.startsWith("/client")) return next;
  return roleHome(role);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const applySession = async (nextSession: Session | null) => {
    setSession(nextSession);
    setUser(nextSession?.user ?? null);

    if (!nextSession?.user) {
      setRole(null);
      return null;
    }

    const nextRole = await getUserRole(nextSession.user.id);
    setRole(nextRole);
    return nextRole;
  };

  useEffect(() => {
    let mounted = true;

    supabase.auth
      .getSession()
      .then(async ({ data: { session }, error }) => {
        if (!mounted) return;
        if (error) setAuthError(error.message);
        try {
          await applySession(session);
          setAuthError(null);
        } catch (caught) {
          setAuthError(
            caught instanceof Error
              ? caught.message
              : "Impossible de charger le rôle utilisateur.",
          );
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setRole(null);
        } finally {
          setLoading(false);
        }
      })
      .catch((caught: unknown) => {
        if (!mounted) return;
        setAuthError(
          caught instanceof Error
            ? caught.message
            : "Impossible d'initialiser la connexion.",
        );
        setLoading(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        try {
          await applySession(session);
          setAuthError(null);
        } catch (caught) {
          setAuthError(
            caught instanceof Error
              ? caught.message
              : "Impossible de charger le rôle utilisateur.",
          );
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setRole(null);
        } finally {
          setLoading(false);
        }
      },
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) return { error: error.message, role: null };
      if (!data.session?.user) {
        await supabase.auth.signOut();
        return { error: "Compte utilisateur introuvable.", role: null };
      }

      const nextRole = await applySession(data.session);
      setAuthError(null);
      return { error: null, role: nextRole };
    } catch (caught) {
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
      setRole(null);
      return {
        error:
          caught instanceof Error
            ? caught.message
            : "Impossible de se connecter à Supabase.",
        role: null,
      };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        role,
        isAdmin: role === "admin",
        loading,
        authError,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export async function signUpClient(input: {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number | null;
  };
}) {
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        full_name: input.fullName,
        phone: input.phone,
        location_latitude: input.location.latitude,
        location_longitude: input.location.longitude,
        location_accuracy: input.location.accuracy ?? null,
      },
    },
  });
  if (error) throw error;
  return data;
}
