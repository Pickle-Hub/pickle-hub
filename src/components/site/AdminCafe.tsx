import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useCafeItems, useCafeOrders } from "@/hooks/usePickle";
import { supabase } from "@/integrations/supabase/client";
import type { CafeItem, CafeOrder } from "@/lib/pickle";
import { cafeStatusMeta, inr } from "@/lib/pickle";
import { cn } from "@/lib/utils";

const NEXT: Record<string, string[]> = {
  PLACED: ["PREPARING", "CANCELLED"],
  PREPARING: ["SERVED", "CANCELLED"],
  SERVED: [],
  CANCELLED: [],
};

export function AdminCafe() {
  const qc = useQueryClient();
  const { data: items = [], isLoading } = useCafeItems();
  const { data: orders = [] } = useCafeOrders();

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["cafe-items"] });
    void qc.invalidateQueries({ queryKey: ["cafe-orders"] });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        <NewItemForm onDone={refresh} />
        <Card className="p-6">
          <h3 className="font-display text-lg font-black">Menu items</h3>
          {isLoading ? (
            <Loader2 className="mt-6 h-5 w-5 animate-spin text-primary" />
          ) : (
            <div className="mt-4 space-y-3">
              {items.map((it) => (
                <ItemRow key={it.id} item={it} onDone={refresh} />
              ))}
              {items.length === 0 && <p className="text-sm text-muted-foreground">No items yet.</p>}
            </div>
          )}
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="font-display text-lg font-black">Café orders</h3>
        <p className="text-xs text-muted-foreground">Who ordered what, and how it is progressing.</p>
        <div className="mt-4 space-y-3">
          {orders.map((o) => (
            <OrderRow key={o.id} order={o} onDone={refresh} />
          ))}
          {orders.length === 0 && <p className="text-sm text-muted-foreground">No orders yet.</p>}
        </div>
      </Card>
    </div>
  );
}

function NewItemForm({ onDone }: { onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Snacks");
  const [price, setPrice] = useState("");

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Item name is required");
      return;
    }
    setBusy(true);
    const { error } = await supabase.from("cafe_items").insert({
      name: name.trim(),
      description: description.trim(),
      category: category.trim() || "Snacks",
      price: Number(price) || 0,
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setName("");
    setDescription("");
    setPrice("");
    toast.success("Item added to the menu");
    onDone();
  };

  return (
    <Card className="p-6">
      <h3 className="font-display text-lg font-black">Add a menu item</h3>
      <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={add}>
        <div className="space-y-2">
          <Label htmlFor="ci-name">Name</Label>
          <Input id="ci-name" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ci-cat">Category</Label>
          <Input id="ci-cat" value={category} maxLength={30} onChange={(e) => setCategory(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ci-price">Price (₹)</Label>
          <Input id="ci-price" type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="ci-desc">Description</Label>
          <Textarea id="ci-desc" rows={2} value={description} maxLength={160} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <Button type="submit" variant="hero" disabled={busy} className="sm:col-span-2">
          <Plus className="h-4 w-4" /> Add item
        </Button>
      </form>
    </Card>
  );
}

function ItemRow({ item, onDone }: { item: CafeItem; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const [price, setPrice] = useState(String(item.price));

  const patch = async (values: { price?: number; available?: boolean }) => {
    setBusy(true);
    const { error } = await supabase.from("cafe_items").update(values).eq("id", item.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    onDone();
  };

  const remove = async () => {
    setBusy(true);
    const { error } = await supabase.from("cafe_items").delete().eq("id", item.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Item removed");
    onDone();
  };

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-3">
      <div className="min-w-[140px] flex-1">
        <p className="text-sm font-bold">{item.name}</p>
        <p className="text-xs text-muted-foreground">{item.category}</p>
      </div>
      <Input
        className="h-9 w-24"
        type="number"
        min={0}
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        onBlur={() => Number(price) !== item.price && void patch({ price: Number(price) || 0 })}
      />
      <div className="flex items-center gap-2">
        <Switch checked={item.available} onCheckedChange={(v) => void patch({ available: v })} />
        <span className="text-xs text-muted-foreground">{item.available ? "Available" : "Hidden"}</span>
      </div>
      <Button variant="ghost" size="icon" disabled={busy} onClick={() => void remove()} aria-label="Delete item">
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}

function OrderRow({ order, onDone }: { order: CafeOrder; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  const meta = cafeStatusMeta[order.status] ?? cafeStatusMeta["PLACED"]!;

  const setStatus = async (status: string) => {
    setBusy(true);
    const { error } = await supabase.from("cafe_orders").update({ status }).eq("id", order.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    onDone();
  };

  return (
    <div className="rounded-xl border border-border p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-bold">
            {order.quantity} × {order.item_name}
          </p>
          <p className="text-xs text-muted-foreground">
            {order.customer_name || "Player"} · {order.customer_phone || "—"} · {order.order_code}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold">{inr(order.amount)}</p>
          <span className={cn("inline-block rounded-full border px-2 py-0.5 text-[11px] font-bold", meta.className)}>
            {meta.label}
          </span>
        </div>
      </div>
      {order.notes && <p className="mt-2 text-xs text-muted-foreground">Note: {order.notes}</p>}
      {(NEXT[order.status] ?? []).length > 0 && (
        <div className="mt-3 flex gap-2">
          {(NEXT[order.status] ?? []).map((s) => (
            <Button key={s} size="sm" variant={s === "CANCELLED" ? "outline" : "hero"} disabled={busy} onClick={() => void setStatus(s)}>
              {cafeStatusMeta[s]?.label ?? s}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
