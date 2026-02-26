import { useEffect, useState } from "react";
import { ShoppingCart, Banknote, Smartphone, CreditCard, Wallet, Minus, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MemberSearch from "@/components/MemberSearch";
import { useToast } from "@/hooks/use-toast";

const paymentMethods = [
  { value: "balance", label: "余额", icon: Wallet },
  { value: "cash", label: "现金", icon: Banknote },
  { value: "wechat", label: "微信", icon: Smartphone },
  { value: "alipay", label: "支付宝", icon: Smartphone },
  { value: "card", label: "刷卡", icon: CreditCard },
  { value: "mixed", label: "混合", icon: ShoppingCart },
];

interface CartItem {
  service: Tables<"service_items">;
  quantity: number;
}

export default function Checkout() {
  const [member, setMember] = useState<Tables<"members"> | null>(null);
  const [services, setServices] = useState<Tables<"service_items">[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [payMethod, setPayMethod] = useState("balance");
  const [balancePay, setBalancePay] = useState("");
  const [operator, setOperator] = useState("店员");
  const { toast } = useToast();

  useEffect(() => {
    supabase.from("service_items").select("*").eq("is_active", true).order("sort_order").then(({ data }) => {
      setServices(data || []);
    });
  }, []);

  const totalAmount = cart.reduce((s, i) => s + i.service.price * i.quantity, 0);

  const addToCart = (service: Tables<"service_items">) => {
    setCart(prev => {
      const existing = prev.find(i => i.service.id === service.id);
      if (existing) return prev.map(i => i.service.id === service.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { service, quantity: 1 }];
    });
  };

  const updateQty = (serviceId: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.service.id === serviceId) {
        const newQty = i.quantity + delta;
        return newQty <= 0 ? null : { ...i, quantity: newQty };
      }
      return i;
    }).filter(Boolean) as CartItem[]);
  };

  const handleSubmit = async () => {
    if (!member) { toast({ title: "请先选择会员", variant: "destructive" }); return; }
    if (cart.length === 0) { toast({ title: "请选择服务项目", variant: "destructive" }); return; }

    let bPay = 0;
    let oPay = 0;

    if (payMethod === "balance") {
      if (Number(member.balance) < totalAmount) {
        toast({ title: "余额不足", description: `当前余额 ¥${Number(member.balance).toFixed(2)}`, variant: "destructive" });
        return;
      }
      bPay = totalAmount;
    } else if (payMethod === "mixed") {
      bPay = Math.min(parseFloat(balancePay || "0"), Number(member.balance), totalAmount);
      oPay = totalAmount - bPay;
    } else {
      oPay = totalAmount;
    }

    // Create consumption record
    const { data: record, error: recErr } = await supabase.from("consumption_records").insert({
      member_id: member.id,
      total_amount: totalAmount,
      balance_paid: bPay,
      other_paid: oPay,
      payment_method: payMethod,
      operator_name: operator,
    }).select().single();

    if (recErr || !record) { toast({ title: "结算失败", variant: "destructive" }); return; }

    // Insert items
    await supabase.from("consumption_items").insert(
      cart.map(i => ({
        consumption_id: record.id,
        service_name: i.service.name,
        price: i.service.price,
        quantity: i.quantity,
      }))
    );

    // Update member
    const newBalance = Number(member.balance) - bPay;
    await supabase.from("members").update({
      balance: newBalance,
      total_spent: Number(member.total_spent) + totalAmount,
    }).eq("id", member.id);

    toast({ title: "结算成功", description: `消费 ¥${totalAmount}，余额扣除 ¥${bPay}` });
    setMember({ ...member, balance: newBalance, total_spent: Number(member.total_spent) + totalAmount });
    setCart([]);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">消费结算</h1>
        <p className="text-sm text-muted-foreground mt-1">选择服务项目并结算</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left: Services */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-card rounded-xl border border-border p-6">
            <Label className="mb-1.5 block">选择会员</Label>
            <MemberSearch onSelect={setMember} />
            {member && (
              <div className="bg-accent rounded-lg p-3 mt-3 flex justify-between items-center">
                <div>
                  <span className="font-semibold">{member.name}</span>
                  <span className="text-xs text-muted-foreground ml-2">{member.member_no}</span>
                </div>
                <span className="font-bold text-primary">余额 ¥{Number(member.balance).toFixed(2)}</span>
              </div>
            )}
          </div>

          <div className="bg-card rounded-xl border border-border p-6">
            <Label className="mb-3 block">选择服务</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {services.map((s) => {
                const inCart = cart.find(i => i.service.id === s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => addToCart(s)}
                    className={`border rounded-lg p-3 text-center transition-colors ${
                      inCart ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                    }`}
                  >
                    <p className="font-medium text-sm text-foreground">{s.name}</p>
                    <p className="text-primary font-semibold mt-0.5">¥{s.price}</p>
                    {inCart && <p className="text-xs text-muted-foreground mt-0.5">×{inCart.quantity}</p>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Cart & Pay */}
        <div className="bg-card rounded-xl border border-border p-6 h-fit">
          <h2 className="font-semibold text-lg mb-4">结算清单</h2>
          {cart.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">请选择服务项目</p>
          ) : (
            <div className="space-y-2 mb-4">
              {cart.map((item) => (
                <div key={item.service.id} className="flex items-center justify-between py-2 border-b border-border">
                  <div>
                    <p className="text-sm font-medium">{item.service.name}</p>
                    <p className="text-xs text-muted-foreground">¥{item.service.price} × {item.quantity}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQty(item.service.id, -1)} className="w-6 h-6 rounded border border-border flex items-center justify-center hover:bg-accent">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-sm w-4 text-center">{item.quantity}</span>
                    <button onClick={() => updateQty(item.service.id, 1)} className="w-6 h-6 rounded border border-border flex items-center justify-center hover:bg-accent">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between py-2 border-b border-border mb-4">
            <span className="font-medium">合计</span>
            <span className="text-xl font-bold text-primary">¥{totalAmount.toFixed(2)}</span>
          </div>

          <div className="mb-4">
            <Label className="mb-1.5 block">支付方式</Label>
            <div className="grid grid-cols-3 gap-1.5">
              {paymentMethods.map((pm) => (
                <button
                  key={pm.value}
                  onClick={() => setPayMethod(pm.value)}
                  className={`border rounded-lg p-2 text-center text-xs transition-colors ${
                    payMethod === pm.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:border-primary/50 text-foreground"
                  }`}
                >
                  <pm.icon className="w-3.5 h-3.5 mx-auto mb-0.5" />
                  {pm.label}
                </button>
              ))}
            </div>
          </div>

          {payMethod === "mixed" && (
            <div className="mb-4">
              <Label className="mb-1.5 block">余额支付金额</Label>
              <Input
                type="number"
                value={balancePay}
                onChange={(e) => setBalancePay(e.target.value)}
                placeholder={`最多 ¥${member ? Math.min(Number(member.balance), totalAmount) : 0}`}
              />
              <p className="text-xs text-muted-foreground mt-1">
                其余 ¥{(totalAmount - Math.min(parseFloat(balancePay || "0"), Number(member?.balance || 0), totalAmount)).toFixed(2)} 用其他方式支付
              </p>
            </div>
          )}

          <div className="mb-4">
            <Label className="mb-1.5 block">操作员</Label>
            <Input value={operator} onChange={(e) => setOperator(e.target.value)} />
          </div>

          <Button onClick={handleSubmit} className="w-full" size="lg" disabled={!member || cart.length === 0}>
            <ShoppingCart className="w-4 h-4 mr-2" />
            确认结算
          </Button>
        </div>
      </div>
    </div>
  );
}
