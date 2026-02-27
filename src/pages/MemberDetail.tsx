import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Wallet, TrendingUp, CreditCard, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

type Member = Tables<"members">;
type RechargeRecord = Tables<"recharge_records">;
type ConsumptionRecord = Tables<"consumption_records">;
type ConsumptionItem = Tables<"consumption_items">;

interface ConsumptionWithItems extends ConsumptionRecord {
  items: ConsumptionItem[];
}

export default function MemberDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [member, setMember] = useState<Member | null>(null);
  const [recharges, setRecharges] = useState<RechargeRecord[]>([]);
  const [consumptions, setConsumptions] = useState<ConsumptionWithItems[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      const [memberRes, rechargeRes, consumptionRes] = await Promise.all([
        supabase.from("members").select("*").eq("id", id).single(),
        supabase.from("recharge_records").select("*").eq("member_id", id).order("created_at", { ascending: false }),
        supabase.from("consumption_records").select("*").eq("member_id", id).order("created_at", { ascending: false }),
      ]);
      setMember(memberRes.data);
      setRecharges(rechargeRes.data || []);

      // Load consumption items for each record
      const records = consumptionRes.data || [];
      if (records.length > 0) {
        const { data: items } = await supabase
          .from("consumption_items")
          .select("*")
          .in("consumption_id", records.map(r => r.id));
        const itemMap = new Map<string, ConsumptionItem[]>();
        (items || []).forEach(item => {
          const arr = itemMap.get(item.consumption_id) || [];
          arr.push(item);
          itemMap.set(item.consumption_id, arr);
        });
        setConsumptions(records.map(r => ({ ...r, items: itemMap.get(r.id) || [] })));
      } else {
        setConsumptions([]);
      }
      setLoading(false);
    };
    load();
  }, [id]);

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" }) +
      " " + date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
  };

  const payMethodLabel: Record<string, string> = {
    balance: "余额", cash: "现金", wechat: "微信", alipay: "支付宝", card: "刷卡", mixed: "混合",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!member) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground mb-4">会员不存在</p>
        <Button variant="outline" onClick={() => navigate("/members")}>返回会员列表</Button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 md:mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate("/members")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-foreground">{member.name}</h1>
          <p className="text-sm text-muted-foreground">{member.member_no} · {member.phone}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4 md:mb-6">
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <Wallet className="w-5 h-5 text-primary mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">余额</p>
          <p className="text-lg font-bold text-primary">¥{Number(member.balance).toFixed(2)}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <TrendingUp className="w-5 h-5 text-green-500 mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">累计充值</p>
          <p className="text-lg font-bold">¥{Number(member.total_recharged).toFixed(2)}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 text-center">
          <CreditCard className="w-5 h-5 text-orange-500 mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">累计消费</p>
          <p className="text-lg font-bold">¥{Number(member.total_spent).toFixed(2)}</p>
        </div>
      </div>

      {member.notes && (
        <div className="bg-accent rounded-lg p-3 mb-4 text-sm text-muted-foreground">
          备注：{member.notes}
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="consumption" className="w-full">
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="consumption">消费记录 ({consumptions.length})</TabsTrigger>
          <TabsTrigger value="recharge">充值记录 ({recharges.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="consumption" className="mt-4 space-y-3">
          {consumptions.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">暂无消费记录</p>
          ) : consumptions.map((c) => (
            <div key={c.id} className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-xs text-muted-foreground">{formatDate(c.created_at)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">操作员：{c.operator_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-foreground">¥{Number(c.total_amount).toFixed(2)}</p>
                  <div className="flex items-center gap-1 justify-end mt-0.5">
                    <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                      {payMethodLabel[c.payment_method] || c.payment_method}
                    </Badge>
                    {c.is_refunded && (
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                        <RefreshCw className="w-2.5 h-2.5 mr-0.5" />已退款
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              {/* Items */}
              <div className="border-t border-border pt-2 space-y-1">
                {c.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{item.service_name} × {item.quantity}</span>
                    <span>¥{(Number(item.price) * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              {c.payment_method === "mixed" && (
                <div className="border-t border-border pt-2 mt-2 text-xs text-muted-foreground">
                  余额支付 ¥{Number(c.balance_paid).toFixed(2)}，其他 ¥{Number(c.other_paid).toFixed(2)}
                </div>
              )}
              {Number(c.balance_paid) > 0 && c.payment_method !== "mixed" && (
                <div className="border-t border-border pt-2 mt-2 text-xs text-muted-foreground">
                  余额支付 ¥{Number(c.balance_paid).toFixed(2)}
                </div>
              )}
              {c.refund_note && (
                <p className="text-xs text-destructive mt-1">退款备注：{c.refund_note}</p>
              )}
            </div>
          ))}
        </TabsContent>

        <TabsContent value="recharge" className="mt-4 space-y-3">
          {recharges.length === 0 ? (
            <p className="text-center text-muted-foreground py-8 text-sm">暂无充值记录</p>
          ) : recharges.map((r) => (
            <div key={r.id} className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{formatDate(r.created_at)}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">操作员：{r.operator_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">+¥{Number(r.amount).toFixed(2)}</p>
                  {Number(r.bonus) > 0 && (
                    <p className="text-xs text-primary">赠送 ¥{Number(r.bonus).toFixed(2)}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {payMethodLabel[r.payment_method] || r.payment_method}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  到账 ¥{(Number(r.amount) + Number(r.bonus)).toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
