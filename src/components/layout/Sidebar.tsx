
import React from "react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  ArrowUpDown, 
  PieChart, 
  Target, 
  User,
  Settings,
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

const Sidebar: React.FC = () => {
  const isMobile = useIsMobile();
  const [isCollapsed, setIsCollapsed] = React.useState(isMobile);

  React.useEffect(() => {
    setIsCollapsed(isMobile);
  }, [isMobile]);

  const navItems = [
    {
      title: "Dashboard",
      href: "/",
      icon: <LayoutDashboard className="h-5 w-5" />
    },
    {
      title: "Transactions",
      href: "/transactions",
      icon: <ArrowUpDown className="h-5 w-5" />
    },
    {
      title: "Reports",
      href: "/reports",
      icon: <PieChart className="h-5 w-5" />
    },
    {
      title: "Budgets",
      href: "/budgets",
      icon: <Target className="h-5 w-5" />
    },
    {
      title: "Profile",
      href: "/profile",
      icon: <User className="h-5 w-5" />
    },
    {
      title: "Settings",
      href: "/settings",
      icon: <Settings className="h-5 w-5" />
    }
  ];

  return (
    <div
      className={cn(
        "bg-sidebar h-[calc(100vh-4rem)] border-r border-border transition-all duration-300 flex flex-col",
        isCollapsed ? "w-[4.5rem]" : "w-64"
      )}
    >
      <div className="flex justify-end p-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="h-8 w-8"
        >
          {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </Button>
      </div>

      <nav className="flex-1 py-4">
        <ul className="flex flex-col gap-1 px-2">
          {navItems.map((item) => (
            <li key={item.href}>
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground"
                  )
                }
              >
                {item.icon}
                {!isCollapsed && <span>{item.title}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t border-border mt-auto">
        <div className={cn(
          "flex flex-col gap-2 rounded-lg bg-sidebar-accent p-4",
          isCollapsed && "items-center"
        )}>
          {!isCollapsed && (
            <>
              <h4 className="font-medium text-sidebar-foreground">Need help?</h4>
              <p className="text-sm text-sidebar-foreground/80 mb-2">
                Check our documentation for help with your finances
              </p>
            </>
          )}
          <Button 
            size={isCollapsed ? "icon" : "default"} 
            className={cn("w-full", isCollapsed && "w-8 h-8")}
          >
            {isCollapsed ? (
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <path d="M12 17h.01" />
              </svg>
            ) : (
              "View Documentation"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
