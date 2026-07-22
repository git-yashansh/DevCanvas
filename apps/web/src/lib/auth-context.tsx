import { type Session, type User } from "@supabase/supabase-js";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";
import type { Profile } from "@types-pkg/index";

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
}

interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
  ) => Promise<{ error: string | null; needsVerification?: boolean }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const AUTH_ERROR_MAP: Record<string, string> = {
  "Invalid login credentials": "Incorrect email or password.",
  "User already registered": "An account with this email already exists.",
  "Email not confirmed": "Please confirm your email before signing in.",
};

function translateError(message: string) {
  for (const [key, value] of Object.entries(AUTH_ERROR_MAP)) {
    if (message.includes(key)) return value;
  }
  return message;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    session: null,
    user: null,
    profile: null,
    loading: true,
    error: null,
  });

  async function loadProfile(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, avatar_url, role, created_at, updated_at")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      setState((prev) => ({ ...prev, error: error.message }));
      return null;
    }
    return data as Profile | null;
  }

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const session = data.session;
      (async () => {
        const profile = session?.user ? await loadProfile(session.user.id) : null;
        setState({
          session,
          user: session?.user ?? null,
          profile,
          loading: false,
          error: null,
        });
      })();
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        if (session?.user && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")) {
          await supabase.from("profiles").upsert(
            {
              id: session.user.id,
              email: session.user.email ?? "",
              full_name:
                session.user.user_metadata?.full_name ??
                session.user.user_metadata?.name ??
                null,
              avatar_url: session.user.user_metadata?.avatar_url ?? null,
            },
            { onConflict: "id", ignoreDuplicates: false },
          );
        }
        const profile = session?.user ? await loadProfile(session.user.id) : null;
        setState({
          session,
          user: session?.user ?? null,
          profile,
          loading: false,
          error: null,
        });
      })();
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      async signIn(email, password) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        return { error: error ? translateError(error.message) : null };
      },
      async signUp(email, password, fullName) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (error) return { error: translateError(error.message) };
        // If the user has a session immediately, email confirmation is disabled
        const needsVerification = !data.session;
        if (data.user && !needsVerification) {
          await supabase.from("profiles").upsert({
            id: data.user.id,
            email,
            full_name: fullName,
          });
        }
        return { error: null, needsVerification };
      },
      async signInWithGoogle() {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/app`,
            queryParams: { access_type: "offline", prompt: "consent" },
          },
        });
        return { error: error ? translateError(error.message) : null };
      },
      async signOut() {
        await supabase.auth.signOut();
        setState({
          session: null,
          user: null,
          profile: null,
          loading: false,
          error: null,
        });
      },
      async refreshProfile() {
        if (!state.user) return;
        const profile = await loadProfile(state.user.id);
        setState((prev) => ({ ...prev, profile }));
      },
    }),
    [state],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
