import { Link } from "@tanstack/react-router";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { CLUB } from "@/lib/pickle";

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-ink text-ink-foreground print : hidden">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="flex items-center gap-2.5">
            <img
                src="/favicon.png"
                alt="Pickle Hub Logo"
                className="h-10 w-10 object-contain"
              />
            <span className="font-display text-lg font-extrabold">Pickle Hub</span>
          </div>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-foreground/70">
            Two championship-grade pickleball courts, floodlit from dawn to midnight. Book by the hour, pay by UPI, and
            just show up and play.
          </p>
        </div>
        <div>
          <h3 className="font-display text-sm font-bold uppercase tracking-widest text-gold">Visit</h3>
          <ul className="mt-4 space-y-3 text-sm text-ink-foreground/75">
            <li className="flex gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              {CLUB.address}
            </li>
            <li className="flex gap-2.5">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              {CLUB.hours}
            </li>
          </ul>
        </div>
        <div>
          <h3 className="font-display text-sm font-bold uppercase tracking-widest text-gold">Contact</h3>
          <ul className="mt-4 space-y-3 text-sm text-ink-foreground/75">
            <li className="flex gap-2.5">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              {CLUB.phoneDisplay}
            </li>
            <li className="flex gap-2.5">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              {CLUB.email}
            </li>
            <li className="pt-2">
              <Link to="/book" className="font-semibold text-gold hover:underline">
                Book a court →
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-6 text-center text-xs text-ink-foreground/50">
        © {new Date().getFullYear()} Pickle Hub. All rights reserved.
      </div>
    </footer>
  );
}
