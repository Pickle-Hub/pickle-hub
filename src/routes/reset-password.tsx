import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      {
        title: "Reset Password — Pickle Hub",
      },
      {
        name: "description",
        content: "Reset your Pickle Hub account password.",
      },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();

      if (data.session) {
        setReady(true);
      } else {
        toast.error(
          "This password reset link is invalid or has expired."
        );
      }
    };

    void checkSession();
  }, []);

  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setBusy(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setBusy(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Password changed successfully!");

    await supabase.auth.signOut();

    void navigate({ to: "/login" });
  };

  return (
    <SiteLayout>
      <section className="mx-auto flex max-w-md flex-col items-center px-4 py-16">
        <img
          src="/favicon.png"
          alt="Pickle Hub"
          className="h-18 w-18 rounded-lg object-contain"
        />

        <h1 className="mt-4 font-display text-3xl font-black">
          Reset Password
        </h1>

        <p className="mt-2 text-center text-sm text-muted-foreground">
          Enter your new password below.
        </p>

        <Card className="mt-8 w-full p-6">
          {!ready ? (
            <p className="text-center text-sm text-muted-foreground">
              Checking reset link...
            </p>
          ) : (
            <form
              className="space-y-5"
              onSubmit={updatePassword}
            >
              <div className="space-y-2">
                <Label htmlFor="new-password">
                  New password
                </Label>

                <Input
                  id="new-password"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="Enter new password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">
                  Confirm password
                </Label>

                <Input
                  id="confirm-password"
                  type="password"
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                  placeholder="Re-enter new password"
                />
              </div>

              <Button
                type="submit"
                variant="hero"
                size="lg"
                className="w-full"
                disabled={busy}
              >
                {busy ? "Updating..." : "Change password"}
              </Button>
            </form>
          )}
        </Card>
      </section>
    </SiteLayout>
  );
}