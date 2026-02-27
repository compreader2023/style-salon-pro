import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { KeyRound } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ChangePasswordDialog({ open, onOpenChange }: Props) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      toast({ title: "请填写完整信息", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "密码至少6位", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "两次输入的密码不一致", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast({ title: "修改失败", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "密码修改成功" });
      setNewPassword("");
      setConfirmPassword("");
      onOpenChange(false);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>修改密码</DialogTitle>
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
          <div>
            <Label>确认新密码 *</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="再次输入新密码"
              className="mt-1"
              maxLength={128}
            />
          </div>
          <Button onClick={handleSubmit} className="w-full" disabled={loading}>
            <KeyRound className="w-4 h-4 mr-1.5" />
            {loading ? "修改中..." : "确认修改"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
