import { Link, useLocation } from "react-router-dom";
import { Home, MessageCircle, BarChart3, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import ThemeToggle from "@/components/ThemeToggle";

const Navigation = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();

  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: MessageCircle, label: "Chat", path: "/chat" },
    { icon: BarChart3, label: "Mood", path: "/mood-tracker" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className="hidden md:flex md:flex-col md:w-64 bg-card border-r border-border">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-8">
            <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
              <span className="text-xl">🧠</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">MindCare</h1>
              <p className="text-xs text-muted-foreground">Mental Wellness</p>
            </div>
          </div>

          {/* User Info */}
          {user && (
            <div className="mb-6 p-3 bg-muted/50 rounded-lg">
              <p className="text-sm font-medium text-foreground truncate">
                {user.user_metadata?.display_name || user.email}
              </p>
              <p className="text-xs text-muted-foreground">
                Welcome back!
              </p>
            </div>
          )}

          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive(item.path)
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom section */}
        <div className="mt-auto p-6 border-t border-border">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-muted-foreground">Theme</span>
            <ThemeToggle />
          </div>
          <Button
            onClick={signOut}
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4 mr-3" />
            Sign Out
          </Button>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors ${
                isActive(item.path)
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Mobile Top Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-b border-border z-40">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
              <span className="text-lg">🧠</span>
            </div>
            <h1 className="text-lg font-bold text-foreground">MindCare</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            <Button
              onClick={signOut}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>
    </>
  );
};

export default Navigation;