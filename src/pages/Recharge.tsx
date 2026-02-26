import { useEffect, useState } from "react";
import { CreditCard, Banknote, Smartphone, CreditCard as CardIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MemberSearch from "@/components/MemberSearch";
import { useToast } from "@/hooks/use-toast";

const paymentMethods = [
  { value: "cash", label: "现金", icon: Banknote },
  { value: "wechat", label: "微信", icon: Smartphone },
  { value: "alipay", label: "支付宝", icon: Smartphone },
  { value: "card", label: "刷卡", icon: CardIcon },
];

export default function Recharge() {
  const [member, setMember] = useState<Tables<"members"> | null>(null);
  const [rules, setRules] = useState<Tables<"recharge_rules">[]>([]);
  const [amount, setAmount] = useState("");
  const [bonus, setBonus] = useState(0);
  const [payMethod, setPayMethod] = useState("cash");
  const { toast } = useToast();
  const { profile } = useAuth();
  const operator = profile?.display_name || "店员";

  useEffect(() => {
    supabase.from("recharge_rules").select("*").eq("is_active", true).order("recharge_amount").then(({ data }) => {
      setRules(data || []);
    });
  }, []);

  const calcBonus = (val: number) => {
    let b = 0;
    for (const rule of [...rules].sort((a, c) => c.recharge_amount - a.recharge_amount)) {
      if (val >= rule.recharge_amount) { b = rule.bonus_amount; break; }
    }
    return b;
  };

  const handleAmountChange = (val: string) => {
    setAmount(val);
    const num = parseFloat(val);
    setBonus(isNaN(num) ? 0 : calcBonus(num));
  };

  const selectRule = (rule: Tables<"recharge_rules">) => {
    setAmount(String(rule.recharge_amount));
    setBonus(rule.bonus_amount);
  };

  const handleSubmit = async () => {
    if (!member) { toast({ title: "请先选择会员", variant: "destructive" }); return; }
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) { toast({ title: "请输入有效金额", variant: "destructive" }); return; }

    const totalCredit = amt + bonus;

    // Insert recharge record
    const { error: recErr } = await supabase.from("recharge_records").insert({
      member_id: member.id,
      amount: amt,
      bonus: bonus,
      payment_method: payMethod,
      operator_name: operator,
    });

    if (recErr) { toast({ title: "充值失败", description: recErr.message, variant: "destructive" }); return; }

    // Update member balance
    const { error: memErr } = await supabase.from("members").update({
      balance: Number(member.balance) + totalCredit,
      total_recharged: Number(member.total_recharged) + amt,
    }).eq("id", member.id);

    if (memErr) { toast({ title: "余额更新失败", variant: "destructive" }); return; }

    toast({ title: "充值成功", description: `充值 ¥${amt}，赠送 ¥${bonus}，到账 ¥${totalCredit}` });
    setMember({ ...member, balance: Number(member.balance) + totalCredit });
    setAmount("");
    setBonus(0);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">会员充值</h1>
        <p className="text-sm text-muted-foreground mt-1">为会员充值余额</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left: Form */}
        <div className="bg-card rounded-xl border border-border p-6 space-y-5">
          <div>
            <Label className="mb-1.5 block">选择会员</Label>
            <MemberSearch onSelect={setMember} />
          </div>

          {member && (
            <div className="bg-accent rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-foreground">{member.name}</p>
                  <p className="text-xs text-muted-foreground">{member.member_no} · {member.phone}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">当前余额</p>
                  <p className="text-xl font-bold text-primary">¥{Number(member.balance).toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}

          <div>
            <Label className="mb-1.5 block">充值金额</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="输入充值金额"
              className="text-lg"
            />
          </div>

          {/* Quick select rules */}
          <div>
            <Label className="mb-1.5 block">快捷充值（含赠送）</Label>
            <div className="grid grid-cols-3 gap-2">
              {rules.map((r) => (
                <button
                  key={r.id}
                  onClick={() => selectRule(r)}
                  className={`border rounded-lg p-3 text-center transition-colors ${
                    amount === String(r.recharge_amount)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50 text-foreground"
                  }`}
                >
                  <p className="font-semibold">¥{r.recharge_amount}</p>
                  <p className="text-xs text-muted-foreground">送 ¥{r.bonus_amount}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="mb-1.5 block">支付方式</Label>
            <div className="grid grid-cols-4 gap-2">
              {paymentMethods.map((pm) => (
                <button
                  key={pm.value}
                  onClick={() => setPayMethod(pm.value)}
                  className={`border rounded-lg p-2.5 text-center text-sm transition-colors ${
                    payMethod === pm.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50 text-foreground"
                  }`}
                >
                  <pm.icon className="w-4 h-4 mx-auto mb-1" />
                  {pm.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="mb-1.5 block">操作员</Label>
            <Input value={operator} readOnly className="bg-muted" />
          </div>
        </div>

        {/* Right: Summary */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h2 className="font-semibold text-lg mb-4">充值确认</h2>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">充值金额</span>
              <span className="font-semibold">¥{amount || "0"}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">赠送金额</span>
              <span className="font-semibold text-success">+¥{bonus}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">总到账</span>
              <span className="text-xl font-bold text-primary">
                ¥{(parseFloat(amount || "0") + bonus).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">支付方式</span>
              <span>{paymentMethods.find(p => p.value === payMethod)?.label}</span>
            </div>
          </div>
          <Button onClick={handleSubmit} className="w-full mt-6" size="lg" disabled={!member || !amount}>
            <CreditCard className="w-4 h-4 mr-2" />
            确认充值
          </Button>
        </div>
      </div>
    </div>
  );
}
