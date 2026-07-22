import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, ArrowRight, CheckCircle } from "lucide-react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { Button } from "@ui/index";

export function VerifyEmailPage({ email }: { email: string }) {
  return (
    <AuthLayout>
      <div className="gradient-border rounded-2xl">
        <div className="glass-strong rounded-2xl p-8 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary-500/10 ring-1 ring-primary-500/20"
          >
            <Mail className="h-8 w-8 text-primary-400" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
          >
            <h1 className="font-heading text-2xl font-semibold text-neutral-50">
              Check your inbox
            </h1>
            <p className="mt-3 text-sm text-neutral-400">
              We've sent a verification link to{" "}
              <span className="font-medium text-neutral-200">{email}</span>.
              Click it to activate your account.
            </p>

            <div className="mt-6 rounded-lg border border-border bg-surface-2 p-4 text-left">
              <ul className="space-y-2.5">
                {[
                  "Check your spam/junk folder if it doesn't arrive",
                  "The link expires in 24 hours",
                  "You can sign in immediately after verifying",
                ].map((tip) => (
                  <li key={tip} className="flex items-start gap-2 text-xs text-neutral-400">
                    <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success-400" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            <Button variant="gradient" className="mt-6 w-full" asChild>
              <Link to="/sign-in">
                Go to sign in
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>

            <p className="mt-4 text-xs text-neutral-500">
              Already verified?{" "}
              <Link to="/sign-in" className="text-primary-400 hover:text-primary-300">
                Sign in
              </Link>
            </p>
          </motion.div>
        </div>
      </div>
    </AuthLayout>
  );
}
