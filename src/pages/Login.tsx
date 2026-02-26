import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scissors, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast({ title: "请输入账号和密码", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) {
      toast({ title: "登录失败", description: "账号或密码错误", variant: "destructive" });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4">
            <Scissors className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">理发店管理系统</h1>
          <p className="text-sm text-muted-foreground mt-1">请使用员工账号登录</p>
        </div>

        <form onSubmit={handleLogin} className="bg-card rounded-xl border border-border p-6 space-y-4">
          <div>
            <Label>账号（邮箱）</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="employee@shop.com"
              className="mt-1"
              autoComplete="email"
              maxLength={255}
            />
          </div>
          <div>
            <Label>密码</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="输入密码"
              className="mt-1"
              autoComplete="current-password"
              maxLength={128}
            />
          </div>
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            <LogIn className="w-4 h-4 mr-2" />
            {loading ? "登录中..." : "登录"}
          </Button>
        </form>

        <p className="text-xs text-muted-foreground text-center mt-4">
          如需开通账号，请联系管理员
        </p>
      </div>
    </div>
  );
}
