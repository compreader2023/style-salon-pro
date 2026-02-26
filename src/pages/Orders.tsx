import { useEffect, useState } from "react";
import { Search, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface RechargeRow {
  id: string;
  amount: number;
  bonus: number;
  payment_method: string;
  operator_name: string;
  created_at: string;
  members: { name: string; member_no: string } | null;
}

interface ConsumptionRow {
  id: string;
  total_amount: number;
  balance_paid: number;
  other_paid: number;
  payment_method: string;
  operator_name: string;
  is_refunded: boolean;
  refund_note: string | null;
  created_at: string;
  members: { name: string; member_no: string } | null;
}

const payLabels: Record<string, string> = {
  cash: "现金", wechat: "微信", alipay: "支付宝", card: "刷卡", balance: "余额", mixed: "混合",
};

export default function Orders() {
  const [tab, setTab] = useState("consumption");
  const [recharges, setRecharges] = useState<RechargeRow[]>([]);
  const [consumptions, setConsumptions] = useState<ConsumptionRow[]>([]);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [refundDialog, setRefundDialog] = useState<string | null>(null);
  const [refundNote, setRefundNote] = useState("");
  const { toast } = useToast();

  const fetchRecharges = async () => {
    let q = supabase.from("recharge_records").select("*, members(name, member_no)").order("created_at", { ascending: false }).limit(100);
    if (search) q = q.or(`members.member_no.ilike.%${search}%`, { referencedTable: "members" });
    if (dateFrom) q = q.gte("created_at", dateFrom);
    if (dateTo) q = q.lte("created_at", dateTo + "T23:59:59");
    const { data } = await q;
    setRecharges((data as unknown as RechargeRow[])?.filter(r => r.members) || []);
  };

  const fetchConsumptions = async () => {
    let q = supabase.from("consumption_records").select("*, members(name, member_no)").order("created_at", { ascending: false }).limit(100);
    if (dateFrom) q = q.gte("created_at", dateFrom);
    if (dateTo) q = q.lte("created_at", dateTo + "T23:59:59");
    const { data } = await q;
    setConsumptions((data as unknown as ConsumptionRow[])?.filter(r => r.members) || []);
  };

  useEffect(() => { fetchRecharges(); fetchConsumptions(); }, [search, dateFrom, dateTo]);

  const handleRefund = async () => {
    if (!refundDialog) return;
    await supabase.from("consumption_records").update({ is_refunded: true, refund_note: refundNote }).eq("id", refundDialog);
    toast({ title: "已标记退款" });
    setRefundDialog(null);
    setRefundNote("");
    fetchConsumptions();
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">订单查询</h1>
        <p className="text-sm text-muted-foreground mt-1">查看充值和消费记录</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索会员号..." className="pl-9" />
        </div>
        <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" />
        <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" />
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="consumption">消费记录</TabsTrigger>
          <TabsTrigger value="recharge">充值记录</TabsTrigger>
        </TabsList>

        <TabsContent value="consumption">
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">时间</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">会员</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">总额</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">余额扣</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">其他</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">支付</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">操作员</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">状态</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {consumptions.map((c) => (
                    <tr key={c.id} className="border-b border-border last:border-0 hover:bg-accent/30">
                      <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(c.created_at).toLocaleString("zh-CN")}</td>
                      <td className="px-4 py-3">
                        <span className="font-medium">{c.members?.name}</span>
                        <span className="text-xs text-muted-foreground ml-1">{c.members?.member_no}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">¥{c.total_amount}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">¥{c.balance_paid}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">¥{c.other_paid}</td>
                      <td className="px-4 py-3 text-muted-foreground">{payLabels[c.payment_method] || c.payment_method}</td>
                      <td className="px-4 py-3 text-muted-foreground">{c.operator_name}</td>
                      <td className="px-4 py-3 text-center">
                        {c.is_refunded ? (
                          <span className="text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">已退款</span>
                        ) : (
                          <span className="text-xs bg-success/10 text-success px-2 py-0.5 rounded-full">正常</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {!c.is_refunded && (
                          <Button variant="ghost" size="sm" onClick={() => setRefundDialog(c.id)}>
                            <RefreshCw className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {consumptions.length === 0 && (
                    <tr><td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">暂无消费记录</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="recharge">
          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">时间</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">会员</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">充值额</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">赠送额</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">支付方式</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">操作员</th>
                  </tr>
                </thead>
                <tbody>
                  {recharges.map((r) => (
                    <tr key={r.id} className="border-b border-border last:border-0 hover:bg-accent/30">
                      <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString("zh-CN")}</td>
                      <td className="px-4 py-3">
                        <span className="font-medium">{r.members?.name}</span>
                        <span className="text-xs text-muted-foreground ml-1">{r.members?.member_no}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">¥{r.amount}</td>
                      <td className="px-4 py-3 text-right text-success font-semibold">+¥{r.bonus}</td>
                      <td className="px-4 py-3 text-muted-foreground">{payLabels[r.payment_method] || r.payment_method}</td>
                      <td className="px-4 py-3 text-muted-foreground">{r.operator_name}</td>
                    </tr>
                  ))}
                  {recharges.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">暂无充值记录</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={!!refundDialog} onOpenChange={() => setRefundDialog(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>标记退款</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground">此操作仅标记退款状态，不涉及资金操作。</p>
            <div>
              <Label>退款备注</Label>
              <Textarea value={refundNote} onChange={(e) => setRefundNote(e.target.value)} placeholder="退款原因..." className="mt-1" rows={2} />
            </div>
            <Button onClick={handleRefund} variant="destructive" className="w-full">确认标记退款</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
