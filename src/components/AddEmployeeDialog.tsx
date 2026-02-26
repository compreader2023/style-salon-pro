import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { UserPlus } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddEmployeeDialog({ open, onOpenChange }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { profile } = useAuth();

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim() || !displayName.trim()) {
      toast({ title: "请填写完整信息", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "密码至少6位", variant: "destructive" });
      return;
    }

    setLoading(true);

    // Use edge function to create user (since signup is disabled)
    const { data: { session } } = await supabase.auth.getSession();
    const res = await supabase.functions.invoke("create-employee", {
      body: { email: email.trim(), password, display_name: displayName.trim() },
    });

    if (res.error) {
      toast({ title: "创建失败", description: res.error.message, variant: "destructive" });
    } else if (res.data?.error) {
      toast({ title: "创建失败", description: res.data.error, variant: "destructive" });
    } else {
      toast({ title: "员工账号创建成功" });
      setEmail("");
      setPassword("");
      setDisplayName("");
      onOpenChange(false);
    }
    setLoading(false);
  };

  if (profile?.role !== "admin") return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>添加员工账号</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label>姓名 *</Label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="员工姓名" className="mt-1" maxLength={50} />
          </div>
          <div>
            <Label>邮箱账号 *</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="employee@shop.com" className="mt-1" maxLength={255} />
          </div>
          <div>
            <Label>初始密码 *</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="至少6位" className="mt-1" maxLength={128} />
          </div>
          <Button onClick={handleSubmit} className="w-full" disabled={loading}>
            <UserPlus className="w-4 h-4 mr-1.5" />
            {loading ? "创建中..." : "创建账号"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
