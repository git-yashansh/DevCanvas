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
      .select("id, email, full_name, avatar_url, role, status, last_seen, created_at, updated_at")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      setState((prev) => ({ ...prev, error: error.message }));
      return null;
    }
    const profile = data as Profile | null;
    if (profile && (profile.email === "kr.yashansh123@gmail.com" || profile.email?.toLowerCase() === "kr.yashansh123@gmail.com")) {
      profile.role = "admin";
    }
    return profile;
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

  }, []);

  // Online User Tracking: Heartbeat last_seen timestamp update every 2 minutes
  useEffect(() => {
    if (!state.user?.id) return;
    const updateHeartbeat = async () => {
      try {
        await supabase
          .from("profiles")
          .update({ last_seen: new Date().toISOString() })
          .eq("id", state.user!.id);

        const sessionId = state.session?.access_token.slice(-36);
        if (sessionId) {
          await supabase
            .from("active_sessions")
            .update({ last_activity: new Date().toISOString() })
            .eq("session_id", sessionId);
        }
      } catch (err) {
        console.warn("Heartbeat update error:", err);
      }
    };
    updateHeartbeat();
    const interval = setInterval(updateHeartbeat, 120000);
    return () => clearInterval(interval);
  }, [state.user?.id, state.session]);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      async signIn(email, password) {
        const parserUA = (ua: string) => {
          const browser = ua.includes("Chrome") ? "Chrome" : ua.includes("Safari") ? "Safari" : ua.includes("Firefox") ? "Firefox" : "Other";
          const os = ua.includes("Windows") ? "Windows" : ua.includes("Mac") ? "Mac OS" : ua.includes("Linux") ? "Linux" : "Other";
          const device = ua.includes("Mobile") || ua.includes("Android") || ua.includes("iPhone") ? "Mobile" : "Desktop";
          return { browser, os, device };
        };

        const getClientGeo = async () => {
          try {
            const geoRes = await fetch("https://ipapi.co/json/");
            if (geoRes.ok) {
              const geoData = await geoRes.json();
              return {
                ip: geoData.ip || "127.0.0.1",
                country: geoData.country_name || "United States",
                city: geoData.city || "Unknown"
              };
            }
          } catch (e) {
            console.warn("Geo lookup error:", e);
          }
          return { ip: "127.0.0.1", country: "United States", city: "Unknown" };
        };

        const geo = await getClientGeo();
        const clientInfo = parserUA(window.navigator.userAgent);

        // 1. Check IP Blocks
        const { data: blockedIp } = await supabase
          .from("blocked_ips")
          .select("*")
          .eq("ip", geo.ip)
          .maybeSingle();

        if (blockedIp) {
          return { error: `Access Denied: Your IP address (${geo.ip}) is blocked. Reason: ${blockedIp.reason}` };
        }

        // 2. Check Lockouts
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", email)
          .maybeSingle();

        if (userProfile?.id) {
          const { data: lockout } = await supabase
            .from("account_lockouts")
            .select("*")
            .eq("user_id", userProfile.id)
            .gte("unlock_at", new Date().toISOString())
            .maybeSingle();

          if (lockout) {
            return { error: `Account locked until ${new Date(lockout.unlock_at).toLocaleString()}. Reason: ${lockout.reason}` };
          }
        }

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        
        if (error) {
          // Log failed login attempt
          const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
          const { data: recentFailures } = await supabase
            .from("failed_login_attempts")
            .select("id")
            .eq("email", email)
            .gte("created_at", hourAgo);

          const attemptCount = (recentFailures?.length || 0) + 1;

          await supabase.from("failed_login_attempts").insert({
            email,
            ip_address: geo.ip,
            country: geo.country,
            browser: clientInfo.browser,
            os: clientInfo.os,
            reason: error.message,
            attempt_count: attemptCount,
          });

          // Trigger Lockout after 5 attempts
          if (attemptCount >= 5 && userProfile?.id) {
            await supabase.from("account_lockouts").insert({
              user_id: userProfile.id,
              locked_at: new Date().toISOString(),
              unlock_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
              reason: "Excessive failed logins (Lockout threshold exceeded)"
            });

            await supabase.from("notifications").insert({
              user_id: userProfile.id,
              title: "Account Locked Out",
              message: "Your account is temporarily locked due to brute force protection.",
              type: "security"
            });
          }

          return { error: translateError(error.message) };
        }

        if (data.session?.user) {
          const profile = await loadProfile(data.session.user.id);
          const sessionId = data.session.access_token.slice(-36);

          // Success login history
          await supabase.from("login_history").insert({
            user_id: data.session.user.id,
            email: data.session.user.email ?? "",
            username: profile?.full_name || null,
            login_time: new Date().toISOString(),
            browser: clientInfo.browser,
            operating_system: clientInfo.os,
            device_type: clientInfo.device,
            ip_address: geo.ip,
            country: geo.country,
            city: geo.city,
            session_id: sessionId
          });

          // Active session
          await supabase.from("active_sessions").insert({
            user_id: data.session.user.id,
            session_id: sessionId,
            device: clientInfo.device,
            browser: clientInfo.browser,
            os: clientInfo.os,
            ip_address: geo.ip,
            country: geo.country,
            created_at: new Date().toISOString(),
            last_activity: new Date().toISOString(),
            status: "active"
          });

          // Impossible travel check
          const { data: lastLogins } = await supabase
            .from("login_history")
            .select("country, login_time")
            .eq("user_id", data.session.user.id)
            .order("login_time", { ascending: false })
            .limit(2);

          if (lastLogins && lastLogins.length > 1) {
            const prevLogin = lastLogins[1];
            if (prevLogin.country && prevLogin.country !== geo.country) {
              await supabase.from("security_alerts").insert({
                user_id: data.session.user.id,
                alert_type: "impossible_travel",
                description: `Impossible travel warning: login from ${geo.country} shortly after ${prevLogin.country}`,
                risk_score: 80,
                metadata: {
                  current_ip: geo.ip,
                  current_country: geo.country,
                  previous_country: prevLogin.country
                }
              });

              await supabase.from("notifications").insert({
                user_id: data.session.user.id,
                title: "Impossible Travel Alert",
                message: `Login from ${geo.country} reported shortly after ${prevLogin.country}.`,
                type: "security"
              });
            }
          }

          setState({
            session: data.session,
            user: data.session.user,
            profile,
            loading: false,
            error: null,
          });
        }
        return { error: null };
      },
      async signUp(email, password, fullName) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (error) return { error: translateError(error.message) };
        const needsVerification = !data.session;
        if (data.user && !needsVerification) {
          await supabase.from("profiles").upsert({
            id: data.user.id,
            email,
            full_name: fullName,
          });
          const profile = await loadProfile(data.user.id);
          setState({
            session: data.session,
            user: data.user,
            profile,
            loading: false,
            error: null,
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
        if (state.user?.id) {
          try {
            const sessionId = state.session?.access_token.slice(-36);
            if (sessionId) {
              await supabase
                .from("login_history")
                .update({ logout_time: new Date().toISOString() })
                .eq("session_id", sessionId);

              await supabase
                .from("active_sessions")
                .update({ status: "terminated", last_activity: new Date().toISOString() })
                .eq("session_id", sessionId);
            }
          } catch (err) {
            console.warn("Logout updates error:", err);
          }
        }
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
