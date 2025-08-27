import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, MessageSquare, TrendingUp, User, Menu, X } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: MessageSquare, label: 'Chat', path: '/chat' },
    { icon: TrendingUp, label: 'Mood Tracker', path: '/mood-tracker' },
    { icon: User, label: 'Profile', path: '/profile' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Mobile Navigation Header */}
      <div className="fixed top-0 left-0 right-0 z-40 bg-card/90 backdrop-blur-sm border-b border-border/50 p-4 flex justify-between items-center md:hidden">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(!isOpen)}
            className="h-9 w-9"
          >
            {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
          <h1 className="font-semibold text-lg">MindCare</h1>
        </div>
        <ThemeToggle />
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-sm border-t border-border/50 p-2 md:hidden">
        <div className="flex justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.path}
                variant={isActive(item.path) ? "default" : "ghost"}
                size="sm"
                className={`
                  flex flex-col gap-1 h-12 w-16 p-1
                  ${isActive(item.path) 
                    ? 'bg-gradient-wellness text-primary-foreground' 
                    : 'text-muted-foreground'
                  }
                `}
                onClick={() => {
                  navigate(item.path);
                  setIsOpen(false);
                }}
              >
                <Icon className="h-4 w-4" />
                <span className="text-xs">{item.label}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Navigation Sidebar */}
      <nav className={`
        fixed top-0 left-0 h-full w-72 bg-card/95 backdrop-blur-sm border-r border-border/50 z-50
        transform transition-transform duration-300 ease-gentle
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:w-64 md:relative md:h-screen
      `}>
        <div className="p-6 pt-16 md:pt-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-gradient-wellness rounded-full flex items-center justify-center">
              <MessageSquare className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h1 className="font-semibold text-lg text-foreground">MindCare</h1>
              <p className="text-sm text-muted-foreground">Your Mental Health Companion</p>
            </div>
            <div className="hidden md:block">
              <ThemeToggle />
            </div>
          </div>

          <div className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.path}
                  variant={isActive(item.path) ? "default" : "ghost"}
                  className={`
                    w-full justify-start gap-3 h-12 transition-gentle
                    ${isActive(item.path) 
                      ? 'bg-gradient-wellness text-primary-foreground shadow-soft' 
                      : 'hover:bg-accent/50'
                    }
                  `}
                  onClick={() => {
                    navigate(item.path);
                    setIsOpen(false);
                  }}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Button>
              );
            })}
          </div>
        </div>

        <div className="absolute bottom-6 left-6 right-6">
          <div className="bg-gradient-calm p-4 rounded-lg border border-border/50">
            <p className="text-sm text-muted-foreground mb-2">Need immediate help?</p>
            <Button variant="outline" size="sm" className="w-full">
              Crisis Support
            </Button>
          </div>
        </div>
      </nav>

      {/* Content Spacer for Desktop */}
      <div className="hidden md:block w-64 flex-shrink-0" />
    </>
  );
};

export default Navigation;