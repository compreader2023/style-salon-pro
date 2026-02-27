import { NavLink, useLocation } from "react-router-dom";
import { Home, Users, CreditCard, ShoppingCart, FileText, Scissors, LogOut, KeyRound, UsersRound } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import ChangePasswordDialog from "@/components/ChangePasswordDialog";

const navItems = [
  { to: "/", label: "首页", icon: Home },
  { to: "/members", label: "会员", icon: Users },
  { to: "/recharge", label: "充值", icon: CreditCard },
  { to: "/checkout", label: "消费", icon: ShoppingCart },
  { to: "/orders", label: "订单", icon: FileText },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const [showChangePassword, setShowChangePassword] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-60 bg-sidebar text-sidebar-foreground flex flex-col shrink-0">
        <div className="p-5 flex items-center gap-3 border-b border-sidebar-border">
          <div className="w-10 h-10 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <Scissors className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="text-base font-semibold text-sidebar-foreground">理发店管理</h1>
            <p className="text-xs text-sidebar-foreground/50">会员管理系统</p>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <item.icon className="w-4.5 h-4.5" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="p-3 border-t border-sidebar-border space-y-1">
          {profile?.role === "admin" && (
            <NavLink
              to="/employees"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === "/employees"
                  ? "bg-sidebar-primary text-sidebar-primary-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <UsersRound className="w-4.5 h-4.5" />
              员工管理
            </NavLink>
          )}
          <button
            onClick={() => setShowChangePassword(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
          >
            <KeyRound className="w-4.5 h-4.5" />
            修改密码
          </button>
          <div className="flex items-center justify-between px-3 py-2">
            <div>
              <p className="text-sm font-medium text-sidebar-foreground">{profile?.display_name || "员工"}</p>
              <p className="text-xs text-sidebar-foreground/40">{profile?.role === "admin" ? "管理员" : "店员"}</p>
            </div>
            <button onClick={signOut} className="text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors" title="退出登录">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-6xl mx-auto animate-fade-in">
          {children}
        </div>
      </main>

      <ChangePasswordDialog open={showChangePassword} onOpenChange={setShowChangePassword} />
    </div>
  );
}
