import { useEffect, useState } from "react";
import { Plus, Search, Edit2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type Member = Tables<"members">;

export default function Members() {
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", notes: "" });
  const { toast } = useToast();
  const pageSize = 15;

  const fetchMembers = async () => {
    let query = supabase.from("members").select("*", { count: "exact" });
    if (search) {
      query = query.or(`member_no.ilike.%${search}%,phone.ilike.%${search}%,name.ilike.%${search}%`);
    }
    const { data, count } = await query
      .order("created_at", { ascending: false })
      .range(page * pageSize, (page + 1) * pageSize - 1);
    setMembers(data || []);
    setTotal(count || 0);
  };

  useEffect(() => { fetchMembers(); }, [search, page]);

  const handleSubmit = async () => {
    if (!form.name || !form.phone) {
      toast({ title: "请填写姓名和手机号", variant: "destructive" });
      return;
    }
    if (editing) {
      await supabase.from("members").update({ name: form.name, phone: form.phone, notes: form.notes }).eq("id", editing.id);
      toast({ title: "会员信息已更新" });
    } else {
      await supabase.from("members").insert({ name: form.name, phone: form.phone, notes: form.notes });
      toast({ title: "会员注册成功" });
    }
    setDialogOpen(false);
    setEditing(null);
    setForm({ name: "", phone: "", notes: "" });
    fetchMembers();
  };

  const openEdit = (m: Member) => {
    setEditing(m);
    setForm({ name: m.name, phone: m.phone, notes: m.notes || "" });
    setDialogOpen(true);
  };

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", phone: "", notes: "" });
    setDialogOpen(true);
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">会员管理</h1>
          <p className="text-sm text-muted-foreground mt-1">共 {total} 位会员</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4 mr-1.5" />
          新增会员
        </Button>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          placeholder="搜索会员号、姓名或手机号..."
          className="pl-9"
        />
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">会员号</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">姓名</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">手机号</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">余额</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">累计消费</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">备注</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">注册时间</th>
                <th className="text-center px-4 py-3 font-medium text-muted-foreground">操作</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-primary font-semibold">{m.member_no}</td>
                  <td className="px-4 py-3 font-medium">{m.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{m.phone}</td>
                  <td className="px-4 py-3 text-right font-semibold">¥{Number(m.balance).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-muted-foreground">¥{Number(m.total_spent).toFixed(2)}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs max-w-[120px] truncate">{m.notes || "-"}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(m.created_at).toLocaleDateString("zh-CN")}</td>
                  <td className="px-4 py-3 text-center">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(m)}>
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
              {members.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">暂无会员数据</td></tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-xs text-muted-foreground">第 {page + 1}/{totalPages} 页</p>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>上一页</Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>下一页</Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "编辑会员" : "新增会员"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>姓名 *</Label>
              <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} placeholder="会员姓名" className="mt-1" />
            </div>
            <div>
              <Label>手机号 *</Label>
              <Input value={form.phone} onChange={(e) => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="手机号" className="mt-1" />
            </div>
            <div>
              <Label>备注</Label>
              <Textarea value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="如：偏爱短发" className="mt-1" rows={2} />
            </div>
            <Button onClick={handleSubmit} className="w-full">{editing ? "保存修改" : "注册会员"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
