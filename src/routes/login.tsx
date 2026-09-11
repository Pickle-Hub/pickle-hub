import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in or Sign up — Pickle Hub" },
      { name: "description", content: "Access your Pickle Hub account to book courts and manage your bookings." },
      { property: "og:title", content: "Log in — Pickle Hub" },
      { property: "og:description", content: "Sign in to book premium pickleball courts at Pickle Hub." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
  if (!loading && user) {
    console.log("USER LOGGED IN:", user);
    navigate({ to: "/book", replace: true });
  }
}, [user, loading, navigate]);
  const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/`,
    },
  });

  if (error) {
    console.error("Google OAuth error:", error);
    toast.error(error.message);
    return;
  }

  console.log("Google OAuth URL:", data?.url);
};
  const resetPassword = async () => {
  const resetEmail = email.trim().toLowerCase();

  if (!resetEmail) {
    toast.error("Please enter your email first");
    return;
  }

  setBusy(true);

  const { error } = await supabase.auth.resetPasswordForEmail(
    resetEmail,
    {
      redirectTo: `${window.location.origin}/reset-password`,
    }
  );

  setBusy(false);

  if (error) {
    toast.error(error.message);
    return;
  }

  toast.success(
    "Password reset email sent. Please check your inbox."
  );
};
  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Welcome back!");
    void navigate({ to: "/book" });
  };

  const signUp = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!fullName.trim()) {
    toast.error("Please enter your name");
    return;
  }

  if (!phone.trim()) {
    toast.error("Please enter your phone number");
    return;
  }

  if (!email.trim()) {
    toast.error("Please enter your email");
    return;
  }

  if (password.length < 6) {
    toast.error("Password must be at least 6 characters");
    return;
  }

  setBusy(true);

  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      emailRedirectTo: window.location.origin,
      data: {
        full_name: fullName.trim(),
        phone_number: phone.trim(),
      },
    },
  });

  setBusy(false);

  if (error) {
    const message = error.message.toLowerCase();

    if (
      message.includes("already registered") ||
      message.includes("already exists") ||
      message.includes("user already")
    ) {
      toast.error("Account already exists. Please log in instead.");
    } else {
      toast.error(error.message);
    }

    return;
  }

  if (!data.user) {
    toast.error("Unable to create account. Please try again.");
    return;
  }

  if (!data.session) {
    toast.success(
      "Account created! Please check your email to confirm your account."
    );
    return;
  }

  toast.success("Account created successfully!");
  void navigate({ to: "/book" });
};

  return (
    <SiteLayout>
      <section className="mx-auto flex max-w-md flex-col items-center px-4 py-16">
        <img
            src="/favicon.png"
            alt="Pickle Hub"
            className="h-18 w-18 rounded-lg object-contain"
          />
        <h1 className="mt-4 font-display text-3xl font-black">Welcome to Pickle Hub</h1>
        <p className="mt-2 text-center text-sm text-muted-foreground">#all_can_play - Book yours!  </p> 
        <Card className="mt-8 w-full p-6">
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Log in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form className="mt-5 space-y-4" onSubmit={signIn}>
                <div className="space-y-2">
                  <Label htmlFor="li-email">Email</Label>
                  <Input id="li-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
  <div className="flex items-center justify-between">
    <Label htmlFor="li-pass">Password</Label>

        <button
          type="button"
          className="text-sm font-semibold text-primary hover:underline"
          onClick={() => {
            if (!email.trim()) {
              toast.error("Please enter your email first");
              return;
            }

            void resetPassword();
          }}
        >
          Forgot password?
        </button>
      </div>

      <Input 
        id="li-pass" 
        type="password" 
        required 
        value={password} 
        onChange={(e) => setPassword(e.target.value)} 
      />
    </div>
                <Button type="submit" variant="hero" size="lg" className="w-full" disabled={busy}>
                  Log in
                </Button>
                <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>

                <div className="relative flex justify-center text-xs">
                  <span className="bg-background px-3 text-muted-foreground">
                    OR
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => void signInWithGoogle()}
              >
                Continue with Google
              </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form className="mt-5 space-y-4" onSubmit={signUp}>
                <div className="space-y-2">
                  <Label htmlFor="su-name">Full name</Label>
                  <Input id="su-name" required maxLength={80} value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="su-phone">Phone (WhatsApp)</Label>
                  <Input id="su-phone" required maxLength={20} value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="su-email">Email</Label>
                  <Input id="su-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="su-pass">Password</Label>
                  <Input
                    id="su-pass"
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <Button type="submit" variant="hero" size="lg" className="w-full" disabled={busy}>
                  Create account
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </section>
    </SiteLayout>
  );
}
