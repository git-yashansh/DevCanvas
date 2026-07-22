import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, AlertCircle } from "lucide-react";
import { GoogleIcon } from "@/components/auth/google-icon";
import { Button } from "@ui/index";
import { Input } from "@ui/index";
import { Label } from "@ui/index";
import { useAuth } from "@/lib/auth-context";
import { AuthLayout } from "@/components/auth/auth-layout";

const schema = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

type FormValues = z.infer<typeof schema>;

export function SignInPage() {
  const navigate = useNavigate();
  const { signIn, signInWithGoogle } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleGoogle() {
    setGoogleLoading(true);
    const { error } = await signInWithGoogle();
    if (error) { setServerError(error); setGoogleLoading(false); }
  }

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    setSubmitting(true);
    const { error } = await signIn(values.email, values.password);
    setSubmitting(false);
    if (error) {
      setServerError(error);
      return;
    }
    navigate("/app");
  }

  return (
    <AuthLayout>
      <div className="gradient-border rounded-2xl">
        <div className="glass-strong rounded-2xl p-8">
          <div className="mb-8">
            <h1 className="font-heading text-2xl font-semibold text-neutral-50">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-neutral-400">
              Sign in to your DevCanvas workspace.
            </p>
          </div>

          {serverError ? (
            <div className="mb-5 flex items-center gap-2 rounded-lg border border-danger-500/30 bg-danger-500/10 px-4 py-3 text-sm text-danger-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {serverError}
            </div>
          ) : null}

          <button
            type="button"
            onClick={handleGoogle}
            disabled={googleLoading || submitting}
            className="mb-5 flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-surface-2 px-4 py-2.5 text-sm font-medium text-neutral-200 transition-colors hover:border-border-hover hover:bg-surface hover:text-neutral-50 disabled:opacity-50"
          >
            {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon className="h-4 w-4" />}
            Continue with Google
          </button>

          <div className="relative mb-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs text-neutral-600">or continue with email</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                {...register("email")}
              />
              {errors.email ? (
                <p className="text-xs text-danger-400">{errors.email.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                {...register("password")}
              />
              {errors.password ? (
                <p className="text-xs text-danger-400">{errors.password.message}</p>
              ) : null}
            </div>
            <Button type="submit" variant="gradient" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-neutral-400">
            Don't have an account?{" "}
            <Link
              to="/sign-up"
              className="font-medium text-primary-400 transition-colors hover:text-primary-300"
            >
              Create one
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
