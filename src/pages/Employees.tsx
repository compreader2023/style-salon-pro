import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { KeyRound, Trash2, Ban, CheckCircle, UserPlus, Shield, User } from "lucide-react";
import AddEmployeeDialog from "@/components/AddEmployeeDialog";
import { Navigate } from "react-router-dom";

interface Employee {
  id: string;
  email: string;
  display_name: string;
  role: string;
  created_at: string;
  banned_until: string | null;
}

export default function Employees() {
  const { user, profile } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [resetTarget, setResetTarget] = useState<Employee | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();

  const fetchEmployees = useCallback(async () => {
    const res = await supabase.functions.invoke("manage-employee", {
      body: { action: "list_users" },
    });
    if (res.data?.users) {
      setEmployees(res.data.users);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (profile?.role === "admin") {
      fetchEmployees();
    }
  }, [fetchEmployees, profile?.role]);

  if (profile?.role !== "admin") return <Navigate to="/" replace />;

  const handleAction = async (action: string, userId: string, extra?: Record<string, string>) => {
    setActionLoading(true);
    const res = await supabase.functions.invoke("manage-employee", {
      body: { action, user_id: userId, ...extra },
    });
    if (res.data?.error || res.error) {
      toast({ title: "操作失败", description: res.data?.error || res.error?.message, variant: "destructive" });
    } else {
      toast({ title: "操作成功" });
      fetchEmployees();
    }
    setActionLoading(false);
  };

  const handleResetPassword = async () => {
    if (!resetTarget || !newPassword.trim()) return;
    if (newPassword.length < 6) {
      toast({ title: "密码至少6位", variant: "destructive" });
      return;
    }
    await handleAction("reset_password", resetTarget.id, { password: newPassword });
    setResetTarget(null);
    setNewPassword("");
  };

  const handleToggleRole = async (emp: Employee) => {
    const newRole = emp.role === "admin" ? "staff" : "admin";
    await handleAction("update_profile", emp.id, { role: newRole });
  };

  const isBanned = (emp: Employee) => {
    if (!emp.banned_until) return false;
    return new Date(emp.banned_until) > new Date();
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-foreground">员工管理</h2>
          <p className="text-sm text-muted-foreground mt-1">管理系统用户账号</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} size="sm" className="md:size-default">
          <UserPlus className="w-4 h-4 mr-1.5" />
          <span className="hidden sm:inline">添加员工</span>
          <span className="sm:hidden">添加</span>
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid gap-3">
          {employees.map((emp) => {
            const banned = isBanned(emp);
            const isSelf = emp.id === user?.id;
            return (
              <div
                key={emp.id}
                className={`bg-card border border-border rounded-xl p-4 ${banned ? "opacity-60" : ""}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${emp.role === "admin" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {emp.role === "admin" ? <Shield className="w-5 h-5" /> : <User className="w-5 h-5" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-foreground truncate">{emp.display_name}</span>
                        {isSelf && <Badge variant="outline" className="text-xs">我</Badge>}
                        {banned && <Badge variant="destructive" className="text-xs">已停用</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">{emp.email}</p>
                    </div>
                  </div>

                  <Badge variant={emp.role === "admin" ? "default" : "secondary"} className="shrink-0">
                    {emp.role === "admin" ? "管理员" : "店员"}
                  </Badge>
                </div>

                {!isSelf && (
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setResetTarget(emp); setNewPassword(""); }}
                    >
                      <KeyRound className="w-3.5 h-3.5 mr-1" />
                      重置密码
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleRole(emp)}
                      disabled={actionLoading}
                    >
                      <Shield className="w-3.5 h-3.5 mr-1" />
                      {emp.role === "admin" ? "降为店员" : "升为管理员"}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAction(banned ? "enable_user" : "disable_user", emp.id)}
                      disabled={actionLoading}
                    >
                      {banned ? <CheckCircle className="w-3.5 h-3.5 mr-1 text-primary" /> : <Ban className="w-3.5 h-3.5 mr-1 text-destructive" />}
                      {banned ? "启用" : "停用"}
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-destructive border-destructive/30">
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                          删除
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>确认删除</AlertDialogTitle>
                          <AlertDialogDescription>
                            确定要删除员工「{emp.display_name}」的账号吗？此操作不可恢复。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>取消</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleAction("delete_user", emp.id)}>
                            确认删除
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <AddEmployeeDialog open={showAddDialog} onOpenChange={(v) => { setShowAddDialog(v); if (!v) fetchEmployees(); }} />

      <Dialog open={!!resetTarget} onOpenChange={(v) => { if (!v) setResetTarget(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>重置密码 - {resetTarget?.display_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <Label>新密码 *</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="至少6位"
                className="mt-1"
                maxLength={128}
              />
            </div>
            <Button onClick={handleResetPassword} className="w-full" disabled={actionLoading}>
              <KeyRound className="w-4 h-4 mr-1.5" />
              {actionLoading ? "重置中..." : "确认重置"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
