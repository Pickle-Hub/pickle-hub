import logo from "@/assets/pickle-hub-logo.png.asset.json";
import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <img
      src={logo.url}
      alt="Pickle Hub logo"
      className={cn("h-10 w-10 rounded-xl object-contain", className)}
      loading="lazy"
    />
  );
}
