import { NavLink, useLocation } from "react-router-dom";
import { Home, Users, CreditCard, ShoppingCart, FileText, Scissors, LogOut, KeyRound, UsersRound, Menu, X } from "lucide-react";
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 bg-sidebar text-sidebar-foreground flex-col shrink-0">
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

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-sidebar text-sidebar-foreground border-b border-sidebar-border">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
              <Scissors className="w-4 h-4 text-sidebar-primary-foreground" />
            </div>
            <span className="text-sm font-semibold text-sidebar-foreground">理发店管理</span>
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-sidebar-foreground/70">
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="border-t border-sidebar-border bg-sidebar px-3 pb-3 space-y-1">
            {profile?.role === "admin" && (
              <NavLink
                to="/employees"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === "/employees"
                    ? "bg-sidebar-primary text-sidebar-primary-foreground"
                    : "text-sidebar-foreground/70"
                }`}
              >
                <UsersRound className="w-4.5 h-4.5" />
                员工管理
              </NavLink>
            )}
            <button
              onClick={() => { setShowChangePassword(true); setMobileMenuOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70"
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
        )}
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-bottom">
        <div className="flex items-center justify-around h-14">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`flex flex-col items-center gap-0.5 px-2 py-1.5 text-xs font-medium transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            );
          })}
        </div>
      </nav>

      <main className="flex-1 overflow-auto md:pt-0 pt-14 pb-16 md:pb-0">
        <div className="p-4 md:p-6 max-w-6xl mx-auto animate-fade-in">
          {children}
        </div>
      </main>

      <ChangePasswordDialog open={showChangePassword} onOpenChange={setShowChangePassword} />
    </div>
  );
}
