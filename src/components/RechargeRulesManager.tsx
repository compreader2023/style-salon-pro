import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Check, X, Settings } from "lucide-react";

interface Props {
  rules: Tables<"recharge_rules">[];
  onRulesChange: () => void;
}

export default function RechargeRulesManager({ rules, onRulesChange }: Props) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [rechargeAmount, setRechargeAmount] = useState("");
  const [bonusAmount, setBonusAmount] = useState("");

  const isAdmin = profile?.role === "admin";
  if (!isAdmin) return null;

  const resetForm = () => {
    setEditId(null);
    setRechargeAmount("");
    setBonusAmount("");
  };

  const startEdit = (rule: Tables<"recharge_rules">) => {
    setEditId(rule.id);
    setRechargeAmount(String(rule.recharge_amount));
    setBonusAmount(String(rule.bonus_amount));
  };

  const handleSave = async () => {
    const amt = parseFloat(rechargeAmount);
    const bon = parseFloat(bonusAmount);
    if (isNaN(amt) || amt <= 0 || isNaN(bon) || bon < 0) {
      toast({ title: "请输入有效金额", variant: "destructive" });
      return;
    }

    if (editId) {
      const { error } = await supabase
        .from("recharge_rules")
        .update({ recharge_amount: amt, bonus_amount: bon })
        .eq("id", editId);
      if (error) {
        toast({ title: "更新失败", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "更新成功" });
    } else {
      const { error } = await supabase
        .from("recharge_rules")
        .insert({ recharge_amount: amt, bonus_amount: bon });
      if (error) {
        toast({ title: "添加失败", description: error.message, variant: "destructive" });
        return;
      }
      toast({ title: "添加成功" });
    }
    resetForm();
    onRulesChange();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("recharge_rules").delete().eq("id", id);
    if (error) {
      toast({ title: "删除失败", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "已删除" });
    onRulesChange();
  };

  return (
    <div className="mb-4">
      <Button
        variant="outline"
        size="sm"
        onClick={() => { setOpen(!open); resetForm(); }}
        className="mb-2"
      >
        <Settings className="w-4 h-4 mr-1" />
        管理充值规则
      </Button>

      {open && (
        <div className="bg-card rounded-xl border border-border p-4 space-y-3">
          <h3 className="font-semibold text-foreground">充值规则设置</h3>

          {/* Existing rules */}
          <div className="space-y-2">
            {rules.map((r) =>
              editId === r.id ? (
                <div key={r.id} className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={rechargeAmount}
                    onChange={(e) => setRechargeAmount(e.target.value)}
                    placeholder="充值金额"
                    className="w-28"
                  />
                  <span className="text-muted-foreground text-sm">送</span>
                  <Input
                    type="number"
                    value={bonusAmount}
                    onChange={(e) => setBonusAmount(e.target.value)}
                    placeholder="赠送金额"
                    className="w-28"
                  />
                  <Button size="icon" variant="ghost" onClick={handleSave}>
                    <Check className="w-4 h-4 text-primary" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={resetForm}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div key={r.id} className="flex items-center justify-between bg-accent rounded-lg px-3 py-2">
                  <span className="text-foreground text-sm">
                    充 <strong>¥{r.recharge_amount}</strong> 送 <strong>¥{r.bonus_amount}</strong>
                  </span>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => startEdit(r)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(r.id)}>
                      <Trash2 className="w-3.5 h-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              )
            )}
          </div>

          {/* Add new rule */}
          {!editId && (
            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <Input
                type="number"
                value={rechargeAmount}
                onChange={(e) => setRechargeAmount(e.target.value)}
                placeholder="充值金额"
                className="w-28"
              />
              <span className="text-muted-foreground text-sm">送</span>
              <Input
                type="number"
                value={bonusAmount}
                onChange={(e) => setBonusAmount(e.target.value)}
                placeholder="赠送金额"
                className="w-28"
              />
              <Button size="sm" onClick={handleSave}>
                <Plus className="w-4 h-4 mr-1" />
                添加
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
