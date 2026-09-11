import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, ShieldCheck, User2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const links = [
  { to: "/", label: "Home" },
  { to: "/book", label: "Book a Court" },
  { to: "/cafe", label: "Café" },
  { to: "/find-booking", label: "Find My Booking" },
  { to: "/activity", label: "My Activity" },
  { to: "/contact", label: "Location" },
  {
  label: "Membership",
  to: "/membership",
},
];

export function SiteHeader() {
  const { user, isAdmin, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl print:hidden">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <img
            src="/favicon.png"
            alt="Pickle Hub"
            className="h-10 w-10 rounded-lg object-contain"
          />

          <span className="font-display text-lg font-extrabold tracking-tight">
            Pickle<span className="text-primary">Hub</span>
          </span>
        </Link>

        <nav className="ml-6 hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
                pathname === l.to && "bg-accent text-accent-foreground",
              )}
            >
              {l.label}
            </Link>
          ))}
          {isAdmin && (
            <Link
              to="/admin"
              className="ml-1 inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-accent"
            >
              <ShieldCheck className="h-4 w-4" /> Admin
            </Link>
          )}
        </nav>

        <div className="ml-auto hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link to="/profile">
                  <User2 className="h-4 w-4" /> Profile
                </Link>
              </Button>
              <Button variant="outline" size="sm" onClick={() => void signOut()}>
                Log out
              </Button>
            </>
          ) : (
            <Button asChild variant="ghost" size="sm">
              <Link to="/login">Log in</Link>
            </Button>
          )}
          <Button asChild variant="hero" size="sm">
            <Link to="/book">Book Now</Link>
          </Button>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="ml-auto md:hidden" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[86vw] max-w-sm">
            <div className="mt-8 flex flex-col gap-1">
              {links.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-3.5 text-base font-semibold hover:bg-accent"
                >
                  {l.label}
                </Link>
              ))}
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-3.5 text-base font-semibold text-primary hover:bg-accent"
                >
                  Admin Dashboard
                </Link>
              )}
              <div className="mt-4 flex flex-col gap-2">
                {user ? (
                  <>
                    <Button asChild variant="outline" size="lg">
                      <Link to="/profile" onClick={() => setOpen(false)}>
                        Profile
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="lg"
                      onClick={() => {
                        setOpen(false);
                        void signOut();
                      }}
                    >
                      Log out
                    </Button>
                  </>
                ) : (
                  <Button asChild variant="outline" size="lg">
                    <Link to="/login" onClick={() => setOpen(false)}>
                      Log in
                    </Link>
                  </Button>
                )}
                <Button asChild variant="hero" size="lg">
                  <Link to="/book" onClick={() => setOpen(false)}>
                    Book Now
                  </Link>
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
