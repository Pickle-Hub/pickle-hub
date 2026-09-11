import { Link } from "@tanstack/react-router";
import { Loader2, Lock } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export function RequireAuth({ children, admin = false }: { children: ReactNode; admin?: boolean }) {
  const { loading, user, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto grid min-h-[50vh] max-w-md place-items-center px-4 text-center">
        <div>
          <Lock className="mx-auto h-8 w-8 text-primary" />
          <h1 className="mt-4 font-display text-2xl font-black">Sign in to continue</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            You need a Pickle Hub account to view this page.
          </p>
          <Button asChild variant="hero" className="mt-6">
            <Link to="/login">Log in or sign up</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (admin && !isAdmin) {
    return (
      <div className="mx-auto grid min-h-[50vh] max-w-md place-items-center px-4 text-center">
        <div>
          <Lock className="mx-auto h-8 w-8 text-destructive" />
          <h1 className="mt-4 font-display text-2xl font-black">Admins only</h1>
          <p className="mt-2 text-sm text-muted-foreground">This dashboard is restricted to Pickle Hub staff.</p>
          <Button asChild variant="outline" className="mt-6">
            <Link to="/">Back home</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
