import { useState } from "react";
import { Plus, Pencil, Trash2, Save, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface ServiceManagerProps {
  services: Tables<"service_items">[];
  onUpdate: () => void;
}

export default function ServiceManager({ services, onUpdate }: ServiceManagerProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Tables<"service_items"> | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const { toast } = useToast();

  const openAdd = () => {
    setEditing(null);
    setName("");
    setPrice("");
    setDialogOpen(true);
  };

  const openEdit = (s: Tables<"service_items">) => {
    setEditing(s);
    setName(s.name);
    setPrice(String(s.price));
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    const numPrice = parseFloat(price);
    if (!trimmedName || isNaN(numPrice) || numPrice <= 0) {
      toast({ title: "请输入有效的名称和价格", variant: "destructive" });
      return;
    }

    if (editing) {
      const { error } = await supabase.from("service_items").update({ name: trimmedName, price: numPrice }).eq("id", editing.id);
      if (error) { toast({ title: "修改失败", variant: "destructive" }); return; }
      toast({ title: "服务已更新" });
    } else {
      const maxSort = services.reduce((m, s) => Math.max(m, s.sort_order), 0);
      const { error } = await supabase.from("service_items").insert({ name: trimmedName, price: numPrice, sort_order: maxSort + 1 });
      if (error) { toast({ title: "添加失败", variant: "destructive" }); return; }
      toast({ title: "服务已添加" });
    }
    setDialogOpen(false);
    onUpdate();
  };

  const handleDelete = async (s: Tables<"service_items">) => {
    if (!confirm(`确定删除「${s.name}」？`)) return;
    const { error } = await supabase.from("service_items").update({ is_active: false }).eq("id", s.id);
    if (error) { toast({ title: "删除失败", variant: "destructive" }); return; }
    toast({ title: "服务已删除" });
    onUpdate();
  };

  return (
    <>
      <div className="flex items-center gap-2 mb-3">
        <Label className="flex-1">服务项目管理</Label>
        <Button size="sm" variant="outline" onClick={openAdd}>
          <Plus className="w-3.5 h-3.5 mr-1" />
          添加服务
        </Button>
      </div>

      <div className="space-y-1.5 max-h-60 overflow-y-auto">
        {services.map((s) => (
          <div key={s.id} className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-accent/50 group">
            <div className="text-sm">
              <span className="font-medium">{s.name}</span>
              <span className="text-muted-foreground ml-2">¥{s.price}</span>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => openEdit(s)} className="p-1 rounded hover:bg-accent">
                <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              <button onClick={() => handleDelete(s)} className="p-1 rounded hover:bg-destructive/10">
                <Trash2 className="w-3.5 h-3.5 text-destructive" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editing ? "编辑服务" : "添加服务"}</DialogTitle>
            <DialogDescription>{editing ? "修改服务名称和价格" : "输入新服务的名称和价格"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="mb-1.5 block">服务名称</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="如：洗剪吹" />
            </div>
            <div>
              <Label className="mb-1.5 block">价格</Label>
              <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" min="0" step="0.01" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-1" />
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
