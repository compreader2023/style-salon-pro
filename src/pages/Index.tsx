import { useEffect, useState } from "react";
import { Users, CreditCard, ShoppingCart, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import StatCard from "@/components/StatCard";

interface Stats {
  todayRecharge: number;
  todayConsumption: number;
  monthRecharge: number;
  monthConsumption: number;
  newMembersToday: number;
  newMembersMonth: number;
  totalMembers: number;
}

export default function Index() {
  const [stats, setStats] = useState<Stats>({
    todayRecharge: 0, todayConsumption: 0, monthRecharge: 0,
    monthConsumption: 0, newMembersToday: 0, newMembersMonth: 0, totalMembers: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      const [rechargeToday, rechargeMonth, consumeToday, consumeMonth, membersToday, membersMonth, totalMembers] =
        await Promise.all([
          supabase.from("recharge_records").select("amount").gte("created_at", todayStart),
          supabase.from("recharge_records").select("amount").gte("created_at", monthStart),
          supabase.from("consumption_records").select("total_amount,is_refunded").gte("created_at", todayStart),
          supabase.from("consumption_records").select("total_amount,is_refunded").gte("created_at", monthStart),
          supabase.from("members").select("id", { count: "exact", head: true }).gte("created_at", todayStart),
          supabase.from("members").select("id", { count: "exact", head: true }).gte("created_at", monthStart),
          supabase.from("members").select("id", { count: "exact", head: true }),
        ]);

      setStats({
        todayRecharge: rechargeToday.data?.reduce((s, r) => s + r.amount, 0) || 0,
        monthRecharge: rechargeMonth.data?.reduce((s, r) => s + r.amount, 0) || 0,
        todayConsumption: consumeToday.data?.filter(c => !c.is_refunded).reduce((s, r) => s + r.total_amount, 0) || 0,
        monthConsumption: consumeMonth.data?.filter(c => !c.is_refunded).reduce((s, r) => s + r.total_amount, 0) || 0,
        newMembersToday: membersToday.count || 0,
        newMembersMonth: membersMonth.count || 0,
        totalMembers: totalMembers.count || 0,
      });
    };
    fetchStats();
  }, []);

  return (
    <div>
      <div className="mb-4 md:mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-foreground">仪表盘</h1>
        <p className="text-sm text-muted-foreground mt-1">今日运营数据概览</p>
      </div>

      <div className="mb-4">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">今日数据</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <StatCard title="今日充值" value={`¥${stats.todayRecharge.toFixed(2)}`} icon={CreditCard} />
          <StatCard title="今日消费" value={`¥${stats.todayConsumption.toFixed(2)}`} icon={ShoppingCart} />
          <StatCard title="今日新会员" value={stats.newMembersToday} icon={UserPlus} />
          <StatCard title="总会员数" value={stats.totalMembers} icon={Users} />
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">本月数据</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          <StatCard title="本月充值" value={`¥${stats.monthRecharge.toFixed(2)}`} icon={CreditCard} description="本月充值总额" />
          <StatCard title="本月消费" value={`¥${stats.monthConsumption.toFixed(2)}`} icon={ShoppingCart} description="本月消费总额" />
          <StatCard title="本月新会员" value={stats.newMembersMonth} icon={UserPlus} description="本月新注册会员" />
        </div>
      </div>
    </div>
  );
}
