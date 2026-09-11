import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { RequireAuth } from "@/components/site/RequireAuth";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — Pickle Hub" },
      { name: "description", content: "Update your Pickle Hub contact details used for booking confirmations." },
      { property: "og:title", content: "My Profile — Pickle Hub" },
      { property: "og:description", content: "Manage your Pickle Hub account details." },
    ],
  }),
  component: () => (
    <SiteLayout>
      <RequireAuth>
        <ProfilePage />
      </RequireAuth>
    </SiteLayout>
  ),
});

function ProfilePage() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setFullName(profile?.full_name ?? "");
    setPhone(profile?.phone_number ?? "");
  }, [profile]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim(), phone_number: phone.trim() })
      .eq("id", user.id);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    await refreshProfile();
    toast.success("Profile updated");
  };

  return (
    <section className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="font-display text-3xl font-black">My Profile</h1>
      <p className="mt-2 text-sm text-muted-foreground">These details appear on your bookings and receipts.</p>

      <Card className="mt-8 p-6">
        <form className="space-y-4" onSubmit={save}>
          <div className="space-y-2">
            <Label htmlFor="p-email">Email</Label>
            <Input id="p-email" value={user?.email ?? ""} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-name">Full name</Label>
            <Input id="p-name" maxLength={80} value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-phone">Phone (WhatsApp)</Label>
            <Input id="p-phone" maxLength={20} value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button type="submit" variant="hero" disabled={busy}>
              Save changes
            </Button>
            <Button type="button" variant="outline" onClick={() => void signOut()}>
              Log out
            </Button>
          </div>
        </form>
      </Card>
    </section>
  );
}
