"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "./supabase";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  authError: string | null;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isAdmin: false,
  loading: true,
  authError: null,
  signIn: async () => ({ error: null }),
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const updateAuthState = (nextSession: Session | null) => {
    setSession(nextSession);
    setUser(nextSession?.user ?? null);
  };

  const resolveAdminRole = async (nextSession: Session | null) => {
    if (!nextSession?.user) {
      setIsAdmin(false);
      return false;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", nextSession.user.id)
      .maybeSingle();

    if (error) {
      setAuthError(error.message);
      setIsAdmin(false);
      return false;
    }

    const admin = data?.role === "admin";
    setIsAdmin(admin);
    return admin;
  };

  useEffect(() => {
    let mounted = true;

    supabase.auth
      .getSession()
      .then(async ({ data: { session }, error }) => {
        if (!mounted) return;

        if (error) {
          setAuthError(error.message);
        }

        updateAuthState(session);
        await resolveAdminRole(session);
        setLoading(false);
      })
      .catch((error: unknown) => {
        if (!mounted) return;

        setAuthError(
          error instanceof Error
            ? error.message
            : "Impossible d'initialiser la connexion.",
        );
        setLoading(false);
      });

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        updateAuthState(session);
        setAuthError(null);
        await resolveAdminRole(session);
        setLoading(false);
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

      if (error) return { error: error.message };
      if (!data.user || !(await resolveAdminRole(data.session))) {
        await supabase.auth.signOut();
        return { error: "Ce compte ne possède pas les droits administrateur." };
      }

      updateAuthState(data.session);
      setAuthError(null);
      return { error: null };
    } catch (error) {
      return {
        error:
          error instanceof Error
            ? error.message
            : "Impossible de se connecter à Supabase.",
      };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{ user, session, isAdmin, loading, authError, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
